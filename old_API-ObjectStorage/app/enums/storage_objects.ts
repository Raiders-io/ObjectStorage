export enum StorageObjectVisibility {
  public = 'public',
  private = 'private',
  shared = 'shared', //table for shared objects with other users (not implemented yet)
}

export enum StorageObjectUploadStatus {
  not_started = 'not_started',
  uploading = 'uploading',
  complete = 'complete',
  failed = 'failed',
}
