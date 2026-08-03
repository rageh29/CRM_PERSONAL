# ═══════════════════════════════════════════════════
# Production Dockerfile for Dokploy / Hostinger VPS
# Next.js Standalone + PostgreSQL Automatic Migration
# ═══════════════════════════════════════════════════

# 1. Base Image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# 2. Dependencies Stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build time
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Automatically switch Prisma provider to PostgreSQL for Docker production build
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma

# Generate Prisma Client for PostgreSQL & Build Standalone Next.js
RUN npx prisma generate
RUN npm run build

# 4. Production Runner Stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build & static files
COPY --from=builder /app/public ./public
COPY --from=builder /app/public ./.next/standalone/public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/static ./.next/standalone/.next/static

# Copy Prisma schema & seed files for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

# Expose Port 3000
EXPOSE 3000

# Entrypoint script runs prisma db push & seed automatically then starts server
ENTRYPOINT ["./docker-entrypoint.sh"]
