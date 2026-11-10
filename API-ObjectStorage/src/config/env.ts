import { z } from 'zod'

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: z.coerce.number().int().default(3333),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.string().default('info'),
    CORS_ORIGIN: z.string().optional(),
    AUTH_SERVICE_URL: z.string().url(),

    DRIVE_DISK: z.enum(['s3', 'fs']).default('s3'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    FS_STORAGE_PATH: z.string().default('storage'),

    POSTGRES_SERVICE_NAME: z.string(),
    POSTGRES_PORT: z.coerce.number().int(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),

    REDIS_URL: z.string(),
    CONSUMER_ID: z.string(),
  })
  .superRefine((env, ctx) => {
    if (env.DRIVE_DISK !== 's3') return
    for (const key of [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'S3_BUCKET',
      'S3_ENDPOINT',
    ] as const) {
      if (!env[key]) {
        ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when DRIVE_DISK=s3` })
      }
    }
  })

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw)
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment variables:\n${details}`)
  }
  return parsed.data
}

/** Maps pino-style levels (info, trace...) used by the Adonis version to Nest log levels. */
export function nestLogLevels(
  level: string
): ('fatal' | 'error' | 'warn' | 'log' | 'debug' | 'verbose')[] {
  const order = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'] as const
  const map: Record<string, (typeof order)[number]> = {
    fatal: 'fatal',
    error: 'error',
    warn: 'warn',
    info: 'log',
    log: 'log',
    debug: 'debug',
    trace: 'verbose',
    verbose: 'verbose',
  }
  const idx = order.indexOf(map[level] ?? 'log')
  return order.slice(0, idx + 1) as any
}
