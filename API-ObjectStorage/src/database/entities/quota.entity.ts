import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('user_quotas')
export class Quota {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string

  @Column({ name: 'storage_bytes', type: 'bigint', default: 0 })
  storageBytes!: string

  @Column({ name: 'storage_bytes_limit', type: 'bigint', default: 1073741824 })
  storageBytesLimit!: string

  @Column({ name: 'object_count', type: 'bigint', default: 0 })
  objectCount!: string

  @Column({ name: 'object_count_limit', type: 'bigint', default: 1000 })
  objectCountLimit!: string

  @Column({ name: 'download_count', type: 'bigint', default: 0 })
  downloadCount!: string

  @Column({ name: 'download_count_limit', type: 'bigint', default: 1000 })
  downloadCountLimit!: string

  @Column({ name: 'download_count_reset_at', type: 'timestamptz', nullable: true })
  downloadCountResetAt!: Date | null

  @Column({ name: 'upload_count', type: 'bigint', default: 0 })
  uploadCount!: string

  @Column({ name: 'upload_count_limit', type: 'bigint', default: 1000 })
  uploadCountLimit!: string

  @Column({ name: 'upload_count_reset_at', type: 'timestamptz', nullable: true })
  uploadCountResetAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
