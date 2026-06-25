# Local Development

> **Status:** Needs Implementation — Phase 0 (finalize against the actual scaffold + README). Intent from `CLAUDE.md`.

## Prerequisites
- Node.js (LTS) and **pnpm**.
- Docker (for Postgres; Redis added in Phase 2).

## Expected setup (confirm against the repo `README.md` once Phase 0 lands)

```bash
pnpm install
docker compose up -d           # Postgres (and Redis from Phase 2)
cp .env.example .env           # fill in values; DEFAULT_ORG_SLUG=puralocal
pnpm db:migrate                # apply Prisma migrations
pnpm db:seed                   # seed PuraLocal org + one user per role
pnpm dev                       # start the dashboard
```

## Scripts (expected)
| Script | Purpose |
|---|---|
| `pnpm dev` | Run the app locally |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | Lint |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright e2e |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed dev data |

## Environment variables
Documented in `.env.example`. No secrets in code. Includes DB URL, auth secret, `DEFAULT_ORG_SLUG`, and (Phase 2+) Redis + storage credentials.

## Related docs
[Deployment](./Deployment.md) · [Troubleshooting](./Troubleshooting.md) · [Migrations](../Data/Migrations.md)

---
_Last updated: Phase 0 scaffold (verify commands against README once code exists)._
