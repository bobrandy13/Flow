# Stage 1 — install ALL deps (need tsx at runtime) + deploy a flat bundle
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

# Copy source so pnpm deploy can resolve workspace:* links
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./

RUN pnpm deploy --filter @flow/api --prod --legacy /deploy

# Stage 2 — minimal runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# pnpm deploy gives us a flat node_modules — no pnpm needed at runtime
COPY --from=deps --chown=node:node /deploy/node_modules ./node_modules
COPY --from=deps --chown=node:node /deploy/package.json ./package.json

# Source + shared (tsx compiles on the fly)
COPY --chown=node:node apps/api/src ./src
COPY --chown=node:node apps/api/tsconfig.json ./tsconfig.json
COPY --chown=node:node packages/shared ./packages/shared
COPY --chown=node:node tsconfig.base.json ./tsconfig.base.json

EXPOSE 4000
ENV PORT=4000
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/healthz || exit 1

USER node

CMD ["node", "--import", "tsx", "src/server.ts"]