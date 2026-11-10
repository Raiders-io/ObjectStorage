import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { AppModule } from './app.module.js'
import { ObjectsErrorFilter } from './common/objects-error.js'
import { type Env, nestLogLevels } from './config/env.js'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: nestLogLevels(process.env.LOG_LEVEL ?? 'info'),
  })
  const config = app.get(ConfigService<Env, true>)

  // @adonisjs/shield equivalent (xFrame DENY, HSTS 180 days, nosniff)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: { action: 'deny' },
      hsts: { maxAge: 180 * 24 * 60 * 60 },
    })
  )

  const corsOrigin = config.get('CORS_ORIGIN', { infer: true })
  const inDev = config.get('NODE_ENV', { infer: true }) !== 'production'
  const origins = corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : undefined
  app.enableCors({
    origin: origins ?? (inDev ? true : '*'),
    credentials: origins !== undefined || inDev,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxAge: 90,
  })

  // multipart is handled per-route by multer; JSON/urlencoded keep the 1mb limit of the Adonis config
  app.useBodyParser('json', { limit: '1mb' })
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true })

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, errorHttpStatusCode: 422 })
  )
  app.useGlobalFilters(new ObjectsErrorFilter())
  app.enableShutdownHooks()

  await app.listen(config.get('API_PORT', { infer: true }), config.get('HOST', { infer: true }))
}

await bootstrap()
