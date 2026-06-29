# Local Development

> **Status:** Implemented — Supabase swap slice.

## Prerequisites

- Node.js 20+ LTS and **pnpm** (v9+)
- A [Supabase](https://supabase.com) project (free tier is fine) — needed only for `DATA_BACKEND=supabase`

## Quick start — mock backend (no DB required)

```bash
pnpm install
cp .env.example .env          # DATA_BACKEND=mock is the default
pnpm dev                      # start on http://localhost:3000
```

Log in with any seeded email (see `lib/mock/seed.ts`); password is `"password"` for all accounts.

## Full Supabase setup

```bash
# 1. Create a Supabase project and note your project ref
# 2. Fill in .env:
#    NEXT_PUBLIC_SUPABASE_URL=  (Settings → API → Project URL)
#    SUPABASE_ANON_KEY=         (Settings → API → anon public key)
#    SUPABASE_SERVICE_ROLE_KEY= (Settings → API → service_role key — SECRET)
#    DATABASE_URL=              (Settings → Database → URI with ?pgbouncer=true, port 6543)
#    DIRECT_URL=                (Settings → Database → URI direct, port 5432)
#    DATA_BACKEND=supabase

pnpm install
pnpm db:migrate     # applies prisma/migrations/ to the real Supabase Postgres
pnpm db:seed        # creates PuraLocal org + 11 seeded auth users in Supabase
pnpm dev
```

## Scripts reference

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check (`tsc --noEmit`) |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests (mock backend, no DB) |
| `pnpm test:integration` | Integration tests (real DB, requires `DATABASE_URL`) |
| `pnpm test:e2e` | Playwright e2e tests (mock backend) |
| `pnpm db:migrate` | Apply pending Prisma migrations (`prisma migrate deploy`) |
| `pnpm db:generate` | Re-generate Prisma TypeScript client from schema |
| `pnpm db:seed` | Seed Supabase with PuraLocal org + 11 dev users |

## Environment variables

All documented in [`.env.example`](../../.env.example). Never commit `.env`.

| Variable | Required for | Notes |
|---|---|---|
| `DATA_BACKEND` | always | `mock` (default) or `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase | Public — safe to expose |
| `SUPABASE_ANON_KEY` | supabase | Used server-side only (no `NEXT_PUBLIC_` prefix) |
| `SUPABASE_SERVICE_ROLE_KEY` | seed, admin ops | **Secret** — never commit |
| `DATABASE_URL` | supabase | Pooled connection (PgBouncer, port 6543) |
| `DIRECT_URL` | migrations only | Direct connection (port 5432) |
| `RUN_INTEGRATION` | integration tests | Set to `1` to run `tests/integration/` |

## Related docs
[Migrations](../Data/Migrations.md) · [Deployment](./Deployment.md) · [Troubleshooting](./Troubleshooting.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
