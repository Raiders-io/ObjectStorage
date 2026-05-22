import { HttpContext } from '@adonisjs/core/http'
import { AvatarsValidator } from '#validators/user'
// import string from '@adonisjs/core/helpers/string'

export default class ProfileAvatarController {
  async update({ auth, request, response }: HttpContext) {
    if (auth.user?.id === undefined) {
      return response.unauthorized('User must be authenticated to upload an avatar')
    }

    const  payload  = await request.validateUsing(AvatarsValidator)

    if (!payload || payload?.avatars?.length === 0) {
      return response.badRequest('Please upload an avatar image')
    }

    for (const avatar of payload.avatars) {
      const fileName = `${avatar.clientName}`
      const path = `avatars/${auth.user.id}/${fileName}`
      // TODO: save name to postgres
      await avatar.moveToDisk(path) //not working now for s3
    }
    if (payload.avatars.length === 1) {
      return 'Avatar uploaded successfully'
    }
    else {
      return `The ${payload.avatars.length} avatars uploaded successfully`
    }
  }
}
