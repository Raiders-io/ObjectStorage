import { StorageObjectVisibility } from '#enums/storage_objects'
import { changeVisibility, deleteAllObjectsForUser } from '#services/access_object_service'
import { MsgMinorError, publish, type ApiEvent } from '@yosone/broker'
import { AuthUserDeletedEvent, LessonFileAttachedEvent, ObjectUserDataEvent } from '#class/events'

export async function handleAsyncMessage(msg: ApiEvent<any>) {
  switch (msg.type) {
    case 'auth.user.deleted': {
      const result = AuthUserDeletedEvent.safeParse(msg)
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
      const result = LessonFileAttachedEvent.safeParse(msg)
      if (!result.success) throw new MsgMinorError('Invalid payload for lesson.file.attached event')
      const payload = result.data.payload
      await changeVisibility(payload.authorId, payload.filename, StorageObjectVisibility.public)
      break
    }
    default:
      // console.log('unknown event received')
      return
  }
}
