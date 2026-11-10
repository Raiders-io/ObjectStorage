import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { lookup as mimeLookup } from 'mime-types'
import { In, Repository } from 'typeorm'
import { calculatePrefix, sanitizeFilename } from '../common/sanitize.js'
import { ObjectsError } from '../common/objects-error.js'
import {
  StorageObject,
  StorageObjectUploadStatus,
  StorageObjectVisibility,
} from '../database/entities/storage-object.entity.js'
import { EventsPublisher } from '../events/events-publisher.service.js'
import { QuotaError } from '../quota/quota-error.js'
import { QuotaService } from '../quota/quota.service.js'
import { StorageService } from '../storage/storage.service.js'
import {
  ObjectResponseType,
  ObjectResponseTypeError,
  ObjectResponseTypeSuccess,
  type ObjectError,
  type ObjectSuccess,
} from './object-response.js'

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** snake_case projection kept for API compatibility with the AdonisJS version. */
const LIST_SELECT = [
  'o.name AS name',
  'o.sizeBytes AS size_bytes',
  'o.mimeType AS mime_type',
  'o.visibility AS visibility',
  'o.createdAt AS created_at',
]

@Injectable()
export class ObjectsService {
  private readonly logger = new Logger(ObjectsService.name)

  constructor(
    @InjectRepository(StorageObject) private readonly repo: Repository<StorageObject>,
    private readonly storage: StorageService,
    private readonly quota: QuotaService,
    private readonly events: EventsPublisher
  ) {}

  // ---------------------------------------------------------------- listing

  async list(ownerId: string, page: number, limit: number, publicOnly = false) {
    const base = () => {
      const qb = this.repo.createQueryBuilder('o').where('o.ownerId = :ownerId', { ownerId })
      if (publicOnly) qb.andWhere('o.visibility = :v', { v: StorageObjectVisibility.public })
      return qb
    }
    const total = await base().getCount()
    const data = await base()
      .select(LIST_SELECT)
      .orderBy('o.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany()
    return {
      message: ObjectResponseTypeSuccess.IndexSuccess,
      objects: {
        meta: {
          total,
          perPage: limit,
          currentPage: page,
          lastPage: Math.max(1, Math.ceil(total / limit)),
          firstPage: 1,
        },
        data,
      },
    }
  }

  async listAll(ownerId: string) {
    return this.repo
      .createQueryBuilder('o')
      .select(['o.key AS key', ...LIST_SELECT])
      .where('o.ownerId = :ownerId', { ownerId })
      .orderBy('o.createdAt', 'DESC')
      .getRawMany()
  }

  // ----------------------------------------------------------------- create

  async store(userId: string, files: Express.Multer.File[]) {
    if (files.length === 0) throw new BadRequestException(ObjectResponseTypeError.NoFileProvided)

    const objects = new ObjectResponseType()

    for (const file of files) {
      const fileName = sanitizeFilename(file.originalname)
      if (fileName === undefined && files.length === 1) {
        throw new BadRequestException(ObjectResponseTypeError.InvalidFilename)
      }
      if (fileName === undefined) {
        objects.addError({ key: file.originalname, error: ObjectResponseTypeError.NoFileID })
        continue
      }

      const s3Path = calculatePrefix(userId, fileName)
      const alreadyExists =
        (await this.repo.existsBy({ ownerId: userId, key: s3Path })) ||
        (await this.storage.exists(s3Path))
      if (alreadyExists) {
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.UploadAlreadyExists })
        continue
      }

      try {
        await this.quota.tryToUpload(userId, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: fileName, error: QuotaError.NoUploadRemaining })
        this.logger.warn(`QuotaTryToUpload from ${userId} error: ${errMsg(error)}`)
        continue
      }

      const mimeType = mimeLookup(fileName) || file.mimetype || 'application/octet-stream'

      try {
        await this.repo.insert({
          ownerId: userId,
          key: s3Path,
          bucket: this.storage.bucket,
          name: fileName,
          sizeBytes: String(file.size),
          mimeType,
          visibility: StorageObjectVisibility.private,
          status: StorageObjectUploadStatus.uploading,
        })
      } catch (error) {
        this.logger.error(`Failed to save ${s3Path}: ${errMsg(error)}`)
        await this.refundQuota(userId, file.size)
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.FailedToSaveFile })
        continue
      }

      try {
        await this.storage.put(s3Path, file.buffer, mimeType)
        await this.repo.update(
          { ownerId: userId, key: s3Path },
          { status: StorageObjectUploadStatus.complete }
        )
      } catch (error) {
        this.logger.error(`Upload of ${s3Path} failed: ${errMsg(error)}`)
        await this.repo.delete({ ownerId: userId, key: s3Path })
        await this.refundQuota(userId, file.size)
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.UploadError })
        continue
      }

      objects.addSuccess({ key: s3Path, message: ObjectResponseTypeSuccess.UploadSuccess })
      this.events.publish({
        type: 'object.file.created',
        payload: { userId, filename: fileName },
      })
    }

    if (objects.length === 0) {
      throw new InternalServerErrorException(ObjectResponseTypeError.UploadError)
    }
    const [first] = objects.get()
    if (objects.length === 1 && 'error' in first) {
      throw new BadRequestException((first as ObjectError).error)
    }
    return { objects: objects.get() }
  }

  /** Gives back what `tryToUpload` consumed when the upload could not complete. */
  private async refundQuota(userId: string, size: number) {
    try {
      await this.quota.tryToDelete(userId, BigInt(size))
    } catch (error) {
      this.logger.warn(`Quota refund for ${userId} failed: ${errMsg(error)}`)
    }
  }

  // ----------------------------------------------------------------- update

  async update(userId: string, rawId: string, file: Express.Multer.File | undefined) {
    const filename = sanitizeFilename(rawId)
    if (!file) {
      throw new BadRequestException({ key: filename, error: ObjectResponseTypeError.NoFileProvided })
    }
    if (filename === undefined) {
      throw new BadRequestException({ key: filename, error: ObjectResponseTypeError.NoFileID })
    }
    if (filename !== file.originalname) {
      throw new BadRequestException({
        key: filename,
        error: ObjectResponseTypeError.FileNameMismatch,
      })
    }

    try {
      await this.quota.verifyForUpdate(userId, BigInt(file.size))
    } catch (error) {
      this.logger.warn(`QuotaVerifyForUpdate error: ${errMsg(error)}`)
      throw new BadRequestException({ key: filename, error: QuotaError.NoUpdateRemaining })
    }

    const prefix = calculatePrefix(userId, filename)
    const existing = await this.repo.findOne({
      select: { sizeBytes: true },
      where: { ownerId: userId, key: prefix },
    })
    if (!existing || !(await this.storage.exists(prefix))) {
      throw new NotFoundException({ key: filename, error: ObjectResponseTypeError.NotFound })
    }

    await this.quota.tryToUpdate(userId, BigInt(file.size), BigInt(existing.sizeBytes))
    const mimeType = mimeLookup(filename) || file.mimetype || 'application/octet-stream'
    await this.repo.update(
      { ownerId: userId, key: prefix },
      { sizeBytes: String(file.size), mimeType }
    )
    await this.storage.put(prefix, file.buffer, mimeType)

    this.events.publish({
      type: 'object.file.updated',
      payload: { userId, filename: file.originalname },
    })
    return { key: filename, message: ObjectResponseTypeSuccess.UpdateSuccess }
  }

  async updateMany(userId: string, files: Express.Multer.File[]) {
    if (files.length === 0) {
      throw new BadRequestException({ key: 'files[]', error: ObjectResponseTypeError.NoFileProvided })
    }
    const objects = new ObjectResponseType()

    for (const file of files) {
      const filename = sanitizeFilename(file.originalname)
      if (filename === undefined) {
        throw new BadRequestException({
          key: file.originalname,
          error: ObjectResponseTypeError.NoFileID,
        })
      }

      try {
        await this.quota.verifyForUpdate(userId, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: filename, error: QuotaError.NoUpdateRemaining })
        this.logger.warn(`QuotaVerifyForUpdate from ${userId} error: ${errMsg(error)}`)
        continue
      }

      const prefix = calculatePrefix(userId, filename)
      const existing = await this.repo.findOne({
        select: { sizeBytes: true },
        where: { ownerId: userId, key: prefix },
      })
      if (!existing || !(await this.storage.exists(prefix))) {
        objects.addError({ key: filename, error: ObjectResponseTypeError.NotFound })
        continue
      }

      await this.quota.tryToUpdate(userId, BigInt(file.size), BigInt(existing.sizeBytes))
      const mimeType = mimeLookup(filename) || file.mimetype || 'application/octet-stream'
      await this.repo.update(
        { ownerId: userId, key: prefix },
        { sizeBytes: String(file.size), mimeType }
      )
      await this.storage.put(prefix, file.buffer, mimeType)

      this.events.publish({
        type: 'object.file.updated',
        payload: { userId, filename: file.originalname },
      })
      objects.addSuccess({ key: filename, message: ObjectResponseTypeSuccess.UpdateSuccess })
    }
    return { objects: objects.get() }
  }

  // ----------------------------------------------------------------- delete

  async destroy(userId: string, rawId: string): Promise<void> {
    const filename = sanitizeFilename(rawId)
    if (filename === undefined) {
      throw new BadRequestException({ key: 'file', error: ObjectResponseTypeError.NoFileID })
    }
    const prefix = calculatePrefix(userId, filename)
    const existing = await this.repo.findOneBy({ ownerId: userId, key: prefix })
    if (!existing || !(await this.storage.exists(prefix))) {
      throw new NotFoundException({ key: filename, error: ObjectResponseTypeError.NotFound })
    }

    try {
      await this.quota.tryToDelete(userId, BigInt(existing.sizeBytes))
    } catch (error) {
      this.logger.warn(`QuotaTryToDelete from ${userId} error: ${errMsg(error)}`)
      throw new BadRequestException(QuotaError.QuotaDeleteFailed)
    }

    await this.storage.delete(prefix)
    await this.repo.delete({ ownerId: userId, key: prefix })
    this.events.publish({ type: 'object.file.deleted', payload: { userId, filename } })
  }

  async destroyMany(userId: string, ids: string[] | undefined) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException({ key: 'ids', error: ObjectResponseTypeError.NoFileID })
    }
    const objects = new ObjectResponseType()

    for (const id of ids) {
      const filename = typeof id === 'string' ? sanitizeFilename(id) : undefined
      if (filename === undefined) {
        objects.addError({ key: String(id), error: ObjectResponseTypeError.InvalidFilename })
        continue
      }
      const prefix = calculatePrefix(userId, filename)
      const existing = await this.repo.findOneBy({ ownerId: userId, key: prefix })
      if (!existing || !(await this.storage.exists(prefix))) {
        objects.addError({ key: filename, error: ObjectResponseTypeError.NotFound })
        continue
      }

      try {
        await this.quota.tryToDelete(userId, BigInt(existing.sizeBytes))
      } catch (error) {
        this.logger.warn(`QuotaTryToDelete from ${userId} error: ${errMsg(error)}`)
        throw new BadRequestException({ key: 'ids', error: QuotaError.QuotaDeleteFailed })
      }

      await this.storage.delete(prefix)
      await this.repo.delete({ ownerId: userId, key: prefix })
      objects.addSuccess({ key: filename, message: ObjectResponseTypeSuccess.DeleteSuccess })
      this.events.publish({ type: 'object.file.deleted', payload: { userId, filename } })
    }
    return { objects: objects.get() }
  }

  // --------------------------------------------------------------- download

  async download(
    userId: string,
    targetUserId: string,
    objectId: string,
    inline: boolean
  ): Promise<StreamableFile> {
    const filename = sanitizeFilename(objectId)
    if (filename === undefined) throw new ObjectsError(ObjectResponseTypeError.InvalidFilename)

    const prefix = calculatePrefix(targetUserId, filename)
    const object = await this.repo.findOneBy({
      ownerId: targetUserId,
      key: prefix,
      status: StorageObjectUploadStatus.complete,
      ...(targetUserId !== userId && { visibility: StorageObjectVisibility.public }),
    })
    if (!object) {
      throw new NotFoundException({ key: filename, error: ObjectResponseTypeError.NotFound })
    }

    try {
      await this.quota.tryToDownload(userId)
    } catch (error) {
      this.logger.warn(`QuotaTryToDownload from ${userId} error: ${errMsg(error)}`)
      throw new ObjectsError(QuotaError.NoDownloadRemaining, filename)
    }

    const stream = await this.storage.getStream(prefix)
    return inline
      ? new StreamableFile(stream, { type: object.mimeType, disposition: 'inline' })
      : new StreamableFile(stream, {
          type: 'application/octet-stream',
          disposition: `attachment; filename="${filename}"`,
        })
  }

  // ----------------------------------------------------------------- search

  async search(userId: string, targetUserId: string, filenames: string[]) {
    const keyToFilename = new Map<string, string>()
    for (const file of filenames) {
      const filename = sanitizeFilename(file)
      if (filename === undefined) throw new ObjectsError(ObjectResponseTypeError.InvalidFilename)
      keyToFilename.set(calculatePrefix(targetUserId, filename), filename)
    }
    const keys = [...keyToFilename.keys()]

    let rows: { key: string }[]
    try {
      rows = await this.repo.find({
        select: { key: true },
        where: {
          ownerId: targetUserId,
          key: In(keys),
          ...(targetUserId !== userId && { visibility: StorageObjectVisibility.public }),
        },
      })
    } catch {
      throw new ObjectsError(ObjectResponseTypeError.IndexError)
    }

    const found = new Set(rows.map((r) => r.key))
    return {
      found: keys.filter((k) => found.has(k)).map((k) => keyToFilename.get(k)!),
      notfound: keys.filter((k) => !found.has(k)).map((k) => keyToFilename.get(k)!),
    }
  }

  // ------------------------------------------------------------- visibility

  async changeVisibility(
    userId: string,
    rawFilename: string,
    visibility: string
  ): Promise<ObjectSuccess> {
    const filename = sanitizeFilename(rawFilename)
    if (filename === undefined) throw new ObjectsError(ObjectResponseTypeError.InvalidFilename)
    if (!Object.values(StorageObjectVisibility).includes(visibility as StorageObjectVisibility)) {
      throw new ObjectsError(ObjectResponseTypeError.InvalidVisibilityState, filename)
    }

    const result = await this.repo.update(
      { ownerId: userId, key: calculatePrefix(userId, filename) },
      { visibility: visibility as StorageObjectVisibility }
    )
    if (!result.affected) throw new ObjectsError(ObjectResponseTypeError.NotFound, filename)

    this.events.publish({
      type: 'object.file.visibility.updated',
      payload: { userId, filename, visibility: visibility as StorageObjectVisibility },
    })
    return { key: filename, message: ObjectResponseTypeSuccess.UpdateVisibilitySuccess }
  }
}
