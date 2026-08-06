import type { ApplicationService } from '@adonisjs/core/types'
import { Broker, publish, consume } from '@yosone/broker'

export default class MessageBrokerProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    Broker.init('raiders-io', 'object', process.env.REDIS_URL || 'redis://redis:6379')
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {
    Broker.connect()

    await publish('object.events', {
      type: 'object.started',
      payload: {
        message: 'Object service has been started',
      },
    })

  }
  /**
   * The process has been started
   */
  async ready() {
    await consume('auth.events')
      .on('auth.user.created', async (event) => {
        console.log(event.payload.userId, 'has been created')
      })
      .start()
    await consume('auth.events')
      .on('auth.user.deleted', async (event) => {
        console.log(event.payload.userId, 'has been deleted')
      })
      .start()
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    Broker.disconnect()
  }
}
