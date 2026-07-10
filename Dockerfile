FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat su-exec

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
# Build-time so NEXT_PUBLIC_* inlines into the standalone client bundle.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate public/games BEFORE next build traces the public/ dir, so the
# standalone output includes the game assets (a build-time hook runs too late).
RUN node scripts/copy-games.js
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next standalone relocates the generated public/games into ./games at the
# standalone root; copy it into ./public so server.js serves /games/*.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/games ./public/games

RUN mkdir -p /data/saves
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
