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

// router.post('/profile/avatar', [controllers.ProfileAvatars, 'update']).as('updateProfileAvatar').use(middleware.auth()).use(middleware.cleanupUploads()) // Add the cleanup middleware to this route

// Storage service routes
// CRUD : create, read, update, and delete
// - Create: POST /storage/objects
// - Read: GET /storage/objects/:id
// - Update: PUT /storage/objects/:id
// - Update: PUT /storage/objects/ (bulk update)
// - Delete: DELETE /storage/objects/:id
// - Delete: DELETE /storage/objects/ (bulk delete)
// Only authenticated users can access these routes, but for now we will leave them open for testing purposes.
router.group(() => {
  router.group(() => {
    router.get('/', [controllers.AccessObjects, 'index'])
    .as('listObjects')

    router.post('/', [controllers.AccessObjects, 'store'])
    .as('createObject')

    router.put('/', [controllers.AccessObjects, 'updateMany'])
    .as('bulkUpdateObjects')

    router.delete('/', [controllers.AccessObjects, 'destroyMany'])
    .as('bulkDeleteObjects')

    router.get('/:id', [controllers.AccessObjects, 'show'])
    .as('getObject')

    router.put('/:id', [controllers.AccessObjects, 'update'])
    .as('updateObject')

    router.delete('/:id', [controllers.AccessObjects, 'destroy'])
    .as('deleteObject')
  })
  .prefix('/objects')
  .as('objects')
  .use(middleware.auth())
  .use(middleware.cleanupUploads())
})
.prefix('/storage')
.as('storage')

// TODO: Auth routes are handled by another service
router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')
      .use(middleware.guest())

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
