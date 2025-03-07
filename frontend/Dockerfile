# # syntax=docker/dockerfile:1.4

# # ===============
# # Builder Stage
# # ===============
# FROM node:22-alpine AS builder
# WORKDIR /app

# # Install dependencies
# RUN apk add --no-cache bash curl git && corepack enable

# # Set environment variables for build stage
# ENV NEXT_TELEMETRY_DISABLED=1
# ENV NODE_ENV=development

# # Copy package files
# COPY package.json package-lock.json* ./

# # Install dependencies 
# RUN npm install -g npm@latest \
#     && npm ci

# # Copy application source
# COPY . .

# # Build the application
# # RUN npm run build

# # ===============
# # Runner Stage
# # ===============
# FROM node:22-alpine AS runner
# WORKDIR /app

# # Set environment variables
# ENV NODE_ENV=development
# ENV NEXT_TELEMETRY_DISABLED=1
# ENV PORT=3000

# # Install runtime dependencies and setup user
# RUN apk add --no-cache curl && \
#     addgroup --system --gid 1001 nodejs && \
#     adduser --system --uid 1001 nextjs && \
#     mkdir -p .next && chown nextjs:nodejs .next

# # Copy required files from builder
# COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
# COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# # Switch to non-root user
# USER nextjs

# EXPOSE 3000

# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD curl -f http://localhost:3000 || exit 1

# # CMD ["node", "server.js"]

# # Start the development server
# CMD ["npm", "run", "dev"]

# syntax=docker/dockerfile:1.4

# # ===============
# # Base stage
# # ===============
# FROM node:22-alpine AS base
# WORKDIR /app
# ENV NODE_ENV=development
# ENV NEXT_TELEMETRY_DISABLED=1

# # # ===============
# # # Development stage
# # # ===============
# FROM base AS development
# RUN apk add --no-cache bash curl git

# # Create non-root user
# RUN addgroup -S nodejs -g 1001 && \
#     adduser -S nextjs -u 1001 -G nodejs

# # Set permissions
# RUN mkdir -p /app/.next && \
#     chown -R nextjs:nodejs /app

# # Switch to non-root user
# USER nextjs

# # Ensure npm is using the correct user
# RUN npm config set prefix ~/.npm && \
#     export PATH=~/.npm/bin:$PATH

# # Install dependencies
# COPY --chown=nextjs:nodejs package.json package-lock.json* ./

# RUN npm ci

# # Copy application code
# COPY --chown=nextjs:nodejs . .

# # Ensure .next directory has correct permissions
# RUN mkdir -p .next && \
#     chmod 755 .next

# # Expose development port
# EXPOSE 3000

# # Development start command
# CMD ["npm", "run", "dev"]

# Optional production stage if needed
# FROM base AS production
# Add production-specific steps if required

# syntax=docker/dockerfile:1.4

# ===============
# Development Stage
# ===============
FROM node:22-alpine AS development

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

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
COPY --chown=nextjs:nodejs package.json package-lock.json* ./

# Switch to non-root user for npm operations
USER nextjs

# Install dependencies with cache mounted to a volume
# This uses npm ci for consistent installs but in development mode
RUN npm ci

# Copy application code (will be overridden with volumes in dev)
COPY --chown=nextjs:nodejs . .

# Expose development port
EXPOSE 3000

# Add simple health check for the dev server
HEALTHCHECK --interval=10s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start development server with hot reloading
CMD ["npm", "run", "dev"]
