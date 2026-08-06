import { deleteAllObjectsForUser } from '#services/access_object_service'
import { publish, type ApiEvent } from '@yosone/broker'

export async function handleAsyncMessage(msg: ApiEvent<any>) {
  switch (msg.type) {
    case 'auth.user.deleted':
      console.log('user deleted event received')
      await deleteAllObjectsForUser(msg.payload.userId)
      publish('object.events', {
        type: 'object.user.data',
        payload: {
          userId: msg.payload.userId,
          state: 'deleted',
        },
      })
      break
    default:
      // console.log('unknown event received')
      return
  }
}
