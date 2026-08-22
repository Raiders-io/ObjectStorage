import Object from '#models/object'
import Quota from '#models/quota'
import { QuotaTryToDownload } from '#services/quota'
import { QuotaError } from '#class/quota'
import { calculatePrefix, getDisk } from '#services/disk'
import { sanitizeFilename } from '#services/sanitize-utils'
import { StorageObjectUploadStatus } from '#enums/storage_objects'
import { HttpContext } from '@adonisjs/core/http'

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

export const downloadLogic = async (userId: string, objectId: string, wantInline: boolean, response: HttpContext['response']) => {
  if (!userId || userId === '') throw new Error('User ID not found in context')  
  try {
    await QuotaTryToDownload(userId)
  } catch (error) {
    console.log(`QuotaTryToDownload from ${userId} error:`, (error as Error).message)
    throw new Error(QuotaError.NoDownloadRemaining)
  }
  const filename = sanitizeFilename(objectId)
  const prefix = calculatePrefix(userId, filename) // List only files for the authenticated user
  const object = await Object.query().where('owner_id', userId).where('key', prefix).first()
  if (
    ( object && object.status === StorageObjectUploadStatus.complete ) ||
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
