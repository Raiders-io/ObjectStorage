import { StorageObjectVisibility } from '#enums/storage_objects'
import { changeVisibility, deleteAllObjectsForUser } from '#services/access_object_service'
import { MsgMinorError, publish, type ApiEvent } from '@yosone/broker'
import { z } from 'zod'

export const AuthUserDeletedEvent = z.object({
  type: z.literal('auth.user.deleted'),
  payload: z.object({
    userId: z.string(),
  }),
})
export type AuthUserDeletedEvent = z.infer<typeof AuthUserDeletedEvent>

export const LessonFileAttachedEvent = z.object({
  type: z.literal('lesson.file.attached'),
  payload: z.object({
    lessonId: z.string(),
    filename: z.string(),
    authorId: z.string(),
  }),
})
export type LessonFileAttachedEvent = z.infer<typeof LessonFileAttachedEvent>

export async function handleAsyncMessage(msg: ApiEvent<any>) {
  switch (msg.type) {
    case 'auth.user.deleted': {
      const result = AuthUserDeletedEvent.safeParse(msg)
      if (!result.success)
        throw new MsgMinorError('Invalid payload for auth.user.deleted event')
      const payload = result.data.payload
      await deleteAllObjectsForUser(payload.userId)
      publish('object.events', {
        type: 'object.user.data',
        payload: {
          userId: payload.userId,
          state: 'deleted',
        },
      })
      break
    }
    case 'lesson.file.attached': {
      const result = LessonFileAttachedEvent.safeParse(msg)
      if (!result.success)
        throw new MsgMinorError('Invalid payload for lesson.file.attached event')
      const payload = result.data.payload
      await changeVisibility(
        payload.authorId,
        payload.filename,
        StorageObjectVisibility.public
      )
      break
    }
    default:
      // console.log('unknown event received')
      return
  }
}
