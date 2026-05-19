FROM node:26.1.0-bookworm-slim AS base

# ----------------------------
# Stage 1: Install all dependencies
# ----------------------------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ----------------------------
# Stage 2: Build the application
# ----------------------------
FROM deps AS build
WORKDIR /app
COPY . .
RUN node ace build

# ----------------------------
#	Bypass the clean install stage for development
# ----------------------------
FROM build AS dev
WORKDIR /app
ENV NODE_ENV=development

COPY --from=build /app/build ./
COPY ./startup.sh /

EXPOSE 3333

CMD ["bash", "/startup.sh"]
# CMD ["node", "bin/server.js"]

# ----------------------------
# Stage 3: Production runtime
# ----------------------------
# FROM base AS production
# WORKDIR /app
# ENV NODE_ENV=production

# COPY --from=build /app/build ./
# RUN npm ci --omit=dev

# EXPOSE 3333
# CMD ["node", "bin/server.js"]
# CMD ["./startup.sh"]
