# Migrations

> **Status:** Implemented — Supabase swap slice.

## Overview

Prisma manages migrations. The `prisma/migrations/` directory is committed to git and deployed via `prisma migrate deploy`.

## Migration history

| Migration | Date | Description |
|---|---|---|
| `20260626000000_init` | 2026-06-26 | Initial schema: organizations, profiles, role_assignments, audit_logs + RLS setup |

## What `20260626000000_init` creates

1. **Tables:** `organizations`, `profiles`, `role_assignments`, `audit_logs`
2. **Indexes:** unique on slug/email/role_assignment pair; regular on all `organization_id` FKs
3. **Foreign keys:** profiles→organizations, role_assignments→profiles, role_assignments→organizations, audit_logs→organizations
4. **`prisma_app` role:** `CREATE ROLE prisma_app NOLOGIN` (idempotent via `DO $$ IF NOT EXISTS`)
5. **Grants:** `USAGE ON SCHEMA public` + `SELECT/INSERT/UPDATE/DELETE` on all 4 tables + `ALTER DEFAULT PRIVILEGES` for future tables
6. **RLS (per tenant table):**
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
   - Permissive baseline: `USING (TRUE)` — grants `prisma_app` access to all rows
   - Restrictive org cap: `USING (org_col = current_setting('app.organization_id', true))` — hard-limits every query to the active org

See [prisma/migrations/20260626000000_init/migration.sql](../../prisma/migrations/20260626000000_init/migration.sql) for the full SQL.

## Conventions

- One migration per schema change, committed in the same PR as the code that requires it.
- Never edit a shipped migration. Apply corrective changes as a new migration.
- `prisma.config.ts` at project root provides the `DIRECT_URL` (bypasses PgBouncer) for `prisma migrate deploy`.
- `DATABASE_URL` (PgBouncer pooled connection) is used by the running app; `DIRECT_URL` (port 5432 direct) is used only for CLI commands.

## Running migrations

```bash
# Apply pending migrations against the real Supabase DB
pnpm db:migrate

# Re-generate the TypeScript client from schema.prisma (no DB required)
pnpm db:generate
```

## Related docs
[Database Schema](./Database-Schema.md) · [Authorization](../Security/Authorization.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
