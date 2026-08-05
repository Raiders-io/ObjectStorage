import { AsyncMessage, ConsumerStatus } from 'rabbitmq-client'
import { deleteAllObjectsForUser } from '#services/access_object_service'

export async function handleAsyncMessage(msg: AsyncMessage): Promise<ConsumerStatus> {
  try {
    switch (msg.routingKey) {
      // case 'auth.user.created':
      //   console.log('user created event received')
      //   break
      case 'auth.user.deleted':
        console.log('user deleted event received')
        await deleteAllObjectsForUser(msg.body.userId)
        break
      default:
        console.log('unknown event received')
        return ConsumerStatus.DROP
    }
    // console.log('received message ', msg)
    // console.log('message content is ', msg.body)
    return ConsumerStatus.ACK
  } catch (error) {
    console.error('Error handling async message:', error)
    return ConsumerStatus.DROP
  }
}

export async function handleLogMessage(str: String) {
  console.log({
    time: `${new Date()}`,
    msg: str,
  })
}
