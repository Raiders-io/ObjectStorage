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
} from '#class/objects'
import { disk, diskName, calculatePrefix } from '#services/disk'

export default class AccessObjectsController {
  async index({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const page = request.input('page', 1)
    let limit = request.input('limit', 10)
    if (limit < 0) limit = 1
    else if (limit > 100) limit = 100

    try {
      const result = await Object.query()
        .where('owner_id', userId)
        .select('key', 'name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)
      if (!result) throw new Error('Index Query')
      return { message: ObjectResponseTypeSuccess.IndexSuccess, objects: result }
    } catch (error) {
      return response.badRequest({ error: ObjectResponseTypeError.IndexError })
    }
  }

  async store({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const payload = await request.validateUsing(FilesValidator)

    if (!payload || payload?.files?.length === 0) {
      return response.badRequest(ObjectResponseTypeError.NoFileProvided)
    }

    const objects = new ObjectResponseType()

    for (const file of payload.files) {
      const fileName = `${file.clientName}`
      const s3Path = `files/${userId}/${fileName}`

      if (
        (await Object.query().where('owner_id', userId).where('key', s3Path).first()) ||
        (await disk.exists(s3Path))
      ) {
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.UploadAlreadyExists })
        continue
      }

      try {
        await QuotaTryToUpload(userId, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: s3Path, error: (error as Error).message })
        continue
      }

      const fileSave = await db.transaction(async (trx): Promise<boolean> => {
        await Object.create(
          {
            ownerId: userId,
            key: s3Path,
            name: fileName,
            sizeBytes: file.size,
            mimeType: file.type,
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
    return { objects: objects.get() }
  }

  async show({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    try {
      await QuotaTryToDownload(userId)
    } catch (error) {
      return response.badRequest((error as Error).message)
    }
    const prefix = calculatePrefix(userId, params.id) // List only files for the authenticated user
    if (
      (await Object.query().where('owner_id', userId).where('key', prefix).first()) ||
      (await disk.exists(prefix))
    ) {
      const stream = await disk.getStream(prefix)
      response.header('Content-Disposition', `attachment; filename="${params.id}"`)
      response.header('Content-Type', 'application/octet-stream')
      return response.stream(stream)
    }
    return response.notFound({
      key: params.id,
      error: ObjectResponseTypeError.NotFound,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const payload = await request.validateUsing(FileValidator)

    if (!payload || !payload.file) {
      return response.badRequest({
        key: params.id,
        error: ObjectResponseTypeError.NoFileProvided,
      })
    }

    if (params.id === undefined) {
      return response.badRequest({
        key: params.id,
        error: ObjectResponseTypeError.NoFileID,
      })
    }

    if (params.id !== payload.file.clientName) {
      return response.badRequest({
        key: params.id,
        error: ObjectResponseTypeError.FileNameMismatch,
      })
    }
    const file = payload.file
    try {
      await QuotaVerifyForUpdate(userId, BigInt(file.size))
    } catch (error) {
      return response.badRequest((error as Error).message)
    }

    const prefix = calculatePrefix(userId, params.id)
    const query = await Object.query()
      .select('size_bytes')
      .where('owner_id', userId)
      .where('key', prefix)
      .first()
    if (!query || !(await disk.exists(prefix))) {
      return response.notFound({
        key: params.id,
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
      key: params.id,
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
      try {
        await QuotaVerifyForUpdate(userId, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: file.clientName, error: (error as Error).message })
        continue
      }

      const prefix = calculatePrefix(userId, file.clientName)
      const query = await Object.query()
        .select('size_bytes')
        .where('owner_id', userId)
        .where('key', prefix)
        .first()
      if (!query || !(await disk.exists(prefix))) {
        objects.addError({ key: file.clientName, error: ObjectResponseTypeError.NotFound })
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
      objects.addSuccess({ key: file.clientName, message: ObjectResponseTypeSuccess.UpdateSuccess })
    }

    return { objects: objects.get() }
  }

  async destroy({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    if (params.id === undefined) {
      return response.badRequest({
        key: 'file',
        error: ObjectResponseTypeError.NoFileID,
      })
    }
    const id = params.id

    const prefix = calculatePrefix(userId, id)
    const query = await Object.query().where('owner_id', userId).where('key', prefix).first()
    if (!query || !(await disk.exists(prefix))) {
      return response.notFound({
        key: id,
        error: ObjectResponseTypeError.NotFound,
      })
    }
    try {
      await QuotaTryToDelete(userId, BigInt(query.sizeBytes))
    } catch (error) {
      return response.badRequest((error as Error).message)
    }
    await disk.delete(prefix)
    await Object.query().where('owner_id', userId).where('key', prefix).delete()

    return response.noContent({
      key: id,
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
      const prefix = calculatePrefix(userId, id)
      const query = await Object.query().where('owner_id', userId).where('key', prefix).first()
      if (!query || !(await disk.exists(prefix))) {
        objects.addError({ key: id, error: ObjectResponseTypeError.NotFound })
        continue
      }

      try {
        await QuotaTryToDelete(userId, BigInt(query.sizeBytes))
      } catch (error) {
        return response.badRequest({
          key: 'ids',
          error: (error as Error).message,
        })
      }

      await disk.delete(prefix)
      await Object.query().where('owner_id', userId).where('key', prefix).delete()
      objects.addSuccess({ key: id, message: ObjectResponseTypeSuccess.DeleteSuccess })
    }

    return { objects: objects.get() }
  }

  async updateInfo({ params, request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    if (params.id === undefined) {
      return response.badRequest({ key: 'file?', error: ObjectResponseTypeError.NoFileID })
    }
    const id = params.id
    const visibilityState = request.input('visibility', StorageObjectVisibility.private)
    if (!visibilityState || !(visibilityState in StorageObjectVisibility)) {
      return response.badRequest({ key: id, error: ObjectResponseTypeError.InvalidVisibilityState })
    }
    const prefix = calculatePrefix(userId, id)
    try {
      const result = await Object.query().where('owner_id', userId).where('key', prefix).update({
        visibility: visibilityState,
        updatedAt: new Date(),
      })
      if (result.length > 0 && result[0] > 0) {
        return {
          key: id,
          message: ObjectResponseTypeSuccess.UpdateVisibilitySuccess,
        }
      }
    } catch (error) {
      return response.badRequest({ key: id, error: ObjectResponseTypeError.IndexError })
    }
    return response.badRequest({ key: id, error: ObjectResponseTypeError.IndexError })
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
    const targetUser = params.userid
    const page = request.input('page', 1)
    let limit = request.input('limit', 10)
    if (limit < 0) limit = 1
    else if (limit > 100) limit = 100
    try {
      const result = await Object.query()
        .where('owner_id', targetUser)
        .where('visibility', 'public')
        .select('key', 'name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
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
      return response.badRequest((error as Error).message)
    }
    if (!params.userid || !params.id) {
      return response.badRequest({
        key: 'userid',
        error: ObjectResponseTypeError.InvalidUserID,
      })
    }
    const prefix = calculatePrefix(params.userid, params.id)
    try {
      if (
        (await Object.query()
          .where('owner_id', params.userid)
          .where('key', prefix)
          .where('visibility', 'public')
          .first()) ||
        (await disk.exists(prefix))
      ) {
        const stream = await disk.getStream(prefix)
        response.header('Content-Disposition', `attachment; filename="${params.id}"`)
        response.header('Content-Type', 'application/octet-stream')
        return response.stream(stream)
      }
      return response.notFound({
        key: params.id,
        error: ObjectResponseTypeError.NotFound,
      })
    } catch (error) {
      return response.badRequest({
        key: params.id,
        error: ObjectResponseTypeError.IndexError,
      })
    }
  }
}
