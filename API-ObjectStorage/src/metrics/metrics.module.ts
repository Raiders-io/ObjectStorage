import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import {
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus'
import { HTTP_DURATION_METRIC, HttpMetricsInterceptor } from './http-metrics.interceptor.js'

@Module({
  imports: [
    PrometheusModule.register({
      path: '/private/object/metrics',
      defaultMetrics: { enabled: true, config: { prefix: 'objectApi_' } },
    }),
  ],
  providers: [
    makeHistogramProvider({
      name: HTTP_DURATION_METRIC,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    }),
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class MetricsModule {}
