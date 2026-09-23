# Events for the message broker service

Events followed :

- `auth.user.deleted`
- `lesson.file.attached`

Events created :

- `object.started`
- `object.file.created`
- `object.file.updated`
- `object.file.deleted`
- `object.file.visibility.updated`
- `object.user.data`

For more informations, you can look directly for the Zod Schema implementation in `app/class/events.ts`.

## `object.started`

Published when the service started.

payload :

```json
{
  message: string,
}
```

## `object.file.created`

Published when a file is created by a user.

payload :

```json
{
  filename: string,
  userId: uuid,
}
```

## `object.file.updated`

Published when a file is updated by a user.

payload :

```json
{
  filename: string,
  userId: uuid,
}
```

## `object.file.deleted`

Published when a file is deleted by a user.

payload :

```json
{
  filename: string,
  userId: uuid,
}
```

## `object.file.visibility.updated`

Published when the visibility of a file is edited by a user.

payload :

```json
{
  filename: string,
  userId: uuid,
  visibility: 'public' | 'private' | 'shared',
}
```

## `object.user.data`

Published when an action is performed on all data from a user.

payload :

```json
{
  userId: user-id,
  state: 'requested' | 'deleted',
}
```
