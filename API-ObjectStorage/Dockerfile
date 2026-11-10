FROM node:24.16.0-alpine3.24 AS base

WORKDIR /app

# ----------------------------
# Stage : Install all dependencies
# ----------------------------
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ----------------------------
# Stage : Development runtime
# ----------------------------
FROM deps AS dev
ENV NODE_ENV=development

COPY . .

# Migrations are run by the app itself at boot (TypeORM `migrationsRun`)
CMD ["npm", "run", "start:dev"]

# ----------------------------
# Stage : Build the application
# ----------------------------
FROM deps AS build

COPY . .
RUN npm run build
# Remove dev dependencies after build to reduce image size
RUN npm ci --omit=dev

# ----------------------------
# Stage : Production runtime
# ----------------------------
FROM dhi.io/node:24-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# package.json is required at runtime: it carries "type": "module"
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

ENTRYPOINT ["node", "dist/main.js"]
