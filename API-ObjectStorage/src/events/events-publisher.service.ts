import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Broker, LOGLEVEL, publish } from '@yosone/broker'
import type { Env } from '../config/env.js'
import type { ObjectEvent } from './event.schemas.js'

export const OBJECT_EVENTS_STREAM = 'object.events'

@Injectable()
export class EventsPublisher implements OnModuleInit, OnApplicationShutdown {
  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit() {
    Broker.init({
      redisUrl: this.config.get('REDIS_URL', { infer: true }),
      group: 'object-service',
      consumer: `object-service-${this.config.get('CONSUMER_ID', { infer: true })}`,
      logLevel: LOGLEVEL.INFO,
    })
    this.publish({
      type: 'object.started',
      payload: { message: 'Object service has been started' },
    })
  }

  publish(event: ObjectEvent): void {
    publish<ObjectEvent['payload']>(OBJECT_EVENTS_STREAM, event)
  }

  async onApplicationShutdown() {
    await Broker.shutdown()
  }
}
