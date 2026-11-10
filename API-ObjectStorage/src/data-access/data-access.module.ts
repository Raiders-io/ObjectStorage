import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Quota } from '../database/entities/quota.entity.js'
import { StorageObject } from '../database/entities/storage-object.entity.js'
import { ObjectsModule } from '../objects/objects.module.js'
import { QuotaModule } from '../quota/quota.module.js'
import { DataAccessController } from './data-access.controller.js'
import { DataAccessService } from './data-access.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([StorageObject, Quota]), ObjectsModule, QuotaModule],
  controllers: [DataAccessController],
  providers: [DataAccessService],
  exports: [DataAccessService],
})
export class DataAccessModule {}
