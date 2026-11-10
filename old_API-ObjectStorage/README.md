# API-ObjectStorage

See the Architecture of project in [arch.md](../Arch/arch.md)

## Features

- API for manipulating safely an object storage solution like S3
  - upload/download files
  - access list (private or public)
  - quota implementation to limit users activity (too much uploads, quantity of files or storage use)

## Routes

See the [ROUTES.md](ROUTES.md) file for documentation.

## Database configuration

Database Schema : [database.md](../Arch/database.md)

- Postgresql with multiple tables defined in `API-ObjectStorage/database/migrations/*`
  - a Table for Storage Objects, it stores metadata for objects that are stored in Garage.
  - a Table for User Quotas, it stores actions on files by users

### Old Database configuration

- SQLite writes to `tmp/db.sqlite3` by default
- Override the file path with `DB_SQLITE_FILENAME=/your/path/to/db.sqlite3`
- If you move the database file outside `tmp/`, make sure the process has write access

## Quota

Quota implementation : [quotas.md](../Arch/quotas.md)
