# Multi-stage Dockerfile for Vagas Tracker (Next.js 16 + Prisma + SQLite)

# 1) Builder
FROM node:20-bullseye AS builder

# Install build deps required for native modules (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 pkg-config libsqlite3-dev ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install all deps (including dev deps so prisma CLI is available)
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources
COPY . .

# Generate Prisma client and build Next app
RUN npx prisma generate
RUN npm run build

# 2) Runner
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy runtime files from builder
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.mjs ./prisma.config.mjs
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Ensure runtime deps for sqlite are present
RUN apt-get update \
  && apt-get install -y --no-install-recommends libsqlite3-0 ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && chmod +x ./entrypoint.sh

EXPOSE 3001

# entrypoint will optionally run migrations (when MIGRATE=1)
CMD ["./entrypoint.sh"]
