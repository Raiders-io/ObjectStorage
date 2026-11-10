import { Global, Module } from '@nestjs/common'
import { EventsPublisher } from './events-publisher.service.js'

/** Publisher side: global so any service can emit events without import cycles. */
@Global()
@Module({ providers: [EventsPublisher], exports: [EventsPublisher] })
export class EventsModule {}
