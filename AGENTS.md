# AGENTS.md

Himatika student association platform: single Nuxt 4 app (docs/guide say "Nuxt 3"; package.json has `nuxt ^4.x`) with a Nitro backend (`server/api/**`), MongoDB via Mongoose, and a Vue 3 frontend (`app/pages/**`). Team rules live in `.agents/rules/system-guide.md` (always-on) and are summarized below.

## Commands

Package manager is **Bun** (only `bun.lock` exists; CI uses bun).

```bash
bun install
bun run dev            # http://localhost:3000
bun run build          # script itself sets NODE_OPTIONS=--max-old-space-size=8192; builds are memory-hungry
bun run test:e2e       # boots a real Nuxt server + Playwright browser
bun run test:server    # server unit/regression tests
bun run test:nuxt      # component tests (nuxt environment)
bun run seed           # scripts/seed.ts against local Mongo
```

- There is **no lint or typecheck script** and no ESLint/Prettier config — don't invent one.
- Single file/project: `bunx vitest run tests/e2e/login.test.ts --project e2e` (projects: `e2e`, `server-unit`, `nuxt`; see `vitest.config.ts`).
- `test:e2e` and `test:server` require a **local MongoDB** on `127.0.0.1:27017` (override via `NUXT_MONGODB_URI`). Shared setup (`tests/e2e/setup.ts`) wipes and reseeds User/Member/Category/Agenda collections on every run. Utils tests additionally need `ENCRYPTION_KEY` (64 hex chars); auth flows need `JWT_SECRET`.
- First e2e run needs: `npx playwright install chromium --with-deps`.
- CI (`.github/workflows/e2e.yml`) runs e2e tests on push/PR to `main` and `preview` with a Mongo service container.

## Gotchas

- **Auth is secure-by-default**: `server/middleware/auth.ts` blocks every `/api/*` route unless explicitly allowlisted (separate GET-only whitelist exists). New public endpoints return 401 until added there.
- Content APIs (news, agenda, storage, ...) disable `xssValidator`/`csrf` via `routeRules` in `nuxt.config.ts` — copy this pattern for endpoints accepting rich text/uploads.
- Rendering is per-path via `routeRules`: `/dashboard/**`, `/profile/**`, `/administrator/**` and auth pages are client-only (SPA); stats/news/agenda use SWR. New pages under those prefixes inherit that behavior.
- The PDF worker (certificates/digital signatures) is a separate Python service (`../himatika-pdf-worker`) called through `PDF_WORKER_API_URL` via `server/utils/himatikaPdfWorker.ts`. `docker-compose.yml` is deprecated — production deploys to Vercel.
- Env lives in `.env` (copy `.env.example`). Rotating `ENCRYPTION_KEY` makes all previously encrypted data unreadable.

## Hard conventions (enforced by review)

- Strict TypeScript: no `any`; define interfaces/types.
- SSR data fetching must use `useAsyncData`/`useFetch`, not bare `fetch`/axios (hydration mismatch).
- Zero hardcoded UI text: all strings go in `locales/`. Only `id.json` (default locale) and `en.json` exist — update both together. (The guide mentions `ar`; it doesn't exist here.)
- Server-side emails must call `useTranslationServerMiddleware(event)` for locale-aware strings.
- Validate every endpoint body/query with Zod before hitting the DB.
- Never pass raw request bodies to Mongoose models — destructure known fields.
- Concurrent mutations (event registration, payments) must use atomic Mongo operators (`$push`/`$addToSet` with query conditions), never in-memory read-check-write.
- Any password set/change must use `validatePassword` from `server/utils/validatePassword.ts`.

## Git workflow

- `main`/`master` = production; `preview` = integration branch.
- One module per branch: `<type>/<module>-<desc>` (e.g. `feat/agenda-qr-scanner`, `fix/payment-midtrans-webhook`).
- Conventional Commits: `type(scope): message` (e.g. `feat(agenda): add payment verification endpoint`).

## Other instruction files

- `.agents/rules/system-guide.md` — full contribution/architecture standard (source of the conventions above).
- `.github/instructions/codacy.instructions.md` — Codacy MCP analysis loop for Copilot sessions.
