/**
 * Types to use when forming a single response for multiple file uploads/updates/deletions,
 * to provide feedback on which files were successfully processed
 * and which ones failed with the corresponding error message
 * */
export type ObjectError = {
  key: string // S3 path of the object
  error: ObjectResponseTypeError | string
}

export type ObjectSuccess = {
  key: string // S3 path of the object
  message: ObjectResponseTypeSuccess
}

export enum ObjectResponseTypeError {
  // Error messages
  FailedToSaveFile = 'Failed to save file',
  NoFileProvided = 'Please upload a file',
  NoFileID = 'Please provide a file id',
  NotFound = 'Object not found',
  FileNameMismatch = 'File name does not match the provided file id',

  // Routes messages Error
  IndexError = 'Failed to fetch objects',
  UploadError = 'Failed to upload file',
  UploadAlreadyExists = 'File already exists, use update if you want to replace it',
  UpdateError = 'Failed to update file',
  DeleteError = 'Failed to delete file',
}

// Routes messages Success
export enum ObjectResponseTypeSuccess {
  IndexSuccess = 'Objects fetched successfully',
  DeleteSuccess = 'File deleted successfully',
  UploadSuccess = 'File uploaded successfully',
  UpdateSuccess = 'File updated successfully',
}

/**
 * Class to handle the response for multiple file uploads/updates/deletions,
 * to provide feedback on which files were successfully processed
 * and which ones failed with the corresponding error message
 */
export class ObjectResponseType {
  objects: (ObjectError | ObjectSuccess)[] = []

  public get() {
    return this.objects
  }

  public addError({ key, error }: ObjectError) {
    this.objects.push({ key, error })
    return this.objects
  }

  public addSuccess({ key, message }: ObjectSuccess) {
    this.objects.push({ key, message })
    return this.objects
  }

  public get length() {
    return this.objects.length
  }
}
