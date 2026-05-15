# ObjectStorage

## Routes

See the [ROUTES.md](ROUTES.md) file for documentation.

## Database configuration

- SQLite writes to `tmp/db.sqlite3` by default
- Override the file path with `DB_SQLITE_FILENAME=/your/path/to/db.sqlite3`
- If you move the database file outside `tmp/`, make sure the process has write access
