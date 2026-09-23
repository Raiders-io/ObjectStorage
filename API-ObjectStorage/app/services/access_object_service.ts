import Object from '#models/object'
import Quota from '#models/quota'
import { QuotaTryToDownload } from '#services/quota'
import { QuotaError } from '#class/quota'
import { calculatePrefix, getDisk } from '#services/disk'
import { sanitizeFilename } from '#services/sanitize-utils'
import { StorageObjectUploadStatus, StorageObjectVisibility } from '#enums/storage_objects'
import { HttpContext } from '@adonisjs/core/http'
import { ObjectResponseTypeError, ObjectResponseTypeSuccess, ObjectSuccess } from '#class/objects'
import { publish } from '@yosone/broker'
import { ObjectFileVisibilityUpdatedEvent } from '#class/events'

export async function indexAll(
  userId: string
): Promise<{ status: string; objects: any; quota: any } | { status: string; message: string }> {
  if (!userId || userId === '') throw new Error('User ID not found in context')

  try {
    const objectResponse = await Object.query()
      .where('owner_id', userId)
      .select('key', 'name', 'size_bytes', 'mime_type', 'visibility', 'created_at')
      .orderBy('created_at', 'desc')
    const quotaResponse = await Quota.query()
      .select(
        'storage_bytes',
        'storage_bytes_limit',
        'object_count',
        'object_count_limit',
        'download_count',
        'download_count_limit',
        'upload_count',
        'upload_count_limit',
        'download_count_reset_at',
        'upload_count_reset_at',
        'updated_at'
      )
      .where('user_id', userId)
      .first()
    return {
      status: objectResponse && quotaResponse ? 'ok' : 'error',
      objects: objectResponse,
      quota: quotaResponse,
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'Error retrieving data',
    }
  }
}

export async function deleteAllObjectsForUser(
  userId: string
): Promise<{ status: string; objects: string; quota: string }> {
  if (!userId || userId === '') throw new Error('User ID not found in context')

  let objectResponse
  try {
    objectResponse = await Object.query().where('owner_id', userId).delete()
  } catch (error) {}
  let quotaResponse
  try {
    quotaResponse = await Quota.query().where('user_id', userId).delete()
  } catch (error) {}
  const prefix = calculatePrefix(userId)
  await getDisk().deleteAll(prefix)
  const res = {
    status: objectResponse && quotaResponse ? 'ok' : 'error',
    objects: 'Deleted',
    quota: 'Deleted',
  }
  return res
}

export const downloadLogic = async (
  userId: string,
  targetUserId: string,
  objectId: string,
  wantInline: boolean,
  response: HttpContext['response']
) => {
  if (!userId || userId === '') throw new Error('User ID not found in context')
  try {
    await QuotaTryToDownload(userId)
  } catch (error) {
    console.log(`QuotaTryToDownload from ${userId} error:`, (error as Error).message)
    throw new Error(QuotaError.NoDownloadRemaining)
  }
  if (!targetUserId || targetUserId === '') throw new Error('Target User ID not found in context')
  const filename = sanitizeFilename(objectId)
  const prefix = calculatePrefix(targetUserId, filename) // List only files for the authenticated user
  let object: Object | null = null
  if (targetUserId !== userId)
    object = await Object.query()
      .where('owner_id', targetUserId)
      .where('key', prefix)
      .where('visibility', 'public')
      .first()
  else object = await Object.query().where('owner_id', userId).where('key', prefix).first()
  if (
    (object && object.status === StorageObjectUploadStatus.complete) ||
    (await getDisk().exists(prefix))
  ) {
    const stream = await getDisk().getStream(prefix)
    if (wantInline) {
      response.header('Content-Disposition', 'inline')
      response.header('Content-Type', object?.mimeType || 'application/pdf')
    } else {
      response.header('Content-Disposition', `attachment; filename="${filename}"`)
      response.header('Content-Type', 'application/octet-stream')
    }
    return response.stream(stream)
  }
}

export const searchLogic = async (
  userId: string,
  targetUserId: string,
  filenameArray: string[]
) => {
  if (!userId || userId === '') throw new Error('User ID not found in context')

  if (!targetUserId || targetUserId === '') throw new Error('Target User ID not found in context')

  const keyToFilename = new Map<string, string>()
  for (const file of filenameArray) {
    const filename = sanitizeFilename(file)
    if (filename !== undefined) {
      const prefix = calculatePrefix(targetUserId, filename)
      keyToFilename.set(prefix, filename)
    } else {
      throw new Error(ObjectResponseTypeError.InvalidFilename)
    }
  }
  const sanitizedFiles = [...keyToFilename.keys()]
  try {
    let result: { key: string }[] | null = null

    if (targetUserId !== userId)
      result = await Object.query()
        .where('owner_id', targetUserId)
        .where('visibility', StorageObjectVisibility.public)
        .whereIn('key', sanitizedFiles)
        .select('key')
        .pojo<{ key: string }>()
    else
      result = await Object.query()
        .where('owner_id', userId)
        .whereIn('key', sanitizedFiles)
        .select('key')
        .pojo<{ key: string }>()
    if (!result) throw new Error('Index Query')
    const foundKeys = new Set(result.map((r) => r.key))
    return {
      found: sanitizedFiles.filter((k) => foundKeys.has(k)).map((k) => keyToFilename.get(k)!),
      notfound: sanitizedFiles.filter((k) => !foundKeys.has(k)).map((k) => keyToFilename.get(k)!),
    }
  } catch (error) {
    throw new Error(ObjectResponseTypeError.IndexError)
  }
}

export async function changeVisibility(
  userId: string,
  rawFilename: string,
  visibilityState: StorageObjectVisibility
): Promise<ObjectSuccess> {
  const filename = sanitizeFilename(rawFilename)
  if (filename === undefined) {
    throw new Error(ObjectResponseTypeError.InvalidFilename)
  }
  if (!visibilityState || !(visibilityState in StorageObjectVisibility)) {
    throw new Error(ObjectResponseTypeError.InvalidVisibilityState)
  }
  const prefix = calculatePrefix(userId, filename)
  try {
    const result = await Object.query()
      .where('owner_id', userId)
      .where('key', prefix)
      .update({ visibility: visibilityState })
    const event: ObjectFileVisibilityUpdatedEvent = {
      type: 'object.file.visibility.updated',
      payload: {
        userId: userId,
        filename: filename,
        visibility: visibilityState,
      },
    }
    publish('object.events', event)
    if (result.length > 0 && result[0] > 0) {
      return {
        key: filename,
        message: ObjectResponseTypeSuccess.UpdateVisibilitySuccess,
      }
    }
    throw new Error(ObjectResponseTypeError.IndexError)
  } catch (e) {
    if (e instanceof Error && e.message in ObjectResponseTypeError) {
      throw new Error(e.message)
    }
    throw new Error(ObjectResponseTypeError.IndexError)
  }
}
