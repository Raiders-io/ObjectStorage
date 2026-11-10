import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { VerifyTokenGuard } from '../auth/verify-token.guard.js'
import { UserId } from '../common/user-id.decorator.js'
import { StorageObjectVisibility } from '../database/entities/storage-object.entity.js'
import { SearchFilesDto } from './dto/search-files.dto.js'
import { ObjectsService } from './objects.service.js'
import { parsePagination } from './pagination.js'
import { pickFile, pickFiles, uploadOptions } from './upload.js'

type Files = Express.Multer.File[] | undefined

@Controller('api/v1/storage/objects')
@UseGuards(VerifyTokenGuard)
export class ObjectsController {
  constructor(private readonly objects: ObjectsService) {}

  @Get()
  index(@UserId() userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = parsePagination(page, limit)
    return this.objects.list(userId, p.page, p.limit)
  }

  @Post()
  @HttpCode(200)
  @UseInterceptors(AnyFilesInterceptor(uploadOptions))
  store(@UserId() userId: string, @UploadedFiles() files: Files) {
    return this.objects.store(userId, pickFiles(files))
  }

  @Put()
  @UseInterceptors(AnyFilesInterceptor(uploadOptions))
  updateMany(@UserId() userId: string, @UploadedFiles() files: Files) {
    return this.objects.updateMany(userId, pickFiles(files))
  }

  @Delete()
  destroyMany(@UserId() userId: string, @Body('ids') ids?: string[]) {
    return this.objects.destroyMany(userId, ids)
  }

  @Post('search')
  @HttpCode(200)
  search(@UserId() userId: string, @Body() dto: SearchFilesDto) {
    return this.objects.search(userId, userId, dto.files)
  }

  @Get('preview/:id')
  preview(@UserId() userId: string, @Param('id') id: string) {
    return this.objects.download(userId, userId, id, true)
  }

  @Get(':id')
  show(@UserId() userId: string, @Param('id') id: string) {
    return this.objects.download(userId, userId, id, false)
  }

  @Put(':id')
  @UseInterceptors(AnyFilesInterceptor(uploadOptions))
  update(@UserId() userId: string, @Param('id') id: string, @UploadedFiles() files: Files) {
    return this.objects.update(userId, id, pickFile(files))
  }

  @Delete(':id')
  @HttpCode(204)
  async destroy(@UserId() userId: string, @Param('id') id: string) {
    await this.objects.destroy(userId, id)
  }

  @Patch(':id')
  updateInfo(
    @UserId() userId: string,
    @Param('id') id: string,
    @Query('visibility') queryVisibility?: string,
    @Body('visibility') bodyVisibility?: string
  ) {
    const visibility = queryVisibility ?? bodyVisibility ?? StorageObjectVisibility.private
    return this.objects.changeVisibility(userId, id, visibility)
  }
}
