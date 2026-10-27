# Build context: repository root (see compose.yaml).
FROM node:24-alpine AS base
ENV TURBO_TELEMETRY_DISABLED=1
RUN corepack enable pnpm
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@devprofile/api...
# Copies the api with production deps only, with workspace packages resolved from their built files.
RUN pnpm --filter=@devprofile/api deploy --prod /out

# One-shot job run by compose before the api starts: applies migrations and loads the
# initial content (the seed skips itself when content already exists).
FROM build AS migrate
WORKDIR /repo/apps/api
# Local binaries on PATH instead of `pnpm exec`: pnpm (via corepack) is set up for root only.
ENV MEDIA_DIR=/data/uploads PATH=/repo/apps/api/node_modules/.bin:$PATH
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node
CMD ["sh", "-c", "prisma migrate deploy && prisma db seed"]

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=3001 MEDIA_DIR=/data/uploads
# A new named volume copies this directory's ownership, so the api can write uploads.
RUN mkdir -p /data/uploads && chown node:node /data/uploads
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
