import Quota from '#models/quota'

const DAY_MS = 24 * 60 * 60 * 1000
const PG_UNIQUE_VIOLATION = '23505'

type QuotaUsage = Pick<
  InstanceType<typeof Quota>,
  | 'storageBytes'
  | 'storageBytesLimit'
  | 'objectCount'
  | 'objectCountLimit'
  | 'downloadCount'
  | 'downloadCountLimit'
  | 'uploadCount'
  | 'uploadCountLimit'
>

function toUsage(q: Quota): QuotaUsage {
  return {
    storageBytes: q.storageBytes,
    storageBytesLimit: q.storageBytesLimit,
    objectCount: q.objectCount,
    objectCountLimit: q.objectCountLimit,
    downloadCount: q.downloadCount,
    downloadCountLimit: q.downloadCountLimit,
    uploadCount: q.uploadCount,
    uploadCountLimit: q.uploadCountLimit,
  }
}

// Depending on the Lucid version, bulk update/increment resolves to a number or number[].
function affectedRows(result: unknown): number {
  return Array.isArray(result) ? Number(result[0] ?? 0) : Number(result ?? 0)
}

// Knex increments take a JS number: refuse anything that would lose precision.
function toSafeNumber(value: bigint, label: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} is out of range`)
  }
  return Number(value)
}

function assertNonNegative(value: bigint, label: string) {
  if (value < 0n) throw new Error(`${label} must be non-negative`)
}

/**
 * Creates the quota row on first use. Relies on the UNIQUE(user_id) constraint:
 * if two requests race, one insert fails with a unique violation and is ignored.
 */
async function ensureQuota(userId: string): Promise<void> {
  const existing = await Quota.query().where('user_id', userId).first()
  if (existing) return
  try {
    await Quota.create({ userId })
  } catch (error) {
    if ((error as { code?: string }).code !== PG_UNIQUE_VIOLATION) throw error
  }
}

/**
 * Atomic reset: the WHERE clause only matches when the window has expired.
 * If two pods run it at the same time, the second one re-evaluates the WHERE
 * after the first commits and affects 0 rows, so a counter is never reset twice.
 */
async function resetExpiredCounters(userId: string): Promise<void> {
  const now = new Date()
  const next = new Date(now.getTime() + DAY_MS)

  await Quota.query()
    .where('user_id', userId)
    .where((q) =>
      q.whereNull('download_count_reset_at').orWhere('download_count_reset_at', '<=', now)
    )
    .update({ download_count: 0, download_count_reset_at: next, updated_at: now })

  await Quota.query()
    .where('user_id', userId)
    .where((q) => q.whereNull('upload_count_reset_at').orWhere('upload_count_reset_at', '<=', now))
    .update({ upload_count: 0, upload_count_reset_at: next, updated_at: now })
}

async function readQuota(userId: string): Promise<Quota> {
  await ensureQuota(userId)
  await resetExpiredCounters(userId)
  return await Quota.query().where('user_id', userId).firstOrFail()
}

/**
 * Called when a conditional update matched no row. The decision was already taken
 * by the database; this read is only used to return a meaningful error message.
 */
async function throwQuotaFailure(
  userId: string,
  check: { bytesDelta?: bigint; object?: boolean; upload?: boolean; download?: boolean }
): Promise<never> {
  const q = await Quota.query().where('user_id', userId).first()
  if (!q) throw new Error('Quota not found for user')

  if (
    check.bytesDelta !== undefined &&
    BigInt(q.storageBytes) + check.bytesDelta > BigInt(q.storageBytesLimit)
  ) {
    throw new Error('Storage bytes limit exceeded')
  }
  if (check.object && BigInt(q.objectCount) + 1n > BigInt(q.objectCountLimit)) {
    throw new Error('Object count limit exceeded')
  }
  if (check.upload && BigInt(q.uploadCount) + 1n > BigInt(q.uploadCountLimit)) {
    throw new Error('Upload count limit exceeded')
  }
  if (check.download && BigInt(q.downloadCount) + 1n > BigInt(q.downloadCountLimit)) {
    throw new Error('Download count limit exceeded')
  }
  // The state changed between the update and this read (concurrent reset or delete).
  throw new Error('Quota update conflict, please retry')
}

export async function QuotaGetUserQuota(userId: string): Promise<QuotaUsage | null> {
  return toUsage(await readQuota(userId))
}

export async function QuotaTryToUpload(userId: string, newObjectSize: bigint) {
  assertNonNegative(newObjectSize, 'Object size')
  await readQuota(userId) // creates the row and applies any pending reset

  const affected = affectedRows(
    await Quota.query()
      .where('user_id', userId)
      .whereRaw('storage_bytes + CAST(? AS BIGINT) <= storage_bytes_limit', [
        newObjectSize.toString(),
      ])
      .whereRaw('object_count + 1 <= object_count_limit')
      .whereRaw('upload_count + 1 <= upload_count_limit')
      .increment({
        storage_bytes: toSafeNumber(newObjectSize, 'Object size'),
        object_count: 1,
        upload_count: 1,
      })
  )

  if (!affected) {
    await throwQuotaFailure(userId, { bytesDelta: newObjectSize, object: true, upload: true })
  }
}

/** Best-effort pre-check (before receiving the file). It does NOT reserve anything. */
export async function QuotaVerifyForUpdate(userId: string, newObjectSize: bigint) {
  const q = await readQuota(userId)
  if (BigInt(q.storageBytes) + newObjectSize > BigInt(q.storageBytesLimit)) {
    throw new Error('Storage bytes limit exceeded')
  }
  return toUsage(q)
}

export async function QuotaTryToUpdate(
  userId: string,
  newObjectSize: bigint,
  oldObjectSize: bigint
) {
  assertNonNegative(newObjectSize, 'New object size')
  assertNonNegative(oldObjectSize, 'Old object size')
  await readQuota(userId)

  const delta = newObjectSize - oldObjectSize // may be negative (file got smaller)

  const affected = affectedRows(
    await Quota.query()
      .where('user_id', userId)
      .whereRaw('storage_bytes + CAST(? AS BIGINT) <= storage_bytes_limit', [delta.toString()])
      .whereRaw('storage_bytes + CAST(? AS BIGINT) >= 0', [delta.toString()])
      .whereRaw('upload_count + 1 <= upload_count_limit')
      .increment({
        storage_bytes: toSafeNumber(delta, 'Size delta'),
        upload_count: 1,
      })
  )

  if (!affected) {
    await throwQuotaFailure(userId, { bytesDelta: delta, upload: true })
  }
}

export async function QuotaTryToDownload(userId: string) {
  await readQuota(userId)

  const affected = affectedRows(
    await Quota.query()
      .where('user_id', userId)
      .whereRaw('download_count + 1 <= download_count_limit')
      .increment('download_count', 1)
  )

  if (!affected) {
    await throwQuotaFailure(userId, { download: true })
  }
}

export async function QuotaTryToDelete(userId: string, objectSize: bigint) {
  assertNonNegative(objectSize, 'Object size')
  await readQuota(userId)

  const affected = affectedRows(
    await Quota.query()
      .where('user_id', userId)
      .whereRaw('storage_bytes >= CAST(? AS BIGINT)', [objectSize.toString()])
      .whereRaw('object_count >= 1')
      .decrement({
        storage_bytes: toSafeNumber(objectSize, 'Object size'),
        object_count: 1,
      })
  )

  if (!affected) {
    const q = await Quota.query().where('user_id', userId).first()
    if (!q) throw new Error('Quota not found for user')
    if (BigInt(q.storageBytes) < objectSize) throw new Error('Storage bytes underflow')
    if (BigInt(q.objectCount) < 1n) throw new Error('Object count underflow')
    throw new Error('Quota update conflict, please retry')
  }
}