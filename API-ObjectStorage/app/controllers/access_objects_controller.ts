import type { HttpContext } from '@adonisjs/core/http'
import { FilesValidator, FileValidator } from '#validators/file'
import Object from '#models/object'
import { StorageObjectUploadStatus, StorageObjectVisibility } from '#enums/storage_objects'
import db from '@adonisjs/lucid/services/db'
import {
  QuotaVerifyForUpdate,
  QuotaTryToUpload,
  QuotaTryToDownload,
  QuotaTryToUpdate,
  QuotaTryToDelete,
} from '#services/quota'
import {
  ObjectResponseType,
  ObjectResponseTypeSuccess,
  ObjectResponseTypeError,
  type ObjectError,
  type ObjectSuccess,
} from '#class/objects'
import { getDisk, diskName, calculatePrefix } from '#services/disk'

import { QuotaError } from '#class/quota'
import { sanitizeFilename, sanitizeUserId } from '#services/sanitize-utils'
import { mime } from '@adonisjs/core/http/helpers'
import { downloadLogic } from '#services/access_object_service'

export default class AccessObjectsController {
  async index({
    request,
    response,
  }: HttpContext): Promise<
    { message: string; objects: any } | { __response: string; __status: number }
  > {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const page = request.input('page', 1)
    let limit = request.input('limit', 10)
    if (limit < 0) limit = 1
    else if (limit > 100) limit = 100

    try {
      const result = await Object.query()
        .where('owner_id', userId)
        .select('name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)
      if (!result) throw new Error('Index Query')
      return { message: ObjectResponseTypeSuccess.IndexSuccess, objects: result }
    } catch (error) {
      return response.badRequest(ObjectResponseTypeError.IndexError)
    }
  }

  async store({
    request,
    response,
  }: HttpContext): Promise<
    { objects: (ObjectError | ObjectSuccess)[] } | { __response: string; __status: number }
  > {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const payload = await request.validateUsing(FilesValidator)

    if (!payload || payload?.files?.length === 0) {
      return response.badRequest(ObjectResponseTypeError.NoFileProvided)
    }

    const objects = new ObjectResponseType()

    for (const file of payload.files) {
      const fileName = sanitizeFilename(file.clientName)
      if (fileName === undefined && payload.files.length === 1)
        return response.badRequest(ObjectResponseTypeError.InvalidFilename)

      if (fileName === undefined) {
        objects.addError({ key: file.clientName, error: ObjectResponseTypeError.NoFileID })
        continue
      }
      const s3Path = `files/${userId}/${fileName}`

      if (
        (await Object.query().where('owner_id', userId).where('key', s3Path).first()) ||
        (await getDisk().exists(s3Path))
      ) {
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.UploadAlreadyExists })
        continue
      }

      try {
        await QuotaTryToUpload(userId, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: fileName, error: QuotaError.NoUploadRemaining })
        console.log(`QuotaTryToUpload from ${userId} error:`, (error as Error).message)
        continue
      }

      const fileSave = await db.transaction(async (trx): Promise<boolean> => {
        await Object.create(
          {
            ownerId: userId,
            key: s3Path,
            name: fileName,
            sizeBytes: file.size,
            mimeType: mime.lookup(fileName) || file.type || 'application/octet-stream',
            visibility: StorageObjectVisibility.private,
            status: StorageObjectUploadStatus.uploading,
          },
          { client: trx }
        )
        return true
      })
      if (!fileSave) {
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.FailedToSaveFile })
        continue
      }
      try {
        await file.moveToDisk(s3Path, diskName)
        await db.transaction(async () => {
          await Object.query().where('owner_id', userId).where('key', s3Path).update({
            status: StorageObjectUploadStatus.complete,
          })
        })
      } catch (error) {
        await db.transaction(async () => {
          await Object.query().where('owner_id', userId).where('key', s3Path).delete()
        })
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.UploadError })
        continue
      }
      objects.addSuccess({ key: s3Path, message: ObjectResponseTypeSuccess.UploadSuccess })
    }
    if (objects.length === 0) {
      return response.internalServerError(ObjectResponseTypeError.UploadError)
    }
    if (objects.length === 1 && objects.get()[0].key && 'error' in objects.get()[0]) {
      return response.badRequest((objects.get()[0] as ObjectError).error)
    }
    return { objects: objects.get() }
  }

  async show({ params, request, response }: HttpContext) {
    try {
      return await downloadLogic(request.ctx?.userId || '', params.id, false, response)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  async preview({ params, request, response }: HttpContext) {
    try {
      return await downloadLogic(request.ctx?.userId || '', params.id, true, response)
    } catch (error) {
      return response.badRequest(error)
    }
  }

  async update({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const payload = await request.validateUsing(FileValidator)

    const filename = sanitizeFilename(params.id)

    if (!payload || !payload.file) {
      return response.badRequest({
        key: filename,
        error: ObjectResponseTypeError.NoFileProvided,
      })
    }

    if (filename === undefined) {
      return response.badRequest({
        key: filename,
        error: ObjectResponseTypeError.NoFileID,
      })
    }

    if (filename !== payload.file.clientName) {
      return response.badRequest({
        key: filename,
        error: ObjectResponseTypeError.FileNameMismatch,
      })
    }
    const file = payload.file
    try {
      await QuotaVerifyForUpdate(userId, BigInt(file.size))
    } catch (error) {
      console.log('QuotaVerifyForUpdate error:', (error as Error).message)
      return response.badRequest({
        key: filename,
        error: QuotaError.NoUpdateRemaining,
      })
    }

    const prefix = calculatePrefix(userId, filename)
    const query = await Object.query()
      .select('size_bytes')
      .where('owner_id', userId)
      .where('key', prefix)
      .first()
    if (!query || !(await getDisk().exists(prefix))) {
      return response.notFound({
        key: filename,
        error: ObjectResponseTypeError.NotFound,
      })
    }
    await QuotaTryToUpdate(userId, BigInt(file.size), BigInt(query.sizeBytes))
    await db.transaction(async () => {
      await Object.query().where('owner_id', userId).where('key', prefix).update({
        sizeBytes: file.size,
        mimeType: file.type,
        updatedAt: new Date(),
      })
    })

    await file.moveToDisk(prefix, diskName)

    return {
      key: filename,
      message: ObjectResponseTypeSuccess.UpdateSuccess,
    }
  }

  async updateMany({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const payload = await request.validateUsing(FilesValidator)

    if (!payload || payload.files.length === 0) {
      return response.badRequest({
        key: 'files[]',
        error: ObjectResponseTypeError.NoFileProvided,
      })
    }

    const objects = new ObjectResponseType()

    for (const file of payload.files) {
      const filename = sanitizeFilename(file.clientName)
      if (filename === undefined) {
        return response.badRequest({
          key: file.clientName,
          error: ObjectResponseTypeError.NoFileID,
        })
      }
      try {
        await QuotaVerifyForUpdate(userId, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: filename, error: QuotaError.NoUpdateRemaining })
        console.log(`QuotaVerifyForUpdate from ${userId} error:`, (error as Error).message)
        continue
      }

      const prefix = calculatePrefix(userId, filename)
      const query = await Object.query()
        .select('size_bytes')
        .where('owner_id', userId)
        .where('key', prefix)
        .first()
      if (!query || !(await getDisk().exists(prefix))) {
        objects.addError({ key: filename, error: ObjectResponseTypeError.NotFound })
        continue
      }
      await QuotaTryToUpdate(userId, BigInt(file.size), BigInt(query.sizeBytes))
      await db.transaction(async () => {
        await Object.query().where('owner_id', userId).where('key', prefix).update({
          sizeBytes: file.size,
          mimeType: file.type,
          updatedAt: new Date(),
        })
      })

      await file.moveToDisk(prefix, diskName)
      objects.addSuccess({ key: filename, message: ObjectResponseTypeSuccess.UpdateSuccess })
    }

    return { objects: objects.get() }
  }

  async destroy({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const filename = sanitizeFilename(params.id)
    if (filename === undefined) {
      return response.badRequest({
        key: 'file',
        error: ObjectResponseTypeError.NoFileID,
      })
    }

    const prefix = calculatePrefix(userId, filename)
    const query = await Object.query().where('owner_id', userId).where('key', prefix).first()
    if (!query || !(await getDisk().exists(prefix))) {
      return response.notFound({
        key: filename,
        error: ObjectResponseTypeError.NotFound,
      })
    }
    try {
      await QuotaTryToDelete(userId, BigInt(query.sizeBytes))
    } catch (error) {
      console.log(`QuotaTryToDelete from ${userId} error:`, (error as Error).message)
      return response.badRequest(QuotaError.QuotaDeleteFailed)
    }
    await getDisk().delete(prefix)
    await Object.query().where('owner_id', userId).where('key', prefix).delete()

    return response.noContent({
      key: filename,
      message: ObjectResponseTypeSuccess.DeleteSuccess,
    })
  }

  async destroyMany({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const ids = request.input('ids') as string[] | undefined

    if (!ids || ids.length === 0) {
      return response.badRequest({
        key: 'ids',
        error: ObjectResponseTypeError.NoFileID,
      })
    }

    const objects = new ObjectResponseType()

    for (const id of ids) {
      const filename = sanitizeFilename(id)

      if (filename === undefined) {
        objects.addError({ key: id, error: ObjectResponseTypeError.InvalidFilename })
        continue
      }

      const prefix = calculatePrefix(userId, filename)
      const query = await Object.query().where('owner_id', userId).where('key', prefix).first()
      if (!query || !(await getDisk().exists(prefix))) {
        objects.addError({ key: filename, error: ObjectResponseTypeError.NotFound })
        continue
      }

      try {
        await QuotaTryToDelete(userId, BigInt(query.sizeBytes))
      } catch (error) {
        console.log(`QuotaTryToDelete from ${userId} error:`, (error as Error).message)
        return response.badRequest({
          key: 'ids',
          error: QuotaError.QuotaDeleteFailed,
        })
      }

      await getDisk().delete(prefix)
      await Object.query().where('owner_id', userId).where('key', prefix).delete()
      objects.addSuccess({ key: filename, message: ObjectResponseTypeSuccess.DeleteSuccess })
    }

    return { objects: objects.get() }
  }

  async updateInfo({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    if (params.id === undefined) {
      return response.badRequest({ key: 'file?', error: ObjectResponseTypeError.NoFileID })
    }
    const filename = sanitizeFilename(params.id)
    const visibilityState = request.input('visibility', StorageObjectVisibility.private)
    if (!visibilityState || !(visibilityState in StorageObjectVisibility)) {
      return response.badRequest({
        key: filename,
        error: ObjectResponseTypeError.InvalidVisibilityState,
      })
    }
    const prefix = calculatePrefix(userId, filename)
    try {
      const result = await Object.query().where('owner_id', userId).where('key', prefix).update({
        visibility: visibilityState,
        updatedAt: new Date(),
      })
      if (result.length > 0 && result[0] > 0) {
        return {
          key: filename,
          message: ObjectResponseTypeSuccess.UpdateVisibilitySuccess,
        }
      }
    } catch (error) {
      return response.badRequest({ key: filename, error: ObjectResponseTypeError.IndexError })
    }
    return response.badRequest({ key: filename, error: ObjectResponseTypeError.IndexError })
  }

  // Special routes for Accessing objects from other users
  async indexFrom({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    if (!params.userid) {
      return response.badRequest({
        key: 'userid',
        error: ObjectResponseTypeError.InvalidUserID,
      })
    }
    const targetUser = sanitizeUserId(params.userid)
    if (targetUser === undefined) {
      return response.badRequest({
        key: 'userid',
        error: ObjectResponseTypeError.InvalidUserID,
      })
    }
    const page = request.input('page', 1)
    let limit = request.input('limit', 10)
    if (limit < 0) limit = 1
    else if (limit > 100) limit = 100
    try {
      const result = await Object.query()
        .where('owner_id', targetUser)
        .where('visibility', 'public')
        .select('name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)
      return { message: ObjectResponseTypeSuccess.IndexSuccess, objects: result }
    } catch (error) {
      return response.badRequest({ key: targetUser, error: ObjectResponseTypeError.IndexError })
    }
  }

  async showFrom({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    try {
      await QuotaTryToDownload(userId)
    } catch (error) {
      console.log(`QuotaTryToDownload from ${userId} error:`, (error as Error).message)
      return response.badRequest(QuotaError.NoDownloadRemaining)
    }
    if (!params.userid || !params.id) {
      return response.badRequest({
        key: 'userid',
        error: ObjectResponseTypeError.InvalidUserID,
      })
    }
    const targetUser = sanitizeUserId(params.userid)
    if (targetUser === undefined) {
      return response.badRequest({
        key: 'userid',
        error: ObjectResponseTypeError.InvalidUserID,
      })
    }
    const filename = sanitizeFilename(params.id)
    if (filename === undefined) {
      return response.badRequest({
        key: filename,
        error: ObjectResponseTypeError.InvalidFilename,
      })
    }
    const prefix = calculatePrefix(targetUser, filename)
    try {
      if (
        (await Object.query()
          .where('owner_id', targetUser)
          .where('key', prefix)
          .where('visibility', 'public')
          .first()) ||
        (await getDisk().exists(prefix))
      ) {
        const stream = await getDisk().getStream(prefix)
        response.header('Content-Disposition', `attachment; filename="${filename}"`)
        response.header('Content-Type', 'application/octet-stream')
        return response.stream(stream)
      }
      return response.notFound({
        key: filename,
        error: ObjectResponseTypeError.NotFound,
      })
    } catch (error) {
      return response.badRequest({
        key: filename,
        error: ObjectResponseTypeError.IndexError,
      })
    }
  }
}
