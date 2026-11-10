import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

/** Injects the user id resolved by VerifyTokenGuard. */
export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().userId as string
})
