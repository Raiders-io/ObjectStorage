import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const MONITORING_SECRET = env.get('RESEND_API_KEY')

export default class MonitoringTokenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!(ctx.request.header('x-monitoring-secret') === MONITORING_SECRET))
      return ctx.response.unauthorized({ message: 'Unauthorized access' })
    const output = await next()
    return output
  }
}