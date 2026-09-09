import type { HttpContext } from '@adonisjs/core/http'
import { indexAll, deleteAllObjectsForUser } from '#services/access_object_service'
import { publish } from '@yosone/broker'

export default class DataAccessesController {
  /**
   * Retrieve everything from a user
   */
  async index({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const res = await indexAll(userId)
    publish('object.events', {
      type: 'object.user.data',
      payload: { userId: userId, state: 'requested' },
    })
    if (res.status === 'ok') return response.ok(res)
    else return response.abort(res)
  }

  /**
   * Delete everything for a user
   */
  async destroy({ request, response }: HttpContext) {
    const userId = request.ctx?.userId || ''
    if (!userId || userId === '') throw new Error('User ID not found in context')

    const res = await deleteAllObjectsForUser(userId)
    publish('object.events', {
      type: 'object.user.data',
      payload: { userId: userId, state: 'deleted' },
    })
    if (res.status === 'ok') return response.ok(res)
    else return response.abort(res)
  }
}
