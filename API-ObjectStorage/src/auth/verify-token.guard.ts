import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthTokenService } from './auth-token.service.js'

@Injectable()
export class VerifyTokenGuard implements CanActivate {
  constructor(private readonly auth: AuthTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { userId?: string }>()
    const token = req.header('authorization')?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedException({ message: 'Missing token' })

    let userId: string | null
    try {
      userId = await this.auth.verify(token)
    } catch {
      throw new UnauthorizedException({ message: 'Auth verification failed' })
    }
    if (userId === null) throw new UnauthorizedException({ message: 'Invalid token' })

    req.userId = userId
    return true
  }
}
