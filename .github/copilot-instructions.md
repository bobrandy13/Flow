# Flow — Copilot Instructions

## Project Overview

Flow is a level-based web game that teaches system design. Each level presents the player with a progressively complex system design challenge to implement (e.g., "build a simple service that can receive requests"). The game guides learners through real system design concepts hands-on.

**Stack:** Next.js + TypeScript (frontend/fullstack). Backend TBD.

## Build & Dev Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # tsc --noEmit (if configured)
```

> Run a single test (once a test framework is added):
> - Jest: `npx jest path/to/test.test.ts`
> - Vitest: `npx vitest run path/to/test.test.ts`

## Architecture

- **`/app`** — Next.js App Router pages and layouts. Each route maps to a game screen (e.g., `/levels`, `/levels/[id]/play`).
- **`/components`** — Shared UI components. Game-specific components live close to the feature they belong to.
- **`/lib`** — Business logic, game engine, level definitions, utilities. No React dependencies.
- **`/types`** — Shared TypeScript types and interfaces.

### Level System

Levels are the core data model. Each level defines:
- A system design challenge/prompt
- A set of components the player can place/connect
- Validation logic to evaluate the player's solution

Level definitions live in `/lib/levels/`. New levels are added as data — not as new pages.

### Game State

Game/level state is managed client-side (React context or a state library TBD). Persistent progress (completed levels, scores) will be stored server-side once the backend is established.

## Key Conventions

- **TypeScript strict mode** — avoid `any`; define explicit types for all level and game state shapes.
- **App Router** — use Server Components by default; add `"use client"` only where interactivity is needed.
- **Co-located styles** — use CSS Modules or Tailwind (whichever is initialized) scoped to the component file.
- **Level data is declarative** — level logic and rendering are separate. Level configs describe *what* to render; components decide *how* to render it.
- **Dark theme only** — the entire app is dark-themed. `app/globals.css` declares `color-scheme: dark` and must NOT contain `prefers-color-scheme: light`. If you ever introduce light mode, ship a tested theme toggle in the same change. A test in `app/globals.theme.test.ts` enforces this.

## Testing Discipline

**When you fix a bug, add a regression test in the same change.** This is non-negotiable for:
- UI interaction bugs (drag-and-drop, click handlers, keyboard shortcuts) → component test under `components/**/*.test.tsx` using `@testing-library/react`.
- Theming / styling regressions (color modes, layout-breaking CSS) → assert against `globals.css` or component output (see `app/globals.theme.test.ts` for the pattern).
- Engine bugs (validator rules, simulator math) → unit test under `lib/__tests__/*.test.ts`.
- Routing bugs → at minimum a build/SSR check; ideally a render test for the page.

Before declaring a bug fixed, write the test that would have caught it, run `npm test` to confirm it now passes, and verify it fails when the fix is reverted (mentally or actually).

Existing test infrastructure:
- Vitest + jsdom + Testing Library are configured (`vitest.config.ts`, `vitest.setup.ts`).
- Tests can live next to the code (`Foo.test.tsx`) or in `lib/__tests__/`.
- Path alias `@/*` works in tests.
