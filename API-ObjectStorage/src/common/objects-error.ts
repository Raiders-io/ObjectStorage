import { ArgumentsHost, Catch, type ExceptionFilter } from '@nestjs/common'
import type { Response } from 'express'

/** Business error raised by services; rendered as a 400 `{ key?, error }` by the filter below. */
export class ObjectsError extends Error {
  constructor(
    message: string,
    readonly key?: string
  ) {
    super(message)
    this.name = 'ObjectsError'
  }
}

@Catch(ObjectsError)
export class ObjectsErrorFilter implements ExceptionFilter {
  catch(exception: ObjectsError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>()
    res.status(400).json({ key: exception.key, error: exception.message })
  }
}
