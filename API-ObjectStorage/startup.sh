#!/bin/sh

#Initialize the database with the required tables and schema
node ace migration:run 

if [ "$NODE_ENV" = "production" ]; then
  exec node bin/server.js
else
  exec npm run dev
fi
