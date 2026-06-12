# API-ObjectStorage

See the [README.md in API-ObjectStorage/](API-ObjectStorage/README.md).

## Routes

See the [ROUTES.md](ROUTES.md) file for documentation.

## Database configuration

- Postgresql with multiple tables defined in `API-ObjectStorage/database/migrations/*`
	- a Table for Storage Objects, it stores metadata for objects that are stored in Garage.
	- a Table for User Quotas, it stores actions on files by users

### Old Database configuration

- SQLite writes to `tmp/db.sqlite3` by default
- Override the file path with `DB_SQLITE_FILENAME=/your/path/to/db.sqlite3`
- If you move the database file outside `tmp/`, make sure the process has write access
