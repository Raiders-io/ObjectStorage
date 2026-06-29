/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

// TODO: example route needs to be deleted
router.get('/', () => {
  return { hello: 'world' }
})

/**
 * Storage service routes
 * Starts with /api/v1/storage
 */

/**
 * Starts with /objects
 * CRUD : create, read, update, and delete
 * - Create: POST   /
 * - Read:   GET    /:id
 * - Update: PUT    /:id
 * - Update: PUT    / (bulk update)
 * - Delete: DELETE /:id
 * - Delete: DELETE / (bulk delete)
 * - Patch:  PATCH  /:id (update partially)
 * Only authenticated users can access these routes, but for now we will leave them open for testing purposes.
 */

/**
 * Starts with /users
 * - Read:   GET    /:userid/objects/
 * - Read:   GET    /:userid/objects/:id
 */
router
  .group(() => {
    router
      .group(() => {
        // Basics routes for objects
        router
          .group(() => {
            router.get('/', [controllers.AccessObjects, 'index']).as('listObjects')
            router.post('/', [controllers.AccessObjects, 'store']).as('createObject')
            router.put('/', [controllers.AccessObjects, 'updateMany']).as('bulkUpdateObjects')
            router.delete('/', [controllers.AccessObjects, 'destroyMany']).as('bulkDeleteObjects')
            router.get('/:id', [controllers.AccessObjects, 'show']).as('getObject')
            router.put('/:id', [controllers.AccessObjects, 'update']).as('updateObject')
            router.delete('/:id', [controllers.AccessObjects, 'destroy']).as('deleteObject')
            router.patch('/:id', [controllers.AccessObjects, 'updateInfo']).as('updateObjectInfo')
          })
          .prefix('/objects')
          .as('objects')

        // Special routes for Accessing objects from other users
        router
          .group(() => {
            router
              .get('/:userid/objects/', [controllers.AccessObjects, 'indexFrom'])
              .as('listObjectFrom')
            router
              .get('/:userid/objects/:id', [controllers.AccessObjects, 'showFrom'])
              .as('getObjectFrom')
          })
          .prefix('/users')
          .as('users')
      })
      .use(middleware.verifyToken())
      .use(middleware.cleanupUploads())

    // Quota routes
    // - Retrieve quota: GET /quota
    router
      .group(() => {
        router.get('/', [controllers.Quotas, 'index']).as('retrieveQuota')
      })
      .use(middleware.verifyToken())
      .prefix('/quota')
      .as('quota')
  })
  .prefix('/api/v1/storage')
  .as('storage')
