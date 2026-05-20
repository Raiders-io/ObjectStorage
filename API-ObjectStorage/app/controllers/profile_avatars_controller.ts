import { HttpContext } from '@adonisjs/core/http'
import { AvatarValidator } from '#validators/user'

export default class ProfileAvatarController {
  async update({ request, response }: HttpContext) {

    const avatar = await request.validateUsing(AvatarValidator)

    if (!avatar) {
      return response.badRequest('Please upload an avatar image')
    }
    
    console.log(avatar)
    
    return 'Avatar uploaded successfully'
  }
}
