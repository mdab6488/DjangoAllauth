# syntax=docker/dockerfile:1.4

# ===============
# Builder Stage
# ===============
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
RUN apk add --no-cache bash curl git && corepack enable

# Set environment variables for build stage
ENV NEXT_TELEMETRY_DISABLED=1
# Note: Not setting NODE_ENV to production for build stage to ensure devDependencies are installed

# Copy package files
COPY --link package.json package-lock.json* ./

# Install all dependencies including devDependencies
RUN npm install

# Copy application source
COPY . .

# Build the application with cache mount
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ===============
# Runner Stage
# ===============
FROM node:22-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000

# Install runtime dependencies and setup user
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p .next && chown nextjs:nodejs .next

# Copy required files from builder
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/ ./.next/standalone/
COPY --from=builder --chown=nextjs:nodejs /app/.next/static/ ./.next/static/
COPY --from=builder --chown=nextjs:nodejs /app/public/ ./public/

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start"]
