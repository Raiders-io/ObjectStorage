import { handleAsyncMessage } from '#services/message_broker_service'
import type { ApplicationService } from '@adonisjs/core/types'
import { Broker, publish, consume, LOGLEVEL } from '@yosone/broker'

export default class MessageBrokerProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {}

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {
    Broker.init({
      redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
      group: 'object-service',
      consumer: 'object-service',
      logLevel: LOGLEVEL.INFO,
    })

    publish('object.events', {
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
    consume('auth.events').on('auth.user.deleted', handleAsyncMessage).start()
    consume('lesson.events').on('lesson.file.attached', handleAsyncMessage).start()
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    Broker.disconnect()
  }
}
