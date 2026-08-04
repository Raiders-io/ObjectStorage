import type { ApplicationService } from '@adonisjs/core/types'
import { Connection, Publisher, Consumer } from 'rabbitmq-client'
import env from '#start/env'
import { handleAsyncMessage, handleLogMessage } from '#services/message_broker_service'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'rabbitmq': Connection
    'rabbitmq.publisher': Publisher
    'rabbitmq.consumer.auth': Consumer
  }
}

export default class MessageBrokerProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('rabbitmq', async () => {
      return new Connection(
        `amqp://${env.get('RABBITMQ_DEFAULT_USER')}:${env.get('RABBITMQ_DEFAULT_PASS')}@${env.get('RABBITMQ_HOSTNAME')}:5672`
      )
    })

    this.app.container.singleton('rabbitmq.consumer.auth', async () => {
      const rabbit = await this.app.container.make('rabbitmq')
      return rabbit.createConsumer(
        {
          queue: 'object-events',
          queueOptions: { durable: true },
          qos: { prefetchCount: 2 },
          exchanges: [{ exchange: 'auth', type: 'topic' }],
          queueBindings: [{ exchange: 'auth', routingKey: 'auth.user.*' }],
        },
        handleAsyncMessage
      )
    })

    this.app.container.singleton('rabbitmq.publisher', async () => {
      const rabbit = await this.app.container.make('rabbitmq')
      return rabbit.createPublisher({
        confirm: true,
        maxAttempts: 2,
        exchanges: [{ exchange: 'object', type: 'topic' }],
      })
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {
    const rabbit = await this.app.container.make('rabbitmq')

    rabbit.on('error', (err) => {
      handleLogMessage(`RabbitMQ connection error: ${err}`)
    })

    rabbit.on('connection', () => {
      handleLogMessage(`RabbitMQ connected to ${env.get('RABBITMQ_HOSTNAME')}:5672`)
    })
    await this.app.container.make('rabbitmq.publisher')
    await this.app.container.make('rabbitmq.consumer.auth')
  }

  /**
   * Preparing to shutdown the app
   * Should close the publisher and consumer connections to RabbitMQ
   */
  async shutdown() {
    const pub = await this.app.container.make('rabbitmq.publisher')
    await pub.close()

    const sub = await this.app.container.make('rabbitmq.consumer.auth')
    await sub.close()

    const rabbit = await this.app.container.make('rabbitmq')
    await rabbit.close()
  }
}
