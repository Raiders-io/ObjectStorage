import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Quota } from '../database/entities/quota.entity.js'
import { QuotaController } from './quota.controller.js'
import { QuotaService } from './quota.service.js'

@Module({
  imports: [TypeOrmModule.forFeature([Quota])],
  controllers: [QuotaController],
  providers: [QuotaService],
  exports: [QuotaService, TypeOrmModule],
})
export class QuotaModule {}
