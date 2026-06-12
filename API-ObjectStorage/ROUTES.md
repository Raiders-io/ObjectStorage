# Routes

See the project [BrunObjectStorage](https://github.com/Raiders-io/BrunObjectStorage) for testing the API using already prepared requests. Theses routes or the ones in `BrunObjectStorage` may have different versions or not be properly updated now.

Rules :

- `/storage` : prefix for all API routes
- `/objects` : prefix for manipulating objects

Other Routes:

See the [ROUTES-AUTH.md](ROUTES-AUTH.md) file for documentation.

## GET /

`GET /storage/objects`

Expected output:

```json
{
  "objects": []
}
```

### POST `/storage/objects`

`POST /storage/objects`

Expected input:

```json
{
  [...] WIP
}
```

Expected output:

```json
{
  [...] WIP
}
```

### GET `/storage/objects/:id`

`GET /storage/objects/:id`

Expected input:

- `id` : filename or hashed filename

Expected output:

```json
{
  "object": {
    "id": "test",
    "name": "Example Object",
    "size": 1024
  }
}
```

### PUT `/storage/objects/:id`

`PUT /storage/objects/:id`

Expected input:

- `id` : filename or hashed filename

Expected output:

```json
{
  "message": "Object with id test updated successfully"
}
```

### DELETE `/storage/objects/:id`

`DELETE /storage/objects/:id`

Expected input:

- `id` : filename or hashed filename

Expected output:

```json
{
  "message": "Object with id test deleted successfully"
}
```
