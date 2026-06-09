import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { unlink } from 'node:fs/promises'

/**
 * Middleware to clean up uploaded files after the request is processed.
 * This ensures that temporary files created during file uploads are removed,
 * preventing storage bloat and potential security issues.
 * The middleware should be used after the body parser middleware that handles file uploads.
 * If the file is successfully processed and moved to a permanent location, it will not be deleted by this middleware.
 */
export default class CleanupUploadsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await next()
    } finally {
      // Get all uploaded files from the request
      const files = ctx.request.allFiles()
      // Loop through each file and delete the temporary file if it exists
      // we are using two loops as allFiles could return either a single file or an array of files for each field
      for (const fileOrFiles of Object.values(files)) {
        const list = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]
        for (const file of list) {
          if (file?.tmpPath) {
            // console.log(`Cleaning up uploaded file: ${file.tmpPath}`)
            await unlink(file.tmpPath).catch(() => {}) // Ignore errors during cleanup
          }
        }
      }
    }
  }
}
