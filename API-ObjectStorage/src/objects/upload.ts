import { UnprocessableEntityException } from '@nestjs/common'
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js'
import { memoryStorage } from 'multer'
import { extname } from 'node:path'

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_FILES = 10
export const ALLOWED_EXTNAMES = ['txt', 'pdf', 'md', 'tex']

/** Equivalent of the former VineJS `vine.file({ size: '5mb', extnames })` + `maxLength(10)`. */
export const uploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES, fieldSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).slice(1).toLowerCase()
    if (!ALLOWED_EXTNAMES.includes(ext)) {
      return cb(
        new UnprocessableEntityException({
          errors: [
            {
              field: file.fieldname,
              message: `Invalid file extension ${ext}. Only ${ALLOWED_EXTNAMES.join(', ')} are allowed`,
            },
          ],
        }),
        false
      )
    }
    cb(null, true)
  },
}

/** Accepts both `files` and `files[]` as multipart field names. */
export function pickFiles(files: Express.Multer.File[] | undefined): Express.Multer.File[] {
  return (files ?? []).filter((f) => f.fieldname === 'files' || f.fieldname === 'files[]')
}

export function pickFile(files: Express.Multer.File[] | undefined): Express.Multer.File | undefined {
  return (files ?? []).find((f) => f.fieldname === 'file')
}
