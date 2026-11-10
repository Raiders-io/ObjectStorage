import type { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUserQuotasTable1780995459776 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS user_quotas (
        id SERIAL PRIMARY KEY,
        user_id uuid NOT NULL UNIQUE,
        storage_bytes bigint NOT NULL DEFAULT 0 CHECK (storage_bytes >= 0),
        storage_bytes_limit bigint NOT NULL DEFAULT 1073741824 CHECK (storage_bytes_limit >= 0),
        object_count bigint NOT NULL DEFAULT 0 CHECK (object_count >= 0),
        object_count_limit bigint NOT NULL DEFAULT 1000 CHECK (object_count_limit >= 0),
        download_count bigint NOT NULL DEFAULT 0 CHECK (download_count >= 0),
        download_count_limit bigint NOT NULL DEFAULT 1000 CHECK (download_count_limit >= 0),
        download_count_reset_at timestamptz,
        upload_count bigint NOT NULL DEFAULT 0 CHECK (upload_count >= 0),
        upload_count_limit bigint NOT NULL DEFAULT 1000 CHECK (upload_count_limit >= 0),
        upload_count_reset_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS user_quotas')
  }
}
