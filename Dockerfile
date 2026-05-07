# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache \
    openssl \
    curl \
    libc6-compat
# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# No cache mount + ignore scripts = no poisoned cache possible
RUN pnpm install --frozen-lockfile --ignore-scripts

# Builder stage
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma/
ENV PRISMA_SCHEMA_ENGINE_TYPE=binary
ENV PRISMA_QUERY_ENGINE_TYPE=binary
# Explicitly run only trusted scripts
RUN npx prisma generate --generator client
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated/prisma ./lib/generated/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
USER nextjs
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1
EXPOSE 3000
CMD ["node", "server.js"]
