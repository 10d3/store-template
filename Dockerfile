# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    curl \
    libc6-compat

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb ./

# Install dependencies with cache mount for better performance
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Builder stage  
FROM base AS builder
WORKDIR /app

# Copy package.json and installed dependencies
COPY package.json bun.lockb ./
COPY --from=deps /app/node_modules ./node_modules

# Copy prisma schema BEFORE generating client
COPY prisma ./prisma/

# Set Prisma environment variables for Alpine
ENV PRISMA_SCHEMA_ENGINE_TYPE=binary
ENV PRISMA_QUERY_ENGINE_TYPE=binary

# Generate Prisma client with cache mount
RUN --mount=type=cache,id=prisma,target=/root/.cache/prisma \
    bun prisma generate

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with specific IDs for better security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy generated Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# If you have custom Prisma client location, uncomment:
# COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

# Switch to non-root user
USER nextjs

# Add healthcheck with more realistic timing
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Start the application using Bun
CMD ["bun", "server.js"]