export enum ObjectResponseTypeError {
  FailedToSaveFile = 'Failed to save file',
  NoFileProvided = 'Please upload a file',
  NoFileID = 'Please provide a file id',
  NotFound = 'Object not found',
  FileNameMismatch = 'File name does not match the provided file id',
  InvalidUserID = 'Invalid user id',
  NoUserID = 'Please provide a user id',
  IndexError = 'Failed to fetch objects',
  UploadError = 'Failed to upload file',
  UploadAlreadyExists = 'File already exists, use update if you want to replace it',
  UpdateError = 'Failed to update file',
  DeleteError = 'Failed to delete file',
  InvalidVisibilityState = 'Invalid visibility state, must be one of: private, public, shared',
  InvalidFilename = 'Invalid filename',
}

export enum ObjectResponseTypeSuccess {
  IndexSuccess = 'Objects fetched successfully',
  DeleteSuccess = 'File deleted successfully',
  UploadSuccess = 'File uploaded successfully',
  UpdateSuccess = 'File updated successfully',
  UpdateVisibilitySuccess = 'File visibility updated successfully',
}

export type ObjectError = { key: string; error: ObjectResponseTypeError | string }
export type ObjectSuccess = { key: string; message: ObjectResponseTypeSuccess }

export class ObjectResponseType {
  private readonly objects: (ObjectError | ObjectSuccess)[] = []

  get() {
    return this.objects
  }
  addError(e: ObjectError) {
    this.objects.push({ key: e.key, error: e.error })
  }
  addSuccess(s: ObjectSuccess) {
    this.objects.push({ key: s.key, message: s.message })
  }
  get length() {
    return this.objects.length
  }
}
