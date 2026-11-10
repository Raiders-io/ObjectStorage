# API-ObjectStorage (NestJS)

See the Architecture of project in [arch.md](../Arch/arch.md)

Stack:

- **NestJS 12** (Express, ESM)
- **TypeORM** + PostgreSQL
- **zod** (env + events)
- **class-validator** (DTOs)
- **multer** (uploads)
- **@aws-sdk/client-s3** (Garage/S3)
- **@yosone/broker** (Redis Streams)
- **@willsoto/nestjs-prometheus**

## Features

- API for manipulating safely an object storage solution like S3
  - upload/download files
  - access list (private or public)
  - quota implementation to limit users activity (too much uploads, quantity of files or storage use)

## Development

```sh
cp .env.example .env   # or use ../setup_env.sh
npm ci
npm run start:dev      # watch mode
npm run lint && npm run typecheck && npm run build
```

Migrations run automatically at boot (`migrationsRun: true`).

## Layout

```tree
src/
  main.ts                 bootstrap (helmet, CORS, body limits, pipes, filters)
  app.module.ts           wiring + TypeORM config + migrations list
  config/env.ts           zod-validated environment
  auth/                   VerifyTokenGuard (calls the auth service)
  storage/                S3 / local-fs drivers behind StorageService
  quota/                  QuotaService (atomic conditional UPDATEs) + GET /quota
  objects/                CRUD, download, search, visibility, public access to other users
  data-access/            GDPR export / erase (/all)
  events/                 broker publisher + consumer, zod event schemas
  metrics/                Prometheus (/private/object/metrics)
  database/               entities + migrations
```

## Routes

See [ROUTES.md](ROUTES.md). Paths are unchanged (`/api/v1/storage/...`).

## Database configuration

Database Schema : [database.md](../Arch/database.md). The first migration uses
`CREATE TABLE IF NOT EXISTS`, so a database previously migrated by the AdonisJS version is reused as is.

## Quota

Quota implementation : [quotas.md](../Arch/quotas.md)
