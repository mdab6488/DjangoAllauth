# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install Yarn globally
RUN npm install -g yarn

# Copy package files and install dependencies using Yarn
COPY package*.json ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn run build

# Runner stage
FROM node:18-alpine AS runner

# Set production environment
ENV NODE_ENV=production
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/next.config.js ./next.config.js

# Install production dependencies only using Yarn
RUN yarn install --frozen-lockfile --production

# Non-root user for better security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use a more precise command
CMD ["yarn", "start"]