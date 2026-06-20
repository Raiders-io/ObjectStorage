import type { HttpContext } from '@adonisjs/core/http'
import Quota from '#models/quota'

export default class QuotasController {
  async index({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    try {
      return await Quota.query()
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
        .where('user_id', user.id)
        .first()
    } catch (error) {
      if (error instanceof Error) {
        return { error: 'Failed to retrieve quota', details: error }
      }
      return { error: 'Failed to retrieve quota' }
    }
  }

  //TODO: Admin could manually update quotas
  // async update({ auth, request }: HttpContext) {
}
