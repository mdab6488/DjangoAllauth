# syntax=docker/dockerfile:1.4
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache bash curl git && corepack enable

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

COPY package.json yarn.lock .yarnrc.yml ./
# Ensure this comes BEFORE copying source code
COPY --link .yarnrc.yml ./
COPY --link .yarn ./.yarn

COPY --link package.json yarn.lock ./

RUN yarn set version stable && \
    yarn install --immutable --network-timeout 100000 --verbose

COPY . .

RUN --mount=type=cache,target=/app/.next/cache \
    yarn build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000

RUN apk add --no-cache curl && corepack enable && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static/ ./.next/static/
COPY --from=builder --chown=nextjs:nodejs /app/public/ ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.yarn/cache ./.yarn/cache
COPY --from=builder --chown=nextjs:nodejs /app/.pnp.* ./

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["yarn", "start"]