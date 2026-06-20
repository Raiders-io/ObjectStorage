import type { HttpContext } from '@adonisjs/core/http'
import { FilesValidator, FileValidator } from '#validators/file'
import drive from '@adonisjs/drive/services/main'
import Object from '#models/object'
import { StorageObjectUploadStatus, StorageObjectVisibility } from '#enums/storage_objects'
import db from '@adonisjs/lucid/services/db'
import {
  QuotaTryToUpload,
  QuotaTryToDownload,
  QuotaTryToUpdate,
  QuotaTryToDelete,
} from '#functions/quota'
import {
  ObjectResponseType,
  ObjectResponseTypeSuccess,
  ObjectResponseTypeError,
} from '#class/objects'

const diskName = 's3'
const disk = drive.use(diskName)

export default class AccessObjectsController {
  async index({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()

    const page = request.input('page', 1)
    let limit = request.input('limit', 10)
    if (limit > 100)
      limit = 100

    try {
      const response = await Object.query()
        .where('owner_id', user.id)
        .select('key', 'name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)
      return { message: ObjectResponseTypeSuccess.IndexSuccess, objects: response }
    } catch (error) {
      return { error: ObjectResponseTypeError.IndexError }
    }
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(FilesValidator)

    if (!payload || payload?.files?.length === 0) {
      return response.badRequest(ObjectResponseTypeError.NoFileProvided)
    }

    const objects = new ObjectResponseType()

    for (const file of payload.files) {
      const fileName = `${file.clientName}`
      const s3Path = `files/${user.id}/${fileName}`

      if (
        (await Object.query().where('owner_id', user.id).where('key', s3Path).first()) ||
        (await disk.exists(s3Path))
      ) {
        objects.addError({ key: s3Path, error: ObjectResponseTypeError.UploadAlreadyExists })
        continue
      }

      try {
        await QuotaTryToUpload(user.id, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: s3Path, error: (error as Error).message })
        continue
      }

      const fileSave = await db.transaction(async (trx): Promise<boolean> => {
        await Object.create(
          {
            ownerId: user.id,
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
          await Object.query().where('owner_id', user.id).where('key', s3Path).update({
            status: StorageObjectUploadStatus.complete,
          })
        })
      } catch (error) {
        await db.transaction(async () => {
          await Object.query().where('owner_id', user.id).where('key', s3Path).delete()
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

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      await QuotaTryToDownload(user.id)
    } catch (error) {
      return response.badRequest((error as Error).message)
    }

    const prefix = `files/${user.id}/${params.id}` // List only files for the authenticated user
    if (
      (await Object.query().where('owner_id', user.id).where('key', prefix).first()) ||
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

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

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
      await QuotaTryToUpdate(user.id, BigInt(file.size))
    } catch (error) {
      return response.badRequest((error as Error).message)
    }

    const prefix = `files/${user.id}/${params.id}`
    if (
      !(await Object.query().where('owner_id', user.id).where('key', prefix).first()) ||
      !(await disk.exists(prefix))
    ) {
      return response.notFound({
        key: params.id,
        error: ObjectResponseTypeError.NotFound,
      })
    }

    await db.transaction(async () => {
      await Object.query().where('owner_id', user.id).where('key', prefix).update({
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

  async updateMany({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

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
        await QuotaTryToUpdate(user.id, BigInt(file.size))
      } catch (error) {
        objects.addError({ key: file.clientName, error: (error as Error).message })
        continue
      }

      const prefix = `files/${user.id}/${file.clientName}`
      if (
        !(await Object.query().where('owner_id', user.id).where('key', prefix).first()) ||
        !(await disk.exists(prefix))
      ) {
        objects.addError({ key: file.clientName, error: ObjectResponseTypeError.NotFound })
        continue
      }
      await db.transaction(async () => {
        await Object.query().where('owner_id', user.id).where('key', prefix).update({
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

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (params.id === undefined) {
      return response.badRequest({
        key: 'file',
        error: ObjectResponseTypeError.NoFileID,
      })
    }
    const id = params.id

    const prefix = `files/${user.id}/${id}`
    const query = await Object.query().where('owner_id', user.id).where('key', prefix).first()
    if (!query || !(await disk.exists(prefix))) {
      return response.notFound({
        key: id,
        error: ObjectResponseTypeError.NotFound,
      })
    }
    try {
      await QuotaTryToDelete(user.id, BigInt(query.sizeBytes))
    } catch (error) {
      return response.badRequest((error as Error).message)
    }
    await disk.delete(prefix)
    await Object.query().where('owner_id', user.id).where('key', prefix).delete()

    return {
      key: id,
      message: ObjectResponseTypeSuccess.DeleteSuccess,
    }
  }

  async destroyMany({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const ids = request.input('ids') as string[] | undefined

    if (!ids || ids.length === 0) {
      return response.badRequest({
        key: 'ids',
        error: ObjectResponseTypeError.NoFileID,
      })
    }

    const objects = new ObjectResponseType()

    for (const id of ids) {
      const prefix = `files/${user.id}/${id}`
      const query = await Object.query().where('owner_id', user.id).where('key', prefix).first()
      if (!query || !(await disk.exists(prefix))) {
        objects.addError({ key: id, error: ObjectResponseTypeError.NotFound })
        continue
      }

      try {
        await QuotaTryToDelete(user.id, BigInt(query.sizeBytes))
      } catch (error) {
        return response.badRequest({
          key: 'ids',
          error: (error as Error).message,
        })
      }

      await disk.delete(prefix)
      await Object.query().where('owner_id', user.id).where('key', prefix).delete()
      objects.addSuccess({ key: id, message: ObjectResponseTypeSuccess.DeleteSuccess })
    }

    return { objects: objects.get() }
  }
}
