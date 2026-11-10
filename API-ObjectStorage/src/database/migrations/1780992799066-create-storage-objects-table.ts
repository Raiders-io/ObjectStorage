import type { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Same schema as the former Lucid migration. `IF NOT EXISTS` makes it a no-op on databases
 * that were already migrated by the AdonisJS version of the service.
 */
export class CreateStorageObjectsTable1780992799066 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS storage_objects (
        id SERIAL PRIMARY KEY,
        owner_id uuid NOT NULL,
        key varchar(255) NOT NULL UNIQUE,
        bucket varchar(255) NOT NULL DEFAULT '',
        name varchar(255) NOT NULL,
        size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
        mime_type varchar(255) NOT NULL,
        visibility varchar(255) NOT NULL DEFAULT 'private'
          CHECK (visibility IN ('public', 'private', 'shared')),
        status varchar(255) NOT NULL DEFAULT 'not_started'
          CHECK (status IN ('not_started', 'uploading', 'complete', 'failed')),
        is_verified boolean DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    // Tables created by the Lucid migration have no default: Lucid filled them in application code.
    await q.query(`
      UPDATE storage_objects SET created_at = now() WHERE created_at IS NULL;
      UPDATE storage_objects SET updated_at = now() WHERE updated_at IS NULL;
      ALTER TABLE storage_objects
        ALTER COLUMN created_at SET DEFAULT now(),
        ALTER COLUMN updated_at SET DEFAULT now(),
        ALTER COLUMN created_at SET NOT NULL,
        ALTER COLUMN updated_at SET NOT NULL
    `)
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS storage_objects')
  }
}
