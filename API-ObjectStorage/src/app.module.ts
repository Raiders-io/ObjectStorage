import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller.js'
import { AuthModule } from './auth/auth.module.js'
import { type Env, validateEnv } from './config/env.js'
import { DataAccessModule } from './data-access/data-access.module.js'
import { Quota } from './database/entities/quota.entity.js'
import { StorageObject } from './database/entities/storage-object.entity.js'
import { CreateStorageObjectsTable1780992799066 } from './database/migrations/1780992799066-create-storage-objects-table.js'
import { CreateUserQuotasTable1780995459776 } from './database/migrations/1780995459776-create-user-quotas-table.js'
import { EventsConsumerModule } from './events/events-consumer.module.js'
import { EventsModule } from './events/events.module.js'
import { MetricsModule } from './metrics/metrics.module.js'
import { ObjectsModule } from './objects/objects.module.js'
import { QuotaModule } from './quota/quota.module.js'
import { StorageModule } from './storage/storage.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres' as const,
        host: config.get('POSTGRES_SERVICE_NAME', { infer: true }),
        port: config.get('POSTGRES_PORT', { infer: true }),
        username: config.get('POSTGRES_USER', { infer: true }),
        password: config.get('POSTGRES_PASSWORD', { infer: true }),
        database: config.get('POSTGRES_DB', { infer: true }),
        entities: [StorageObject, Quota],
        migrations: [CreateStorageObjectsTable1780992799066, CreateUserQuotasTable1780995459776],
        migrationsRun: true, // replaces `node ace migration:run --force` at container start
        synchronize: false,
        logging: ['error', 'warn'],
      }),
    }),
    AuthModule,
    StorageModule,
    EventsModule,
    QuotaModule,
    ObjectsModule,
    DataAccessModule,
    EventsConsumerModule,
    MetricsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
