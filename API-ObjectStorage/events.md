# Events for the message broker service

Events followed :

- `auth.user.deleted`

Events created :

- `object.file.created`
- `object.file.updated`
- `object.file.deleted`
- `object.file.visibility.updated`
- `object.user.data`

## `object.file.created`

Published when a file is created by a user.

payload :

```json
{
  file: file-id,
  userId: user-id,
}
```

## `object.file.updated`

Published when a file is updated by a user.

payload :

```json
{
  file: file-id,
  userId: user-id,
}
```

## `object.file.deleted`

Published when a file is deleted by a user.

payload :

```json
{
  file: file-id,
  userId: user-id,
}
```

## `object.file.visibility.updated`

Published when the visibility of a file is edited by a user.

payload :

```json
{
  file: file-id,
  userId: user-id,
  visibility: new-visiblity,
}
```

## `object.user.data`

Published when an action is performed on all data from a user.

payload :

```json
{
  userId: user-id,
  state: requested | deleted,
}
```
