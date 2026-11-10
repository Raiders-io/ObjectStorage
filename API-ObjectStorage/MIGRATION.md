# AdonisJS → NestJS migration notes

## Mapping

| AdonisJS                                       | NestJS                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `start/routes.ts`, controllers                 | `@Controller` classes in `src/*/`                          |
| `verify_token_middleware`                      | `VerifyTokenGuard` + `@UserId()`                           |
| VineJS validators (files, search)              | multer limits/filter (`objects/upload.ts`) + class-validator DTO |
| VineJS event validators                        | zod schemas (`events/event.schemas.ts`)                    |
| Lucid models / migrations                      | TypeORM entities / migrations                              |
| `@adonisjs/drive`                              | `StorageService` (S3 driver, fs driver)                    |
| `cleanup_uploads_middleware`                   | not needed: multer `memoryStorage`, nothing written to /tmp |
| `message_broker_provider/service`              | `EventsPublisher` / `EventsConsumer`                       |
| `@julr/adonisjs-prometheus`                    | `@willsoto/nestjs-prometheus` + HTTP histogram             |
| `@adonisjs/shield`, `cors`                     | `helmet`, `enableCors`                                     |
| `entrypoint.mjs`, `startup.sh` (migrate+start) | TypeORM `migrationsRun: true`                              |
| `@adonisjs/session`, CSRF, encryption, hash    | dropped (unused by this API; `APP_KEY` no longer needed)   |

## Behaviour kept

Routes, status codes (POST upload/search stay 200, DELETE one → 204), response shapes
(`{ objects: [{key, message|error}] }`, snake_case rows, Lucid-like `meta` pagination),
5 MB / 10 files / `txt,pdf,md,tex` limits, quota semantics, broker streams and event payloads.

## Behaviour changed (on purpose)

- Failed upload now refunds the quota consumed by `tryToUpload`.
- `PATCH` visibility: event published only if a row was updated; unknown file → 400 `Object not found`
  (old code compared error *values* with enum *keys*, so every error became `IndexError`).
- `GET/DELETE /all` return `ok` even when the user has 0 objects (old code treated `0` rows as an error).
- Errors that were `Error` objects serialised as `{}` now return `{ key, error: "<message>" }`.
- `lesson.file.attached` for a missing file is logged and acked instead of redelivered forever.
- Plain-string errors (e.g. "File already exists…") use Nest's default `{ statusCode, message, error }` shape.
- `created_at` / `updated_at` have DB defaults (`now()`), backfilled for existing rows.
- DTO validation errors are `422 { message: [...] }`; upload validation errors keep `422 { errors: [...] }`.
- `meta` pagination no longer includes the `*PageUrl` fields.

## Existing databases

Nothing to do: the migration is idempotent. TypeORM keeps its own `migrations` table;
Lucid's `adonis_schema` table can be dropped.

## Verified

`npm run lint`, `typecheck`, `build` pass. Smoke-tested against real PostgreSQL 16 + Redis 7 with the `fs`
disk: upload / duplicate / bad extension, list, quota, download / preview, visibility, public access from
another user, search, update / bulk update, delete / bulk delete, `/all`, metrics, and consumption of
`lesson.file.attached` and `auth.user.deleted`.
**Not tested**: the S3/Garage driver (standard SDK calls, but run it once against Garage) and the Docker image.
