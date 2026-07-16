import type { HttpContext } from '@adonisjs/core/http'
import Object from '#models/object'
import Quota from '#models/quota'
import drive from '@adonisjs/drive/services/main'

const diskName = 's3'
const disk = drive.use(diskName)

export default class DataAccessesController {
  /**
   * Retrieve everything from a user
   */
  async index({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
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
      return response.abort({ message: 'Error retrieving data' })
    }
  }

  /**
   * Delete everything for a user
   */
  async destroy({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    let objectResponse
    try {
      objectResponse = await Object.query().where('owner_id', userId).delete()
    } catch (error) {}
    let quotaResponse
    try {
      quotaResponse = await Quota.query().where('user_id', userId).delete()
    } catch (error) {}
    const prefix = `files/${userId}/`
    await disk.deleteAll(prefix)
    const res = {
      status: objectResponse && quotaResponse ? 'ok' : 'error',
      objects: 'Deleted',
      quota: 'Deleted',
    }
    if (objectResponse && quotaResponse) return response.ok(res)
    else return response.abort(res)
  }
}
