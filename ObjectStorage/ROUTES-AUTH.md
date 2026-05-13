# Routes-Auth

Rules:

- `/api/v1` : prefix for all API routes
- `/auth` : prefix for authentication related routes (signup, login)
- `/account` : prefix for account related routes (profile, logout) with auth middleware

Routes:

- POST `/api/v1/auth/signup` : user registration
- POST `/api/v1/auth/login` : user login
- GET `/api/v1/account/profile` : fetching user profile (requires authentication)
- POST `/api/v1/account/logout` : logging out the user (requires authentication)

## GET /

`GET /`

Expected output:

```json
{ hello: 'world' }
```

### POST `/api/v1/auth/signup`

`POST /api/v1/auth/signup`

Expected input:

```json
{
  "fullName": "test",
  "email": "test@test.test",
  "password": "password",
  "passwordConfirmation": "password"
}
```

Expected output:

```json
{
  "fullName": "test",
  "email": "test@test.test",
  "password": "password",
  "passwordConfirmation": "password"
}
```

## POST `/api/v1/auth/login`

`POST /api/v1/auth/login`

Expected Body input:

```json
{
  "fullName": "test",
  "email": "test@test.test",
  "password": "password",
  "passwordConfirmation": "password"
}
```

Expected output:

```json
{
  "data": {
    "token": "[token]",
    "user": {
      "id": 1,
      "fullName": "test",
      "email": "test@test.test",
      "createdAt": "2026-05-09T16:10:35.000+00:00",
      "updatedAt": "2026-05-09T16:10:35.000+00:00",
      "initials": "TE"
    }
  }
}
```

## POST `/api/v1/account/logout`

`POST /api/v1/account/logout`

Expected Header input:

```HTML
Authorization: Bearer [token]
```

Expected output:

```json
{
  "message": "Logged out successfully"
}
```

Possible error:

```json
{
  "errors": [
    {
      "message": "Unauthorized access"
    }
  ]
}
```

## GET `/api/v1/account/profile`

`GET /api/v1/account/profile`

Expected Header input:

```HTML
Authorization: Bearer [token]
```

Expected output:

```json
{
  "data": {
    "id": 1,
    "fullName": "test",
    "email": "test@test.test",
    "createdAt": "2026-05-09T16:10:35.000+00:00",
    "updatedAt": "2026-05-09T16:10:35.000+00:00",
    "initials": "TE"
  }
}
```

## Possible errors

```json
{
  "errors": [
    {
      "message": "Unauthorized access"
    }
  ]
}
```
