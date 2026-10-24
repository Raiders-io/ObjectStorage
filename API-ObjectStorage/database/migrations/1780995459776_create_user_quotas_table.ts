import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_quotas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
  
      table.uuid('user_id').notNullable().unique()
      table.bigInteger('storage_bytes').unsigned().notNullable().defaultTo(0)
      table.bigInteger('storage_bytes_limit').unsigned().notNullable().defaultTo(1073741824) // 1 GB //TODO : Make this configurable per user
      table.bigInteger('object_count').unsigned().notNullable().defaultTo(0)
      table.bigInteger('object_count_limit').unsigned().notNullable().defaultTo(1000) //TODO : Make this configurable per user

      table.bigInteger('download_count').unsigned().notNullable().defaultTo(0)
      table.bigInteger('download_count_limit').unsigned().notNullable().defaultTo(1000) //TODO : Make this configurable per user
      table.timestamp('download_count_reset_at') //timestamp for when the daily download count will be reset to 0

      table.bigInteger('upload_count').unsigned().notNullable().defaultTo(0)
      table.bigInteger('upload_count_limit').unsigned().notNullable().defaultTo(1000) //TODO : Make this configurable per user
      table.timestamp('upload_count_reset_at') //timestamp for when the daily upload count will be reset to 0

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.check('storage_bytes >= 0 AND object_count >= 0', [], 'user_quotas_usage_non_negative')
      table.check('download_count >= 0 AND upload_count >= 0', [], 'user_quotas_counts_non_negative')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
