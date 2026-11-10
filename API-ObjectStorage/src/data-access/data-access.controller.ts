import {
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common'
import { VerifyTokenGuard } from '../auth/verify-token.guard.js'
import { UserId } from '../common/user-id.decorator.js'
import { DataAccessService } from './data-access.service.js'

@Controller('api/v1/storage/all')
@UseGuards(VerifyTokenGuard)
export class DataAccessController {
  constructor(private readonly dataAccess: DataAccessService) {}

  @Get()
  async index(@UserId() userId: string) {
    const res = await this.dataAccess.indexAll(userId)
    this.dataAccess.publishUserData(userId, 'requested')
    if (res.status !== 'ok') throw new InternalServerErrorException(res)
    return res
  }

  @Delete()
  async destroy(@UserId() userId: string) {
    const res = await this.dataAccess.deleteAllObjectsForUser(userId)
    this.dataAccess.publishUserData(userId, 'deleted')
    if (res.status !== 'ok') throw new InternalServerErrorException(res)
    return res
  }
}
