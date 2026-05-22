import { HttpContext } from '@adonisjs/core/http'
import { AvatarValidator } from '#validators/user'
// import string from '@adonisjs/core/helpers/string'

export default class ProfileAvatarController {
  async update({ ctx, request, response }: HttpContext) {
    const { avatar } = await request.validateUsing(AvatarValidator)

    if (!avatar) {
      return response.badRequest('Please upload an avatar image')
    }
    // const fileName = `${string.uuid()}.${avatar.extname}`
    const fileName = `${avatar.clientName}`
    const path = `${request.url()}/${fileName}`
    
    /**
     * Move file using the pre-configured drive disk.
     */
    await avatar.moveToDisk(path)

    // await request.drive.put(avatar.clientName, avatar)
    return 'Avatar uploaded successfully'
  }
}
