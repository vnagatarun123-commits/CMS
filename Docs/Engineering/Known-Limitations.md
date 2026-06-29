# Known Limitations

> **Status:** Living document

What the system deliberately does NOT do yet, and which phase addresses each gap.
These are not bugs — they are explicit deferred decisions.

## Phase 0 limitations

### KL-001 — All data is in-memory; lost on server restart

There is no database yet. `createMockBackend()` seeds data at startup from
`lib/mock/seed.ts`. Any data created during a session (invited users, audit entries)
is gone if the Next.js process restarts.

**Addressed in:** Supabase swap slice (Prisma + Supabase Postgres).

---

### KL-002 — No Row-Level Security (RLS)

The app-layer tenant guard (`organizationId` filter on every repository method) is
implemented and enforced. But Supabase RLS — the database-layer defense-in-depth —
is not yet in place because there is no real Postgres.

**Addressed in:** Supabase swap slice. RLS policies keyed on the `organization_id`
claim are applied as soon as the real Postgres lands (`CLAUDE.md §3`).

---

### KL-003 — No real authentication

Sessions are stored in a module-level variable in `lib/mock/mock-auth.ts`. There are
no cookies, no JWTs, no refresh tokens, and no session expiry. Any tab, window, or
concurrent request to the same server process shares the single slot.

**Addressed in:** Supabase swap slice (Supabase Auth + `HttpOnly` JWT cookies).

---

### KL-004 — Single organisation only (PuraLocal)

Org context is pinned to `PURALOCAL_ORG_ID`. There is no org onboarding UI, no
subdomain routing, and no org switcher. The multi-tenant data layer is in place
(every table has `organizationId`; every query is tenant-scoped), but the surface is
not exposed.

**Addressed in:** Phase 8 (white-label / multi-tenant surface).

---

### KL-005 — Invite does not send email

`inviteUser` creates the user record and audit entry but does not deliver an invitation
email. There is no email adapter.

**Addressed in:** Phase 2–3 (when reporter/user onboarding requires real email flows).

---

### KL-006 — No dark mode

`next-themes`' `ThemeProvider` is wired (`app/providers.tsx`) and defaults to `light`,
but no dark-mode token set exists in `app/globals.css`. The `dark:` Tailwind variants
produce unstyled output.

**Addressed in:** Phase 0.x or Phase 1 design polish pass (add dark-mode token set and
add a theme toggle to the topbar).

---

### KL-007 — No media upload or Supabase Storage

All content and media fields are placeholder UI. No file upload, no image/video storage,
no CDN delivery.

**Addressed in:** Phase 2 (media pipeline).

---

### KL-008 — Content, Reporters, Ads, Analytics pages are placeholders

Navigation links to these sections exist and are permission-gated, but they render a
"coming in a later phase" placeholder page (`components/shared/placeholder-page.tsx`).

**Addressed in:** Phases 1–6 (each phase fills in its section).

---

## Supabase swap slice limitations

### KL-009 — Integration tests require a live Supabase DB

`tests/integration/rls-enforcement.test.ts` can only run with `DATABASE_URL` configured and `RUN_INTEGRATION=1`. CI does not run these tests by default.

**Addressed in:** A CI integration-test job (Phase 7 hardening) can use a Supabase branch database or a Postgres Docker container.

---

### KL-010 — `prisma migrate diff` does not work offline in Prisma 7.8.0

`prisma migrate diff --from-empty --to-schema` exits 0 with no output when `DATABASE_URL` points to an unreachable server. The migration SQL for `20260626000000_init` was hand-written.

**Addressed in:** When deploying against a real DB, `prisma migrate deploy` will verify the migration SQL matches the applied state. If there is any index or constraint name drift, a corrective migration can be generated with `prisma migrate dev`.

---

### KL-011 — `prisma.config.ts` datasource.url is the DIRECT_URL

`prisma.config.ts` passes `DIRECT_URL` as the datasource URL for migrate commands. This is correct — migrations must bypass PgBouncer. The app runtime (`DATABASE_URL`, pooled) is passed via the `PrismaPg` adapter constructor in `lib/supabase/prisma.ts`.

This means two separate env vars are needed for Supabase: one for the app (pooled) and one for migrations (direct). This is a Supabase/PgBouncer requirement, not a bug.

---

## Phase 1 limitations

### KL-012 — CMS creator can publish content without review

Any user with `content:create` (EDITOR, ORG_ADMIN, MARKETING_MANAGER) can create content
directly in `PUBLISHED` status or transition `DRAFT → PUBLISHED` without passing through
review. This is a deliberate product decision: the bar to set a status is identical whether
at creation time or via transition, so there is no loophole — but the net effect is that
junior CMS creators can bypass the review queue.

Every direct publish is audit-logged (`directPublish: true` in metadata) so it is fully
traceable. The permission gate can be tightened later (e.g. require `content:publish` for
direct publish) without a schema change.

**Addressed in:** Phase 1 design review or a future permission-tightening slice.

---

## Related docs

[Technical Debt](./Technical-Debt.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
