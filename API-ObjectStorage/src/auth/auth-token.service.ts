import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from '../config/env.js'

@Injectable()
export class AuthTokenService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Returns the user id for a valid token, `null` otherwise. */
  async verify(token: string): Promise<string | null> {
    try {
      const base = this.config.get('AUTH_SERVICE_URL', { infer: true })
      const url = new URL('api/v1/auth/verify', base.endsWith('/') ? base : `${base}/`)
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return null
      const body = (await res.json()) as { data?: { userId?: string } }
      return body.data?.userId ?? null
    } catch {
      return null
    }
  }
}
