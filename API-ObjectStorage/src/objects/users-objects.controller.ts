import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { VerifyTokenGuard } from '../auth/verify-token.guard.js'
import { sanitizeUserId } from '../common/sanitize.js'
import { UserId } from '../common/user-id.decorator.js'
import { SearchFilesDto } from './dto/search-files.dto.js'
import { ObjectResponseTypeError } from './object-response.js'
import { ObjectsService } from './objects.service.js'
import { parsePagination } from './pagination.js'

function targetUser(raw: string | undefined): string {
  const target = raw ? sanitizeUserId(raw) : undefined
  if (target === undefined) {
    throw new BadRequestException({ key: 'userid', error: ObjectResponseTypeError.InvalidUserID })
  }
  return target
}

/** Read-only access to the *public* objects of other users. */
@Controller('api/v1/storage/users')
@UseGuards(VerifyTokenGuard)
export class UsersObjectsController {
  constructor(private readonly objects: ObjectsService) {}

  @Get(':userid/objects')
  index(
    @Param('userid') userid: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const p = parsePagination(page, limit)
    return this.objects.list(targetUser(userid), p.page, p.limit, true)
  }

  @Post(':userid/objects/search')
  @HttpCode(200)
  search(@UserId() userId: string, @Param('userid') userid: string, @Body() dto: SearchFilesDto) {
    return this.objects.search(userId, targetUser(userid), dto.files)
  }

  @Get(':userid/objects/preview/:id')
  preview(@UserId() userId: string, @Param('userid') userid: string, @Param('id') id: string) {
    return this.objects.download(userId, targetUser(userid), id, true)
  }

  @Get(':userid/objects/:id')
  show(@UserId() userId: string, @Param('userid') userid: string, @Param('id') id: string) {
    return this.objects.download(userId, targetUser(userid), id, false)
  }
}
