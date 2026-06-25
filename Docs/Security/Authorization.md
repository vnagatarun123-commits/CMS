# Authorization

> **Status:** Implemented (intent) — code lands Phase 0. Two layers: **tenancy** (which org's data) and **RBAC** (what this user may do).

## Layer 1 — Tenancy (data isolation)

The non-negotiable invariant (`CLAUDE.md` §3): no query reads or writes tenant data without
an `organizationId` filter. This is enforced, not trusted.

```mermaid
sequenceDiagram
    participant R as Request
    participant M as Middleware
    participant A as withAuth wrapper
    participant L as Domain logic (lib/)
    participant P as Prisma + tenant extension
    participant DB as PostgreSQL

    R->>M: incoming request
    M->>M: resolve active org (pinned to PuraLocal now)
    M->>A: request + org context
    A->>A: 1) authenticated? 2) correct org? 3) has permission?
    A->>L: authorized call
    L->>P: query (no manual orgId)
    P->>P: inject organizationId; THROW if org context missing
    P->>DB: org-scoped query
    DB-->>R: only this org's rows
```

- **Org resolution** happens once per request as a typed context. Today it is pinned to the seeded PuraLocal org (env/seed-driven); the seam exists so domain/custom-domain routing can replace its internals in Phase 8 without touching business logic.
- **Prisma client extension** injects `organizationId` into every read/write on tenant-owned models and **throws** if org context is missing. One narrow, audit-logged escape hatch exists for future platform/Super Admin code.
- **Postgres RLS** is deferred to Phase 8 as defense-in-depth.
- **Test rule:** every resource ships a "cross-org access is denied" test — even with one org — to prove the guard works.

## Layer 2 — RBAC (capabilities)

Capability-based, never role-name checks in routes (`CLAUDE.md` §4).

- **Roles:** `SUPER_ADMIN`, `ORG_ADMIN`, `EDITOR`, `CONTENT_REVIEWER`, `REPORTER_MANAGER`, `AD_MANAGER`, `MARKETING_MANAGER`, `FINANCE_MANAGER`, `SUPPORT_EXECUTIVE`, `ANALYTICS_VIEWER`, `REPORTER`.
- **Permissions:** a granular `Permission` enum (e.g. `content:edit`, `content:review`, `content:publish`, `reporters:manage`, `ads:manage`, `users:view`, `finance:view`, `analytics:view`, `org:configure`, `platform:manage`).
- **Single source of truth:** one role→permission map.
- **Single helper:** `can(user, permission)` / `requirePermission`, used by every server action and route.
- **Order of checks (always):** authenticated → correct org → has permission.

### Example role → permission sketch (confirm against code)

| Role | Sample permissions |
|---|---|
| ORG_ADMIN | `org:configure`, `users:view`, all content perms |
| EDITOR | `content:edit`, `content:submit` |
| CONTENT_REVIEWER | `content:review` (approve / needs-changes) |
| (publish) | `content:publish` — whoever is granted it |
| FINANCE_MANAGER | `finance:view` |
| ANALYTICS_VIEWER | `analytics:view` |
| SUPER_ADMIN | `platform:manage` (only cross-org role; audit-logged) |

## Related docs
[Security / Authentication](./Authentication.md) · [API Authentication](../APIs/Authentication.md) · [Database Schema](../Data/Database-Schema.md) · [Security Considerations](./Security-Considerations.md)

---
_Last updated: Phase 0 scaffold._
