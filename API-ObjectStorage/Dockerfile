FROM node:24.16.0-bookworm-slim AS base

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

# ----------------------------
# Stage : Production runtime
# ----------------------------
FROM base AS production
ENV NODE_ENV=production

COPY ./startup.sh /
RUN chmod +x /startup.sh

COPY --from=build /app/build ./
COPY package*.json ./
RUN npm ci --omit=dev

ENTRYPOINT ["/startup.sh"]
CMD ["npm", "run", "prod"]
