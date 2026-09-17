import { deleteAllObjectsForUser } from '#services/access_object_service'
import { publish, type ApiEvent } from '@yosone/broker'
import typia from 'typia'

type AuthUserDeletedEvent = {
  type: 'auth.user.deleted'
  payload: {
    userId: string
  }
}

type LessonFileAttachedEvent = {
  type: 'lesson.file.attached'
  payload: {
    lessonId: string
    filename: string
    authorId: string
  }
}

export async function handleAsyncMessage(msg: ApiEvent<any>) {
  switch (msg.type) {
    case 'auth.user.deleted':
      console.log('user deleted event received')
      if (!typia.is<AuthUserDeletedEvent>(msg))
        throw new Error('Invalid payload for auth.user.deleted event')
      await deleteAllObjectsForUser(msg.payload.userId)
      publish('object.events', {
        type: 'object.user.data',
        payload: {
          userId: msg.payload.userId,
          state: 'deleted',
        },
      })
      break
    case 'lesson.file.attached':
      console.log('lesson file attached event received')
      if (!typia.is<LessonFileAttachedEvent>(msg))
        throw new Error('Invalid payload for lesson.file.attached event')
      // change visibility of file to public
      break
    default:
      // console.log('unknown event received')
      return
  }
}
