import { AsyncMessage } from 'rabbitmq-client'

export async function handleAsyncMessage(msg: AsyncMessage) {
  switch (msg.routingKey) {
    case 'auth.user.created':
      console.log('user created event received')
      break
    case 'auth.user.deleted':
      console.log('user deleted event received')
      break
    default:
      console.log('unknown event received')
      return
  }
  console.log('received message ', msg)
  console.log('message content is ', msg.body)
}

export async function handleLogMessage(str: String) {
  console.log({
    time: `${new Date().toISOString()}`,
    msg: str,
  })
}
