import type { HttpContext } from '@adonisjs/core/http'
import Quota from '#models/quota'

export default class QuotasController {
  async index({ request }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    for (let attempt: number = 0; attempt < 2; attempt++) {
      try {
        const res = await Quota.query()
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
        if (res) return res
        if (attempt === 0) {
          await Quota.create({ userId: userId })
          continue // try again to fetch the quota after creating it
        } else {
          // If we still can't find the quota after creating it, return an error
          return { error: 'Failed to create or retrieve quota for user' }
        }
      } catch (error) {
        if (error instanceof Error) {
          return { error: 'Failed to retrieve quota', details: error }
        }
        return { error: 'Failed to retrieve or create quota' }
      }
    }
  }

  //TODO: Admin could manually update quotas
  // async update({ auth, request }: HttpContext) {
}
