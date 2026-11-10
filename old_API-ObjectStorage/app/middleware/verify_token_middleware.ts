import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import verifyToken from '#services/verify_token_service'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    userId: string
  }
}

export default class VerifyTokenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const token = request.header('authorization')?.replace('Bearer ', '')

    if (!token) return response.unauthorized({ message: 'Missing token' })

    try {
      const userId = await verifyToken(token)
      if (userId === null) return response.unauthorized({ message: 'Invalid token' })
      ctx.userId = userId
      return next()
    } catch {
      return response.unauthorized({ message: 'Auth verification failed' })
    }
  }
}
