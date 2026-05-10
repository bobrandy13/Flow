# This is a docker file that will setup the config for Flow web server

FROM node:22-alpine AS deps

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

COPY package.json /app
COPY pnpm-lock.yaml /app
COPY pnpm-workspace.yaml /app

COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @flow/web build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000

ENV HOSTNAME="0.0.0.0"

USER node
CMD ["node", "apps/web/server.js"]