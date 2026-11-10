import { Global, Module } from '@nestjs/common'
import { AuthTokenService } from './auth-token.service.js'
import { VerifyTokenGuard } from './verify-token.guard.js'

@Global()
@Module({
  providers: [AuthTokenService, VerifyTokenGuard],
  exports: [AuthTokenService, VerifyTokenGuard],
})
export class AuthModule {}
