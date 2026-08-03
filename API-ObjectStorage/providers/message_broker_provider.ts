import type { ApplicationService } from '@adonisjs/core/types'
import { Connection, Publisher, Consumer } from 'rabbitmq-client'
import env from '#start/env'

/**
 * Déclaration des bindings du conteneur pour avoir
 * l'autocomplétion et le typage correct partout dans l'app
 */
declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'rabbitmq': Connection
    'rabbitmq.publisher': Publisher
    'rabbitmq.consumer': Consumer
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
        `amqp://${env.get('RABBITMQ_DEFAULT_USER')}:${env.get('RABBITMQ_DEFAULT_PASS')}@rabbitmq:5672`
      )
    })

    this.app.container.singleton('rabbitmq.consumer', async () => {
      const rabbit = await this.app.container.make('rabbitmq')
      return rabbit.createConsumer(
        {
          queue: 'user-events',
          queueOptions: { durable: true },
          qos: { prefetchCount: 2 },
          exchanges: [{ exchange: 'my-events', type: 'topic' }],
          queueBindings: [{ exchange: 'my-events', routingKey: 'users.*' }],
        },
        async (msg) => {
          console.log('received message (user-events)', msg)
          console.log('message content is ', msg.body)
        }
      )
    })

    this.app.container.singleton('rabbitmq.publisher', async () => {
      const rabbit = await this.app.container.make('rabbitmq')
      return rabbit.createPublisher({
        confirm: true,
        maxAttempts: 2,
        exchanges: [{ exchange: 'my-events', type: 'topic' }],
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
      console.log('RabbitMQ connection error', err)
    })

    rabbit.on('connection', () => {
      console.log('Connection successfully (re)established')
    })
    await this.app.container.make('rabbitmq.publisher')
    await this.app.container.make('rabbitmq.consumer')
  }

  /**
   * Preparing to shutdown the app
   * Should close the publisher and consumer connections to RabbitMQ
   */
  async shutdown() {
    const pub = await this.app.container.make('rabbitmq.publisher')
    await pub.close()

    const sub = await this.app.container.make('rabbitmq.consumer')
    await sub.close()

    const rabbit = await this.app.container.make('rabbitmq')
    await rabbit.close()
  }
}
