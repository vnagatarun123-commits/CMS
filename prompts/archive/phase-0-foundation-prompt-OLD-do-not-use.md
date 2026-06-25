# Phase 0 Prompt — Foundation (PuraLocal-first) — paste into Claude Code

> Use this AFTER placing `CLAUDE.md` at the repo root. Paste the block below as your
> first message to Claude Code. It builds ONLY the foundation for a single seeded
> PuraLocal org. We keep the `organizationId` column + query guard now, but build NONE
> of the visible multi-tenant surface (that's the final phase).

---

You are building Phase 0 (Foundation) of the PuraLocal CMS. Read `CLAUDE.md` first and treat its §3 tenancy invariants and §4 RBAC rules as hard constraints. We are building PuraLocal as the single first org (org #1). Keep `organizationId` on every tenant-owned table and the Prisma query guard, but do NOT build org onboarding, branding, custom domains, RLS, or an org switcher — those are deferred to the final phase. Before writing code, output a brief plan and the file list you intend to create, then implement in vertical slices that compile and pass tests.

## Goal of Phase 0

Stand up the skeleton everything later depends on:
1. Project scaffold with the agreed stack.
2. Data model with `organizationId` on tenant-owned tables + a single seeded PuraLocal org.
3. The Prisma tenant-scoping guard (pinned to the active org).
4. Authentication.
5. Capability-based RBAC for all roles.
6. A working, role-aware dashboard shell (nav + empty module pages).
7. Audit logging foundation.
8. Tests, including the cross-org denial test (proves the guard works even with one org).

Do NOT build content management, reporters, ads, analytics, the public API, or any multi-tenant management UI in this phase. Stub those modules in the nav, gated by permission.

## 1. Scaffold

- Next.js (App Router, TypeScript strict), Tailwind, shadcn/ui, Prisma, PostgreSQL, Auth.js, Zod, Vitest, Playwright, pnpm.
- `docker-compose.yml` for Postgres (add Redis too; used in later phases).
- `.env.example` with every required var documented, including `DEFAULT_ORG_SLUG=puralocal`.
- `README.md`: install, db up, migrate, seed, dev, test.
- `package.json` scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `db:migrate`, `db:seed`.

## 2. Data model (Prisma)

At minimum:

- `Organization` (tenant root): id, name, slug (unique), status, createdAt. Seed exactly one: PuraLocal.
- `User`: id, email, name, passwordHash, status, organizationId (nullable ONLY for a platform SUPER_ADMIN), createdAt. Email unique per org.
- `Role` + `Permission` as enums; `RoleAssignment` (user ↔ role within an org).
- `AuditLog`: id, organizationId (nullable for platform events), actorUserId, action, targetType, targetId, metadata (JSON), createdAt. Indexed by org + createdAt.
- Auth.js session/account tables as needed.

Requirements:
- Every tenant-owned table carries an indexed, non-null `organizationId`.
- Seed script creates: the PuraLocal org, one platform Super Admin, and one user per role inside PuraLocal.

## 3. Tenancy guard (the point of keeping the column now)

- **Request-time org resolution:** resolve the active `organizationId` once per request into a typed context. For now, pin it to the seeded PuraLocal org (driven by `DEFAULT_ORG_SLUG`/session). Build this as a seam — a single function — so subdomain/custom-domain routing can replace its internals later without touching business logic.
- **Prisma client extension:** automatically injects `organizationId` into every read/write on tenant-owned models, and **throws** if a tenant-scoped query runs with no active org. Provide one narrow, clearly-marked escape hatch for future platform/Super Admin code, and audit-log its use.
- **Do NOT** add Postgres RLS, domain routing, or org-management UI in this phase (final phase).
- **Tests:** prove that the guard throws when org context is missing, and that a query for a different `organizationId` returns nothing / is rejected. This is the cross-org denial test — keep it even with one org.

## 4. Authentication

- Email + password via Auth.js credentials; passwords hashed with argon2 or bcrypt (sane cost).
- Session cookies for the dashboard; issue JWTs (with org + permission claims) for API/mobile clients used in later phases.
- Login, logout, "forgot password" stub (token model + flow; email send via a no-op adapter for now).
- Login rate-limit / lockout.
- All auth events audit-logged.

## 5. RBAC

- `Permission` enum, granular and covering all roles: e.g. `content:edit`, `content:review`, `content:publish`, `reporters:manage`, `ads:manage`, `users:view`, `finance:view`, `analytics:view`, `org:configure`, `platform:manage`.
- One source of truth mapping role → permissions.
- A single `can(user, permission)` / `requirePermission` helper used everywhere. Never `if (role === ...)` in a route.
- A `withAuth` wrapper enforcing, in order: authenticated → correct org → has permission, returning the consistent error shape on failure.

## 6. Dashboard shell

- Authenticated layout: top bar (user menu — NO org switcher yet) + left nav.
- Nav items for all modules (Content, Reporters, Users, Ads & Monetization, Notifications, Analytics, Settings, Audit Log), each shown only if the user has the relevant permission. Do NOT include an Organizations/white-label nav item yet.
- Each module is an empty "Coming in a later phase" page, EXCEPT a working **Audit Log** viewer (filter by action/date) and a working **Settings → Users & Roles** screen for Org Admin to invite users and assign roles. These exercise the RBAC + tenancy plumbing end to end.
- Responsive for desktop + tablet.

## 7. Definition of done

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all pass.
- Seed runs cleanly; README takes a new dev from clone → running dashboard logged in as a PuraLocal user.
- Unit tests: tenant guard (inject + throw-on-missing), `can()` matrix, auth flow states.
- E2E: log in as Org Admin, invite a user, assign a role, see the audit entry; log in as that user and confirm permission-gated nav.
- Cross-org denial test passes.
- Update the Status checklist in `CLAUDE.md`.

Start by printing your plan and file list. Then implement. After each slice, run typecheck + tests and report results before continuing.
