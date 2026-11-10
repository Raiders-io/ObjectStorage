#!/bin/sh

set -e

#Initialize the database with the required tables and schema (--force needed with NODE_ENV=production)
npm run migration-force

exec "$@"
