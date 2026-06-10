import { BaseSchema } from '@adonisjs/lucid/schema'
import env from '#start/env'
import { StorageObjectUploadStatus, StorageObjectVisibility } from '#enums/storage_objects'

export default class extends BaseSchema {
  protected tableName = 'storage_objects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('owner_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('key').notNullable().unique()
      table.string('bucket').notNullable().defaultTo(env.get('S3_BUCKET'))
      table.string('name').notNullable()
      table.bigInteger('size_bytes').unsigned().notNullable() //up to 9 223 372 036 854 775 807 Bytes
      table.string('mime_type').notNullable()
      table
        .enum('visibility', Object.values(StorageObjectVisibility))
        .notNullable()
        .defaultTo(StorageObjectVisibility.private)
      table
        .enum('status', Object.values(StorageObjectUploadStatus))
        .notNullable()
        .defaultTo(StorageObjectUploadStatus.not_started)
      table.boolean('is_verified').defaultTo(true) //TODO : implement a real file validation process to set this field to true for valid files
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
