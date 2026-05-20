import { HttpContext } from '@adonisjs/core/http'

export default class ProfileAvatarController {
  async update({ request, response }: HttpContext) {
    const avatar = request.file('avatar')
    
    if (!avatar) {
      return response.badRequest('Please upload an avatar image')
    }
    
    console.log(avatar)
    
    return 'Avatar uploaded successfully'
  }
}
