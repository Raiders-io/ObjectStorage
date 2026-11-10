import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum StorageObjectVisibility {
  public = 'public',
  private = 'private',
  shared = 'shared',
}

export enum StorageObjectUploadStatus {
  not_started = 'not_started',
  uploading = 'uploading',
  complete = 'complete',
  failed = 'failed',
}

@Entity('storage_objects')
export class StorageObject {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  key!: string

  @Column({ type: 'varchar', length: 255 })
  bucket!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  /** bigint columns are returned as strings by node-postgres. */
  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 255 })
  mimeType!: string

  @Column({ type: 'varchar', length: 255, default: StorageObjectVisibility.private })
  visibility!: StorageObjectVisibility

  @Column({ type: 'varchar', length: 255, default: StorageObjectUploadStatus.not_started })
  status!: StorageObjectUploadStatus

  @Column({ name: 'is_verified', type: 'boolean', nullable: true, default: true })
  isVerified!: boolean | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
