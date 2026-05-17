# Stage 1 — install deps and compile API to a single JS bundle.
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./

# esbuild bundles api + @flow/shared into dist/server.js, leaving runtime
# npm deps external. No tsx at runtime.
RUN pnpm --filter @flow/api build

# Deploy a flat prod node_modules with the runtime npm deps only.
RUN pnpm deploy --filter @flow/api --prod --legacy /deploy

# Stage 2 — minimal runtime, no source, no tsx.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=node:node /deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /deploy/package.json ./package.json
COPY --from=builder --chown=node:node /app/apps/api/dist ./dist

EXPOSE 4000
ENV PORT=4000
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/healthz || exit 1

USER node

CMD ["node", "dist/server.js"]