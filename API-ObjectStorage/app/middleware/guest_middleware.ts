import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Guest middleware is used to prevent already authenticated users from accessing certain routes. 
 * If the user is authenticated, they will receive a 401 Unauthorized response. 
 * If the user is not authenticated, they will be allowed to proceed to continue.
 */
export default class GuestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await ctx.auth.use('api').authenticate()
      return ctx.response.unauthorized(
        {
          error: 'You are already logged in'
        })
    } catch (err) // Not a real error, just means the user is not authenticated
    {
      return next()
    }
  }
}
