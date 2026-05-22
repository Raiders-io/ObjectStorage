import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'
import app  from '@adonisjs/core/services/app'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: { 
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY'),
      },
      region: env.get('AWS_REGION'),
      bucket: env.get('S3_BUCKET'),
      visibility: 'public',
      endpoint: env.get('S3_ENDPOINT'),      // http://localhost:3900
      forcePathStyle: true,                   // obligatoire avec Garage
    }),

    fs: services.fs({
      /**
       * The directory where files are stored. Use app.makePath
       * to create an absolute path from your application root.
       */
      location: app.makePath('storage'),

      /**
       * When true, Drive registers a route to serve files
       * from the local filesystem via your AdonisJS server.
       */
      serveFiles: true,

      /**
       * The URL path prefix for serving files. A file stored
       * as "avatars/1.jpg" becomes accessible at "/uploads/avatars/1.jpg".
       */
      routeBasePath: '/uploads',

      /**
       * The default visibility for files. Public files are
       * accessible via URL. Private files require signed URLs.
       */
      visibility: 'public',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
