import { StorageObjectVisibility } from '#enums/storage_objects'
import { changeVisibility, deleteAllObjectsForUser } from '#services/access_object_service'
import { MsgMinorError, publish, type ApiEvent } from '@yosone/broker'
import {
  AuthUserDeletedEvent,
  LessonFileAttachedEvent,
  ObjectUserDataEvent,
} from '#validators/event'

type ValidationResult<T> = { success: true; data: T } | { success: false; error: unknown }

async function safeParse<T>(
  schema: { validate(data: unknown): Promise<T> },
  data: unknown
): Promise<ValidationResult<T>> {
  try {
    return {
      success: true,
      data: await schema.validate(data),
    }
  } catch (error) {
    return {
      success: false,
      error,
    }
  }
}

export async function handleAsyncMessage(msg: ApiEvent<any>) {
  switch (msg.type) {
    case 'auth.user.deleted': {
      const result = await safeParse(AuthUserDeletedEvent, msg)
      if (!result.success) throw new MsgMinorError('Invalid payload for auth.user.deleted event')
      const payload = result.data.payload
      await deleteAllObjectsForUser(payload.userId)
      const event: ObjectUserDataEvent = {
        type: 'object.user.data',
        payload: {
          userId: payload.userId,
          state: 'deleted',
        },
      }
      publish('object.events', event)
      break
    }
    case 'lesson.file.attached': {
      const result = await safeParse(LessonFileAttachedEvent, msg)
      if (!result.success) throw new MsgMinorError('Invalid payload for lesson.file.attached event')
      const payload = result.data.payload
      if (payload.filename instanceof Array) {
        for (const filename of payload.filename)
          await changeVisibility(payload.authorId, filename, StorageObjectVisibility.public)
      } else
        await changeVisibility(payload.authorId, payload.filename, StorageObjectVisibility.public)
      break
    }
    default:
      // console.log('unknown event received')
      return
  }
}
