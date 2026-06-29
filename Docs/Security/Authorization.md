# Authorization

> **Status:** Implemented — Phase 0 (RBAC) + Supabase swap slice (RLS).
> Two layers: **tenancy** (which org's data) and **RBAC** (what this user may do).

## Layer 1 — Tenancy: two-layer isolation

### App layer (`assertOrg` + `withOrgContext`)

Every repository method calls `assertOrg(organizationId)` first — a fast runtime guard that throws `MissingOrgContextError` if the org context string is empty/undefined. This is the first line of defense.

### DB layer (Postgres RLS)

RLS is the second line of defense. It proves the isolation has teeth even if a developer accidentally skips `assertOrg`.

**Path B approach:** Prisma connects as the `postgres` superuser but switches to the `prisma_app NOLOGIN` role within every transaction via `SET LOCAL ROLE prisma_app`. Two RLS policies per tenant table are active when `prisma_app` is the executing role:

1. **Permissive baseline** (`USING TRUE`) — grants `prisma_app` row-level access (without at least one permissive policy, PostgreSQL denies all rows).
2. **Restrictive org cap** (`USING (org_col = current_setting('app.organization_id', true))`) — hard-limits every read/write to the org whose ID was set via `set_config('app.organization_id', orgId, true)` in the same transaction.

`set_config(..., true)` makes the setting transaction-local; the connection returns to the PgBouncer pool clean when the transaction ends.

```mermaid
sequenceDiagram
    participant SA as Server Action
    participant WA as withAuth()
    participant Repo as Repository method
    participant PG as Postgres

    SA->>WA: call
    WA->>WA: authenticated? → org? → permission?
    WA->>Repo: authorized call (session injected)
    Repo->>Repo: assertOrg(orgId) [app layer]
    Repo->>PG: BEGIN; SET LOCAL ROLE prisma_app; set_config(...orgId...); <query>; COMMIT
    PG->>PG: RLS: permissive(TRUE) AND restrictive(org_col = orgId)
    PG-->>Repo: only this org's rows
```

### `withOrgContext` implementation

`lib/supabase/supabase-repositories.ts`:

```typescript
async function withOrgContext(prisma, organizationId, fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE prisma_app`
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`
    return fn(tx)
  })
}
```

### RLS proof test

`tests/integration/rls-enforcement.test.ts` — 4 scenarios, all with `assertOrg` deliberately bypassed:

1. `withOrgContext(orgB)` returns orgB rows only.
2. `withOrgContext(orgB)` returns empty when querying for orgA rows via WHERE clause.
3. `withOrgContext(orgB)` returns null for a known orgA row ID (`findUnique`).
4. Empty org context (`''`) returns no rows.

Run with: `pnpm test:integration` (requires `DATABASE_URL` + real Supabase).

## Layer 2 — RBAC

Capability-based, never role-name checks in routes.

- **`Permission` enum** — granular capabilities (e.g. `content:edit`, `users:view`, `analytics:view`).
- **`ROLE_PERMISSIONS` map** — single source of truth in `lib/rbac/permissions.ts`.
- **`can(user, permission)`** / **`requirePermission`** — single helper in `lib/rbac/can.ts`.
- **`withAuth(permission, handler)`** — wraps every server action: checks authenticated → org → permission in order.

### Roles

`SUPER_ADMIN`, `ORG_ADMIN`, `EDITOR`, `CONTENT_REVIEWER`, `REPORTER_MANAGER`,
`AD_MANAGER`, `MARKETING_MANAGER`, `FINANCE_MANAGER`, `SUPPORT_EXECUTIVE`, `ANALYTICS_VIEWER`, `REPORTER`

### Order of checks (always)

1. Authenticated (valid session)
2. Correct org (session.user.organizationId matches resource org)
3. Has permission (RBAC capability check)

## Related docs
[Authentication](./Authentication.md) · [Database Schema](../Data/Database-Schema.md) · [Migrations](../Data/Migrations.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
