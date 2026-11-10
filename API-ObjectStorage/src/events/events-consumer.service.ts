import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { consume, MsgMinorError, type ApiEvent } from '@yosone/broker'
import { ObjectsError } from '../common/objects-error.js'
import { DataAccessService } from '../data-access/data-access.service.js'
import { StorageObjectVisibility } from '../database/entities/storage-object.entity.js'
import { ObjectsService } from '../objects/objects.service.js'
import { AuthUserDeletedEventSchema, LessonFileAttachedEventSchema } from './event.schemas.js'

/** Consumes `auth.events` and `lesson.events` (replaces message_broker_service.ts). */
@Injectable()
export class EventsConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventsConsumer.name)

  constructor(
    private readonly objects: ObjectsService,
    private readonly dataAccess: DataAccessService
  ) {}

  onApplicationBootstrap() {
    consume('auth.events')
      .on('auth.user.deleted', (msg) => this.onUserDeleted(msg))
      .start()
    consume('lesson.events')
      .on('lesson.file.attached', (msg) => this.onLessonFileAttached(msg))
      .start()
  }

  private async onUserDeleted(msg: ApiEvent<any>) {
    const parsed = AuthUserDeletedEventSchema.safeParse(msg)
    if (!parsed.success) throw new MsgMinorError('Invalid payload for auth.user.deleted event')

    const { userId } = parsed.data.payload
    await this.dataAccess.deleteAllObjectsForUser(userId)
    this.dataAccess.publishUserData(userId, 'deleted')
  }

  private async onLessonFileAttached(msg: ApiEvent<any>) {
    const parsed = LessonFileAttachedEventSchema.safeParse(msg)
    if (!parsed.success) throw new MsgMinorError('Invalid payload for lesson.file.attached event')

    const { authorId, filename } = parsed.data.payload
    const filenames = Array.isArray(filename) ? filename : [filename]
    for (const name of filenames) {
      try {
        await this.objects.changeVisibility(authorId, name, StorageObjectVisibility.public)
      } catch (error) {
        // A missing/invalid file will never succeed on retry: ack it instead of redelivering forever.
        if (error instanceof ObjectsError) {
          this.logger.warn(`lesson.file.attached: ${name} ignored (${error.message})`)
          continue
        }
        throw error
      }
    }
  }
}
