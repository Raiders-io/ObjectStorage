import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StorageObject } from '../database/entities/storage-object.entity.js'
import { QuotaModule } from '../quota/quota.module.js'
import { ObjectsController } from './objects.controller.js'
import { ObjectsService } from './objects.service.js'
import { UsersObjectsController } from './users-objects.controller.js'

@Module({
  imports: [TypeOrmModule.forFeature([StorageObject]), QuotaModule],
  controllers: [ObjectsController, UsersObjectsController],
  providers: [ObjectsService],
  exports: [ObjectsService, TypeOrmModule],
})
export class ObjectsModule {}
