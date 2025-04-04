
# # ===============
# # Base stage
# # ===============
FROM node:23-alpine AS base

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV FRONTEND_PORT=${FRONTEND_PORT}

# # # ===============
# # # Development stage
# # # ===============
FROM base AS development

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git

# Install development tools
RUN npm install -g npm@latest

# Create a non-root user and set permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app

# Copy package files first (for better layer caching)
COPY --chown=nextjs:nodejs package.json package-lock.json ./

# Switch to non-root user for npm operations
USER nextjs

# Install dependencies with cache mounted to a volume
# This uses npm ci for consistent installs but in development mode
RUN npm ci --include=dev

# Copy application code (will be overridden with volumes in dev)
COPY --chown=nextjs:nodejs . .

# Expose dynamic port
EXPOSE ${FRONTEND_PORT}

# Add simple health check for the dev server
HEALTHCHECK --interval=10s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${FRONTEND_PORT} || exit 1

# Start development server with hot reloading
CMD ["npm", "run", "dev:all"]

# Optional production stage if needed
# FROM base AS production
# Add production-specific steps if required