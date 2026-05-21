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

// router.on('/profile').render('pages/profile').as('profile')
router.post('/profile/avatar', [controllers.ProfileAvatars, 'update']).as('updateProfileAvatar').use(middleware.auth()).use(middleware.cleanupUploads()) // Add the cleanup middleware to this route

// Storage service routes
// CRUD : create, read, update, and delete
// - Create: POST /storage/objects
// - Read: GET /storage/objects/:id
// - Update: PUT /storage/objects/:id
// - Delete: DELETE /storage/objects/:id
// Only authenticated users can access these routes, but for now we will leave them open for testing purposes.
router.group(() => {
  router.group(() => {
    router.get('/', [controllers.AccessObjects, 'index'])
    .as('listObjects')

    router.post('/', [controllers.AccessObjects, 'store'])
    .as('createObject')

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
})
.prefix('/storage')
.as('storage')

// Resources : register automatically the CRUD routes for a resource controller (index, create, store, show, edit, update, destroy)
// apiOnly : register only the API routes (index, store, show, update, destroy)
// router.resource('access-objects', 'AccessObjectsController').as('storage').apiOnly().middleware('*', middleware.auth())

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
