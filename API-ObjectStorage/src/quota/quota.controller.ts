import { Controller, Get, InternalServerErrorException, UseGuards } from '@nestjs/common'
import { VerifyTokenGuard } from '../auth/verify-token.guard.js'
import { UserId } from '../common/user-id.decorator.js'
import { QuotaService } from './quota.service.js'

@Controller('api/v1/storage/quota')
@UseGuards(VerifyTokenGuard)
export class QuotaController {
  constructor(private readonly quota: QuotaService) {}

  @Get()
  async retrieveQuota(@UserId() userId: string) {
    const quota = await this.quota.getPublicQuota(userId)
    if (!quota) throw new InternalServerErrorException('Failed to create or retrieve quota for user')
    return quota
  }
}
