#!/bin/sh

#Initialize the database with the required tables and schema (--force needed with NODE_ENV=production)
node ace migration:run --force

if [ "$NODE_ENV" = "production" ]; then
  exec node bin/server.js
else
  exec npm run dev
fi
