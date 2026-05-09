# Flow

A level-based web game that teaches system design.

## Repo layout (pnpm workspaces)

```
apps/
  web/      Next.js front-end (UI, replay player, particles)
  api/      Fastify backend (POST /api/simulate, /healthz)
packages/
  shared/   TS types, zod schemas, validator, simulator engine
```

`apps/web` never imports the simulator runtime directly — it POSTs to
`apps/api`, gets back a `{frames, outcome}` blob, and replays it locally
at user-controlled speed (compute-once, ship-blob).

## Local development

Two long-running processes. Run both in one shell:

```bash
pnpm install
pnpm dev          # → web on :3000 + api on :4000 in parallel
```

…or individually:

```bash
pnpm dev:web      # → http://localhost:3000
pnpm dev:api      # → http://localhost:4000  (GET /healthz, POST /api/simulate)
```

The web app reads `NEXT_PUBLIC_API_BASE_URL` (default
`http://localhost:4000`) to find the backend.

## Quality gates

```bash
pnpm typecheck
pnpm lint
pnpm test         # vitest across all workspaces
pnpm build        # production build of apps/web
```

All four must be green before merging.
