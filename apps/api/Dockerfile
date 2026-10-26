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

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=3001
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
