import Quota from '#models/quota'

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

/**
 * Utility functions for managing user quotas. class provides methods to check and update quotas during upload, download, and delete operations.
 * It also handles resetting daily counts based on the reset timestamps.
 * Exposed functions:
 * - QuotaGetUserQuota
 * - QuotaTryToUpload
 * - QuotaTryToUpdate
 * - QuotaTryToDownload
 * - QuotaTryToDelete
 */
function createQuotaUsage(quota: Quota, resetCount?: boolean): QuotaUsage {
  return {
    storageBytes: quota.storageBytes,
    storageBytesLimit: quota.storageBytesLimit,
    objectCount: quota.objectCount,
    objectCountLimit: quota.objectCountLimit,
    downloadCount: resetCount ? 0 : quota.downloadCount,
    downloadCountLimit: quota.downloadCountLimit,
    uploadCount: resetCount ? 0 : quota.uploadCount,
    uploadCountLimit: quota.uploadCountLimit,
  }
}

async function getOrCreateQuota(userId: number): Promise<Quota> {
  const existingQuota = await Quota.query().where('user_id', userId).first()

  if (existingQuota) {
    return existingQuota
  }

  return await Quota.create({ userId })
}

async function resetDailyCounts(userId: number): Promise<QuotaUsage> {
  await getOrCreateQuota(userId)
  const quotaRow = await Quota.query()
    .select(
      'storage_bytes',
      'storage_bytes_limit',
      'object_count',
      'object_count_limit',
      'download_count',
      'download_count_limit',
      'upload_count',
      'upload_count_limit',
      'download_count_reset_at',
      'upload_count_reset_at'
    )
    .where('user_id', userId)
    .first()

  if (!quotaRow) {
    throw new Error('Failed to fetch user quota')
  }

  const now = new Date()
  const toJSDateIfNeeded = (v: any) => {
    if (!v) return null
    if (typeof v.toJSDate === 'function') return v.toJSDate()
    return new Date(v)
  }

  const downloadResetAt = toJSDateIfNeeded(quotaRow.downloadCountResetAt)
  const uploadResetAt = toJSDateIfNeeded(quotaRow.uploadCountResetAt)

  // If either reset timestamp is in the future, do not reset yet
  if ((downloadResetAt && downloadResetAt > now) || (uploadResetAt && uploadResetAt > now)) {
    return createQuotaUsage(quotaRow)
  }

  // TODO: Choose nextReset value
  //  Set next reset to 24 hours from now (adjust as needed e.g. next midnight)
  const nextReset = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await Quota.query().where('user_id', userId).update({
    download_count: 0,
    upload_count: 0,
    download_count_reset_at: nextReset,
    upload_count_reset_at: nextReset,
  })
  return createQuotaUsage(quotaRow, true)
}

export async function QuotaGetUserQuota(userId: number): Promise<QuotaUsage | null> {
  return await resetDailyCounts(userId)
}

export async function QuotaTryToUpload(userId: number, newObjectSize: bigint) {
  const quotaUsage = await QuotaGetUserQuota(userId)
  if (!quotaUsage) {
    throw new Error('Failed to fetch user quotaUsage')
  }

  if (BigInt(quotaUsage.storageBytes) + newObjectSize > BigInt(quotaUsage.storageBytesLimit)) {
    throw new Error('Storage bytes limit exceeded')
  }

  if (BigInt(quotaUsage.objectCount) + BigInt(1) > BigInt(quotaUsage.objectCountLimit)) {
    throw new Error('Object count limit exceeded')
  }

  await Quota.query()
    .where('user_id', userId)
    .update({
      storage_bytes: (BigInt(quotaUsage.storageBytes) + newObjectSize).toString(),
      object_count: (BigInt(quotaUsage.objectCount) + BigInt(1)).toString(),
      upload_count: (BigInt(quotaUsage.uploadCount) + BigInt(1)).toString(),
    })
}

// TODO: File already arrived so it's not really a protection against quota overflow
export async function QuotaTryToUpdate(userId: number, newObjectSize: bigint) {
  /**
   * When replacing, the new object will replace the old one, so but at a time,
   * the two objects coexists. The total storage bytes shouldn't exceed the limit even during the upload process.
   *  */
  await QuotaTryToUpload(userId, newObjectSize)
}

export async function QuotaTryToDownload(userId: number) {
  const quotaUsage = await QuotaGetUserQuota(userId)
  if (!quotaUsage) {
    throw new Error('Failed to fetch user quotaUsage')
  }

  if (BigInt(quotaUsage.downloadCount) + BigInt(1) > BigInt(quotaUsage.downloadCountLimit)) {
    throw new Error('Download count limit exceeded')
  }

  await Quota.query()
    .where('user_id', userId)
    .update({
      download_count: (BigInt(quotaUsage.downloadCount) + BigInt(1)).toString(),
    })
}

export async function QuotaTryToDelete(userId: number, objectSize: bigint) {
  const quotaUsage = await QuotaGetUserQuota(userId)
  if (!quotaUsage) {
    throw new Error('Failed to fetch user quota')
  }

  if (BigInt(quotaUsage.storageBytes) < objectSize) {
    throw new Error('Storage bytes underflow')
  }

  if (BigInt(quotaUsage.objectCount) < BigInt(1)) {
    throw new Error('Object count underflow')
  }

  await Quota.query()
    .where('user_id', userId)
    .update({
      storage_bytes: (BigInt(quotaUsage.storageBytes) - objectSize).toString(),
      object_count: (BigInt(quotaUsage.objectCount) - BigInt(1)).toString(),
    })
}
