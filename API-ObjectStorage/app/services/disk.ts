import drive from '@adonisjs/drive/services/main'
import env from '#start/env'

export const diskName = env.get('DRIVE_DISK') || 's3'
export const disk = drive.use(diskName)

export function calculatePrefix(userId: string, filename?: string): string {
  if (typeof filename === 'undefined') {
    return `files/${userId}/`
  } else {
    return `files/${userId}/${filename}`
  }
}
