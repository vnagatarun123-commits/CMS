# Technical Debt

> **Status:** Living document

Running log of known shortcuts and intended fixes. Each entry states what was cut, why,
and which phase will address it.

## Phase 0 entries

### TD-001 — globalThis mock session (`lib/mock/mock-auth.ts`, `lib/backend.ts`)

**What:** The mock auth provider stores the active session in `globalThis.__puralocalSession`,
and the mock backend singleton lives in `globalThis.__puralocalBackend`. Only one user can be
"logged in" at a time, and all state is lost on server restart.

`globalThis` is used (not module-level `let`) because Next.js compiles Route Handlers and
Server Actions into separate module bundles with separate module caches. A module-level
variable would give each bundle an independent copy and the `POST /api/e2e/reset` endpoint
would fail to clear state that server actions read. `globalThis` is the single true shared
namespace within a Node.js process.

**Why:** Pragmatic shortcut for the frontend-first, mock-only phase. Cookie/JWT session
management is an infrastructure concern that belongs with real Supabase Auth.

**Fix in:** Supabase swap slice (implements `AuthProvider` with Supabase JWTs + secure
`HttpOnly` cookies). `setMockSession()` and the module-level store are deleted entirely.

---

### TD-002 — No-op invite email (`app/actions/users.ts:inviteUser`)

**What:** `inviteUser` creates a user record and writes an audit entry, but does not send
a real invitation email. There is no email adapter wired up yet.

**Why:** Email delivery (SMTP / transactional service) has not been chosen. The invite
action was scoped to the data-layer and RBAC side only.

**Fix in:** Phase 2 or Phase 3 (when reporter/user onboarding needs actual email flow).
An `EmailProvider` interface lives in `lib/email/` alongside a no-op stub; swap in
Resend/SendGrid by changing the env-selected implementation.

---

### TD-003 — Single org pinned in mock (`lib/mock/seed.ts`)

**What:** The org context is hard-coded to `PURALOCAL_ORG_ID` (`"org_puralocal_001"`).
Every session gets the same org. The resolution seam exists (`orgContext` on `Session`)
but has only one implementation: the pinned PuraLocal mock.

**Why:** Phase 0 is PuraLocal-first. Multi-tenant routing (subdomain / custom domain) is
deferred to Phase 8 per `CLAUDE.md §3`.

**Fix in:** Phase 8 (org onboarding + routing). The seam is already in place; adding
real resolution is additive (no data-layer rewrite needed because every table already
carries `organizationId`).

---

### TD-004 — Dev-credentials panel in login (`app/(auth)/login/page.tsx`)

**What:** The login page passes `seedEmails` to the client component only when
`NODE_ENV === 'development'`. The list of mock emails and roles is therefore never
served in production, but the code path and the `SEEDED_USERS` import still exist in
the source.

**Why:** Convenience for Phase 0 development iteration.

**Fix in:** Supabase swap slice. Remove the entire dev credentials panel, the
`seedEmails` prop, and the `SEEDED_USERS` import from `page.tsx`.

---

### TD-005 — `POST /api/e2e/reset` endpoint (`app/api/e2e/reset/route.ts`)

**What:** A dev/test endpoint that clears the mock session and resets the in-memory backend.
Returns 404 in production, but the route file is still in the codebase.

**Why:** Required for Playwright test isolation with module-level state.

**Fix in:** Supabase swap slice. Once real sessions live in cookies and data in Postgres,
the reset endpoint (and the module-level mock state it clears) is deleted entirely.

---

## Supabase swap slice entries

### TD-006 — Profile IDs for invited users are random UUIDs, not auth.users IDs

**What:** `SupabaseUserRepository.invite()` generates a `crypto.randomUUID()` as the profile `id`. These IDs do NOT match `auth.users.id` because the Supabase Auth invite flow (email → user accepts → auth user created) has not been implemented.

**Why:** The full Supabase Auth invite flow requires `supabase.auth.admin.inviteUserByEmail()` + a webhook to update the profile's `id` when the user accepts. This is scoped to the user onboarding phase, not the infrastructure swap.

**Fix in:** Phase 3 (reporter onboarding) or Phase 4 (user management). The profile will be updated with the real `auth.users.id` when the user accepts the invite email.

---

### TD-007 — Seed script uses `password` as the dev default password

**What:** `prisma/seed-supabase.ts` creates all 11 seeded Supabase Auth users with `password: 'password'`.

**Why:** Dev convenience, consistent with the mock backend. Acceptable for local/staging only.

**Fix in:** Supabase Auth invite flow (Phase 3–4). Real users accept an email invite and set their own password. The seed script is dev-only and must never run against production.

---

### TD-008 — `withOrgContext` always wraps in a new transaction (no savepoint nesting)

**What:** `withOrgContext` starts a fresh `prisma.$transaction(...)` for every repository call. Nested calls (e.g. `UserRepository.invite()` which creates profile + role assignment + returns the joined record) run as three separate queries inside ONE transaction — this is fine. But if a repository method were ever called from inside an existing transaction, Prisma would throw (no savepoint support yet in Prisma 7 interactive transactions).

**Why:** Current repository methods don't nest `withOrgContext`. This is a hypothetical future issue.

**Fix in:** Phase 1 if compound repository operations are needed. Pattern: pass the `TxClient` down rather than starting a new transaction.

---

## Related docs

[Known Limitations](./Known-Limitations.md) · [Future Enhancements](./Future-Enhancements.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
