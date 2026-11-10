import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import type { Request, Response } from 'express'
import type { Histogram } from '@prometheus-io/client'
import type { Observable } from 'rxjs'

export const HTTP_DURATION_METRIC = 'objectApi_http_request_duration_seconds'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(@InjectMetric(HTTP_DURATION_METRIC) private readonly histogram: Histogram<string>) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle()
    const http = context.switchToHttp()
    const req = http.getRequest<Request>()
    const res = http.getResponse<Response>()
    const end = this.histogram.startTimer()
    // 'finish' fires after exception filters ran, so the status code is the final one.
    res.once('finish', () => {
      end({
        method: req.method,
        route: req.route?.path ?? 'unknown',
        status_code: String(res.statusCode),
      })
    })
    return next.handle()
  }
}
