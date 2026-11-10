/**
 * Types to use when using quota
 * */
export enum QuotaError {
  // No remaining quota messages
  NoUpdateRemaining = 'You have no remaining updates, please wait for the next reset',
  NoUploadRemaining = 'You have no remaining uploads, please wait for the next reset',
  NoDownloadRemaining = 'You have no remaining downloads, please wait for the next reset',
  QuotaNotFound = 'Quota not found for user',

  // Failure messages
  QuotaResetFailed = 'Failed to reset quota, please try again later',
  QuotaUpdateFailed = 'Failed to update quota, please try again later',
  QuotaUploadFailed = 'Failed to upload file, please try again later',
  QuotaDownloadFailed = 'Failed to download file, please try again later',
  QuotaDeleteFailed = 'Failed to delete file, please try again later',
}
