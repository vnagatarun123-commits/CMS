# PuraLocal CMS — Project Rules (CLAUDE.md)

> This file is read automatically by Claude Code at the start of every session.
> It defines the architecture, conventions, and **non-negotiable invariants** for this
> codebase. Do not violate these rules. If a request conflicts with them, stop and ask.

---

## 1. What we are building

A **Hyperlocal News CMS** (admin dashboard + API) that powers the **PuraLocal** news app.
It is architected so it can later be sold as a multi-tenant, white-label SaaS — but we are
building **PuraLocal first as the single first tenant (org #1)**, and the visible
multi-tenant machinery (org onboarding, branding, custom domains, org switching, RLS) is
deferred to the FINAL phase.

**Why this matters for how you write code:** every tenant-owned table still carries an
`organizationId` and every query is still tenant-scoped from day one. This is the cheap
insurance that makes going white-label later *additive* (build UI on top) rather than a
data-layer rewrite. Do NOT drop the column or the query guard just because we only have one
org today. See §3.

**Build order is phased.** Do not build features that are not in the current phase prompt.
Earlier phases (foundation, auth, RBAC, content) are dependencies for everything else.

---

## 2. Tech stack (do not substitute without asking)

- **Framework:** Next.js (App Router, TypeScript, strict mode).
- **Backend platform:** **Supabase** — provides Postgres (DB), Auth, and Storage. No separate auth server or S3.
- **DB:** Supabase **Postgres**.
- **ORM / schema:** **Prisma** for app schema, migrations, and type-safety against the Supabase Postgres connection string. (Supabase manages the `auth.*` schema; our app `User`/`profile` table links to `auth.users.id`.)
- **Auth:** **Supabase Auth** (email/password to start) for the dashboard; Supabase-issued JWTs for API/mobile clients.
- **Validation:** Zod for all input at the boundary (API routes, server actions, forms).
- **UI:** Tailwind CSS + shadcn/ui components. No other component library.
- **Server state / data:** React Server Components + server actions where possible; TanStack Query only for client-side interactive tables.
- **Testing:** Vitest (unit), Playwright (e2e). Every phase ships with tests.
- **Background jobs / scheduling:** A queue abstraction (BullMQ + Redis). Used for publishing, notifications, analytics rollups (Phase 2+).
- **File/media storage:** **Supabase Storage** behind a storage interface (never write to local disk in app code).
- **Package manager:** pnpm.

### Build approach: frontend-first, mocked behind a seam (current)
We are building the **UI first**, against an **in-memory mock**, and swapping in Supabase later
by changing one module — NOT by rewriting components. This is mandatory discipline:
- Define an **auth provider interface** (`getCurrentUser`, `signIn`, `signOut`, session) and a
  **data-access layer** (repository interfaces, e.g. `UserRepository`, `ContentRepository`) in `lib/`.
- Provide TWO implementations selected by env (`DATA_BACKEND=mock|supabase`): a `mock` (in-memory,
  seeded with PuraLocal + one user per role) now, and a `supabase` impl later.
- **UI, server actions, and `can()` depend ONLY on the interfaces — never on Supabase or mock directly.**
- No fake users or fake data hardcoded inside components. Mocks live behind the seam only.
- The Supabase swap (real Auth + Postgres + RLS) is a later slice that implements the same interfaces.

---

## 3. NON-NEGOTIABLE tenancy invariants (keep the column now, defer the surface)

We have ONE org today (PuraLocal), but the data layer must already be tenant-safe so going
white-label later is additive. These are the most important rules in the codebase.

**Required now (cheap, do not skip):**
1. **Every tenant-owned table/record has a non-null `organizationId`**, indexed. This applies to the mock data layer today and the Prisma schema when Supabase lands.
2. **No query may read or write tenant data without an `organizationId` filter.** Enforced in the data-access layer (the repository interfaces), not trusted to callers: the active `organizationId` is injected on every read/write and the layer **throws** if org context is missing. The mock impl enforces this now; the Supabase/Prisma impl enforces it later.
3. **A single active org is resolved once per request** from a typed context. For now it is pinned to the seeded PuraLocal org (env/mock-driven). The resolution seam exists so domain/subdomain routing can slot in later without touching business logic.
4. **Never** join across orgs or return another org's row. Tests must include a "cross-org access is denied" case for every new resource — even with one org, this proves the guard works (run against the mock now, against Supabase later).

**Supabase RLS — pulled forward (not deferred):**
- Because we use Supabase, **Row-Level Security is the primary isolation mechanism** and is added **as soon as the real Postgres lands** (the Supabase swap slice), keyed on the org claim — NOT deferred to the final phase. It sits underneath the app-layer guard as defense-in-depth.

**Still deferred to the FINAL phase (do NOT build until then):**
- Subdomain / custom-domain routing.
- Org onboarding/CRUD UI, per-tenant branding/theming, enabled-module flags.
- Org switcher and Super Admin "act as org".

If a current-phase feature can't satisfy the "required now" rules, stop and flag it.

---

## 4. Roles & RBAC

Roles: `SUPER_ADMIN`, `ORG_ADMIN`, `EDITOR`, `CONTENT_REVIEWER`, `REPORTER_MANAGER`,
`AD_MANAGER`, `MARKETING_MANAGER`, `FINANCE_MANAGER`, `SUPPORT_EXECUTIVE`, `ANALYTICS_VIEWER`,
plus `REPORTER` (content author, mobile/app side).

Rules:
- Permissions are **capability-based**, not role-name checks scattered in code. Define a `Permission` enum (e.g. `content:review`, `content:publish`, `ads:manage`, `finance:view`) and map roles → permissions in one place.
- Authorize with a single `can(user, permission, resource?)` helper. Never write `if (role === 'EDITOR')` in a route.
- Every server action / API route checks (a) authenticated, (b) correct tenant, (c) has permission. In that order.
- RBAC must be testable and seeded with sensible defaults per role.

---

## 5. Content workflow (the core domain)

All content types — **Image Post, Video Post, Short, Live Stream** — share **one** lifecycle:

```
Draft → Submitted → Under Review → Needs Changes → Approved → Scheduled → Published → Archived
```

Rules:
- One `Content` model with a `type` discriminator and type-specific fields/relations; do **not** create four parallel modules.
- Status transitions go through a single **state machine** with allowed-transition rules and per-transition permission checks (e.g. only `content:review` can move to Approved/Needs Changes; only `content:publish` can Publish).
- Every transition writes an audit log entry (who, when, from→to, note).
- Filtering is first-class: by type, status, language, category, location, reporter, publish date.

---

## 6. Conventions

- **Directory layout:** `app/` (routes), `lib/` (domain logic, no React), `components/` (UI), `prisma/` (schema, migrations, seed), `tests/`.
- Keep domain/business logic in `lib/` as pure-ish functions so it's testable without HTTP.
- All external input validated with Zod at the boundary. Types flow from Zod schemas + Prisma types — no hand-written duplicate types.
- **Migrations:** every schema change = a Prisma migration committed in the same change. Never edit a shipped migration.
- **Errors:** typed result/exception strategy, consistent API error shape `{ error: { code, message } }`. Never leak stack traces or other tenants' data in errors.
- **No secrets in code.** Use env vars; provide `.env.example`.
- **Audit logging** is mandatory for: auth events, role/permission changes, content transitions, financial actions, tenant config changes.
- Accessibility: dashboard is keyboard-navigable; shadcn defaults respected.
- Responsive for desktop + tablet (not mobile-first; this is an admin tool).

---

## 7. Working agreement for Claude Code

- **Plan before coding.** For any phase, first output a short plan + file list, then implement.
- **Work in vertical slices** that compile and pass tests. Don't leave the repo broken between steps.
- **Tests are part of "done."** No feature is complete without unit tests for its domain logic and at least one e2e happy path, plus the cross-tenant denial test.
- After each meaningful unit of work, run typecheck + tests and report results.
- If a requirement is ambiguous or conflicts with the invariants above, **stop and ask** — do not guess on security or tenancy.
- Prefer small, reviewable changes. Summarize what changed and why after each slice.
- Update this file's "Status" section as phases complete.
- **Docs-as-you-go (mandatory).** At the END of every phase, BEFORE merging, update the `/Docs` files the phase's code touched: flip the relevant `Needs Implementation — Phase N` stubs to "Implemented", cite real file paths, refresh diagrams, and update `/Docs/Coverage-Report.md`. **Never document code that does not exist yet** — planned features stay marked as stubs. Add entries to `/Docs/Engineering/Technical-Debt.md` and `Known-Limitations.md` for any deliberate shortcut. See `docs-generation-prompt.md`.

---

## 8. Status (update as you go) — PuraLocal-first ordering

- [ ] Phase 0 — Foundation: orgId column + query guard (single seeded PuraLocal org), auth, RBAC, dashboard shell
- [ ] Phase 1 — Content module + workflow state machine
- [ ] Phase 2 — Media pipeline (image/video/shorts/live) + scheduling/publishing
- [ ] Phase 3 — Reporters (onboarding, verification, assignments, performance, earnings)
- [ ] Phase 4 — Users & engagement
- [ ] Phase 5 — Monetization (ads, subscriptions) + notifications + social publishing
- [ ] Phase 6 — Analytics & business intelligence
- [ ] Phase 7 — Public/mobile API + hardening (rate limits, load)
- [ ] Phase 8 — White-label / multi-tenant surface: org onboarding, branding, custom domains, RLS, org switcher, "act as org" (the deferred §3 items)
