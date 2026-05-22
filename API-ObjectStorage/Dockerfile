FROM node:24.16.0-bookworm-slim AS base

# ----------------------------
# Stage 1: Install all dependencies
# ----------------------------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ----------------------------
# Stage 2: Development runtime
# ----------------------------
FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development

COPY ./startup.sh /
RUN chmod +x /startup.sh

COPY . .

EXPOSE 3333

CMD ["bash", "/startup.sh"]
