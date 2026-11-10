import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Quota } from '../database/entities/quota.entity.js'

const DAY_MS = 24 * 60 * 60 * 1000

function assertNonNegative(value: bigint, label: string) {
  if (value < 0n) throw new Error(`${label} must be non-negative`)
}

/**
 * Quota accounting. Every check-and-increment is a single conditional UPDATE so that concurrent
 * requests cannot overshoot a limit (same strategy as the former Lucid implementation).
 */
@Injectable()
export class QuotaService {
  constructor(@InjectRepository(Quota) private readonly repo: Repository<Quota>) {}

  private async ensureQuota(userId: string): Promise<void> {
    await this.repo.createQueryBuilder().insert().values({ userId }).orIgnore().execute()
  }

  private async resetExpiredCounters(userId: string): Promise<void> {
    const now = new Date()
    const next = new Date(now.getTime() + DAY_MS)
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ downloadCount: '0', downloadCountResetAt: next })
      .where('user_id = :userId', { userId })
      .andWhere('(download_count_reset_at IS NULL OR download_count_reset_at <= :now)', { now })
      .execute()
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ uploadCount: '0', uploadCountResetAt: next })
      .where('user_id = :userId', { userId })
      .andWhere('(upload_count_reset_at IS NULL OR upload_count_reset_at <= :now)', { now })
      .execute()
  }

  private async readQuota(userId: string): Promise<Quota> {
    await this.ensureQuota(userId)
    await this.resetExpiredCounters(userId)
    return this.repo.findOneByOrFail({ userId })
  }

  private async throwQuotaFailure(
    userId: string,
    check: { bytesDelta?: bigint; object?: boolean; upload?: boolean; download?: boolean }
  ): Promise<never> {
    const q = await this.repo.findOneBy({ userId })
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
    throw new Error('Quota update conflict, please retry')
  }

  /** Quota as exposed by `GET /quota` and `GET /all` (snake_case, like the Adonis API). */
  async getPublicQuota(userId: string): Promise<Record<string, unknown> | null> {
    await this.ensureQuota(userId)
    const row = await this.repo
      .createQueryBuilder('q')
      .select([
        'q.storageBytes AS storage_bytes',
        'q.storageBytesLimit AS storage_bytes_limit',
        'q.objectCount AS object_count',
        'q.objectCountLimit AS object_count_limit',
        'q.downloadCount AS download_count',
        'q.downloadCountLimit AS download_count_limit',
        'q.uploadCount AS upload_count',
        'q.uploadCountLimit AS upload_count_limit',
        'q.downloadCountResetAt AS download_count_reset_at',
        'q.uploadCountResetAt AS upload_count_reset_at',
        'q.updatedAt AS updated_at',
      ])
      .where('q.userId = :userId', { userId })
      .getRawOne()
    return row ?? null
  }

  async tryToUpload(userId: string, newObjectSize: bigint): Promise<void> {
    assertNonNegative(newObjectSize, 'Object size')
    await this.readQuota(userId)
    const res = await this.repo
      .createQueryBuilder()
      .update()
      .set({
        storageBytes: () => 'storage_bytes + CAST(:size AS BIGINT)',
        objectCount: () => 'object_count + 1',
        uploadCount: () => 'upload_count + 1',
      })
      .where('user_id = :userId', { userId })
      .andWhere('storage_bytes + CAST(:size AS BIGINT) <= storage_bytes_limit')
      .andWhere('object_count + 1 <= object_count_limit')
      .andWhere('upload_count + 1 <= upload_count_limit')
      .setParameter('size', newObjectSize.toString())
      .execute()
    if (!res.affected) {
      await this.throwQuotaFailure(userId, { bytesDelta: newObjectSize, object: true, upload: true })
    }
  }

  async verifyForUpdate(userId: string, newObjectSize: bigint): Promise<void> {
    const q = await this.readQuota(userId)
    if (BigInt(q.storageBytes) + newObjectSize > BigInt(q.storageBytesLimit)) {
      throw new Error('Storage bytes limit exceeded')
    }
  }

  async tryToUpdate(userId: string, newObjectSize: bigint, oldObjectSize: bigint): Promise<void> {
    assertNonNegative(newObjectSize, 'New object size')
    assertNonNegative(oldObjectSize, 'Old object size')
    await this.readQuota(userId)
    const delta = newObjectSize - oldObjectSize
    const res = await this.repo
      .createQueryBuilder()
      .update()
      .set({
        storageBytes: () => 'storage_bytes + CAST(:delta AS BIGINT)',
        uploadCount: () => 'upload_count + 1',
      })
      .where('user_id = :userId', { userId })
      .andWhere('storage_bytes + CAST(:delta AS BIGINT) <= storage_bytes_limit')
      .andWhere('storage_bytes + CAST(:delta AS BIGINT) >= 0')
      .andWhere('upload_count + 1 <= upload_count_limit')
      .setParameter('delta', delta.toString())
      .execute()
    if (!res.affected) {
      await this.throwQuotaFailure(userId, { bytesDelta: delta, upload: true })
    }
  }

  async tryToDownload(userId: string): Promise<void> {
    await this.readQuota(userId)
    const res = await this.repo
      .createQueryBuilder()
      .update()
      .set({ downloadCount: () => 'download_count + 1' })
      .where('user_id = :userId', { userId })
      .andWhere('download_count + 1 <= download_count_limit')
      .execute()
    if (!res.affected) await this.throwQuotaFailure(userId, { download: true })
  }

  async tryToDelete(userId: string, objectSize: bigint): Promise<void> {
    assertNonNegative(objectSize, 'Object size')
    await this.readQuota(userId)
    const res = await this.repo
      .createQueryBuilder()
      .update()
      .set({
        storageBytes: () => 'storage_bytes - CAST(:size AS BIGINT)',
        objectCount: () => 'object_count - 1',
      })
      .where('user_id = :userId', { userId })
      .andWhere('storage_bytes >= CAST(:size AS BIGINT)')
      .andWhere('object_count >= 1')
      .setParameter('size', objectSize.toString())
      .execute()
    if (!res.affected) {
      const q = await this.repo.findOneBy({ userId })
      if (!q) throw new Error('Quota not found for user')
      if (BigInt(q.storageBytes) < objectSize) throw new Error('Storage bytes underflow')
      if (BigInt(q.objectCount) < 1n) throw new Error('Object count underflow')
      throw new Error('Quota update conflict, please retry')
    }
  }
}
