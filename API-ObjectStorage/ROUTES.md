# Routes

See the project [BrunObjectStorage](https://github.com/Raiders-io/BrunObjectStorage) for testing the API using already prepared requests.

Rules :

- `/quota` : prefix for manipulating the user quota
- `/storage` : prefix for all API routes
- `/objects` : prefix for manipulating objects


## Rules 

 * Only authenticated users can access these routes.
 * All routes needs to starts with `/api/v1/storage`
* It may be followed by `/objects` or `/users` or `/quota` or `/all` (GRPD compliant)

### Starts with `/objects`

 * Create: `POST   /`
 * Read:   `GET    /`
 * Read:   `GET    /:id`
 * Read:   `GET    /preview/:id`
 * Update: `PUT    /:id`
 * Update: `PUT    /` (bulk update)
 * Delete: `DELETE /:id`
 * Delete: `DELETE /` (bulk delete)
 * Patch:  `PATCH  /:id` (update partially)

### Starts with `/users`

 * Read:   `GET    /:userid/objects/`
 * Read:   `GET    /:userid/objects/:id`

### Starts with `/quota`

 * Read:   `GET    /`

### Starts with `/all` (GRPD compliant)

 * Read:   `GET    /`
 * Delete: `Delete /`

## Documentation

> It may not be updated to the latest update. Don't hesitate to make an issue if something is not working as described.

## Other Routes:

See the project [BrunAuth](https://github.com/Raiders-io/BrunAuth) for testing the Auth API using already prepared requests.
