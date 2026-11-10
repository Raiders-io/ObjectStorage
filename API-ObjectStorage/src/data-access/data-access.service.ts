import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { calculatePrefix } from '../common/sanitize.js'
import { Quota } from '../database/entities/quota.entity.js'
import { StorageObject } from '../database/entities/storage-object.entity.js'
import { EventsPublisher } from '../events/events-publisher.service.js'
import { ObjectsService } from '../objects/objects.service.js'
import { QuotaService } from '../quota/quota.service.js'
import { StorageService } from '../storage/storage.service.js'

/** GDPR helpers: export and erase everything stored for one user. */
@Injectable()
export class DataAccessService {
  private readonly logger = new Logger(DataAccessService.name)

  constructor(
    @InjectRepository(StorageObject) private readonly objects: Repository<StorageObject>,
    @InjectRepository(Quota) private readonly quotas: Repository<Quota>,
    private readonly objectsService: ObjectsService,
    private readonly quotaService: QuotaService,
    private readonly storage: StorageService,
    private readonly events: EventsPublisher
  ) {}

  async indexAll(userId: string) {
    try {
      const objects = await this.objectsService.listAll(userId)
      const quota = await this.quotaService.getPublicQuota(userId)
      return { status: objects && quota ? 'ok' : 'error', objects, quota }
    } catch (error) {
      this.logger.error(`indexAll failed: ${(error as Error).message}`)
      return { status: 'error', message: 'Error retrieving data' }
    }
  }

  async deleteAllObjectsForUser(userId: string) {
    let ok = true
    try {
      await this.objects.delete({ ownerId: userId })
    } catch (error) {
      ok = false
      this.logger.error(`Deleting objects of ${userId} failed: ${(error as Error).message}`)
    }
    try {
      await this.quotas.delete({ userId })
    } catch (error) {
      ok = false
      this.logger.error(`Deleting quota of ${userId} failed: ${(error as Error).message}`)
    }
    try {
      await this.storage.deleteAll(calculatePrefix(userId))
    } catch (error) {
      ok = false
      this.logger.error(`Deleting files of ${userId} failed: ${(error as Error).message}`)
    }
    return { status: ok ? 'ok' : 'error', objects: 'Deleted', quota: 'Deleted' }
  }

  publishUserData(userId: string, state: 'requested' | 'deleted') {
    this.events.publish({ type: 'object.user.data', payload: { userId, state } })
  }
}
