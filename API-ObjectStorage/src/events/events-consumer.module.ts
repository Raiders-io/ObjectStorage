import { Module } from '@nestjs/common'
import { DataAccessModule } from '../data-access/data-access.module.js'
import { ObjectsModule } from '../objects/objects.module.js'
import { EventsConsumer } from './events-consumer.service.js'

@Module({ imports: [ObjectsModule, DataAccessModule], providers: [EventsConsumer] })
export class EventsConsumerModule {}
