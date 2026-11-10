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

COPY ./startup.sh /
RUN chmod +x /startup.sh

COPY . .

ENTRYPOINT ["/startup.sh"]
CMD ["npm", "run", "dev"]

# ----------------------------
# Stage : Build the application
# ----------------------------
FROM deps AS build

COPY . .
RUN node ace build
# Remove dev dependencies after build to reduce image size
COPY package*.json ./
RUN npm ci --omit=dev

# ----------------------------
# Stage : Production runtime
# ----------------------------
FROM dhi.io/node:24-alpine AS production
ENV NODE_ENV=production

COPY --from=build /app/build ./
COPY --from=build /app/node_modules ./node_modules
COPY entrypoint.mjs ./

ENTRYPOINT ["node", "entrypoint.mjs"]
