# E2E Tests

> **Status:** Implemented — Phase 0 (3 scenarios)

Playwright specs in `tests/e2e/`. The mock state is reset before every test via a dev-only
endpoint (`POST /api/e2e/reset`) that calls `resetBackend()` + `setMockSession(null)`.
All tests run serially (`test.describe.configure({ mode: 'serial' })`) to prevent
module-level state from leaking between scenarios.

## Phase 0 — `tests/e2e/phase-0.spec.ts`

### Scenario 1 — Org Admin: invite user → assign role → audit log

Full admin flow:

1. Sign in as `admin@puralocal.com` (`ORG_ADMIN`).
2. Navigate to `/dashboard/settings/users-roles`.
3. Open the **Invite user** dialog, fill name/email/role (`EDITOR`), submit.
4. Wait for success toast; verify dialog closes.
5. Find `reporter@puralocal.com` row, open the **Actions** menu → **Change role**.
6. Change the select to `EDITOR`, submit.
7. Wait for success toast; verify dialog closes.
8. Navigate to `/dashboard/audit-log`.
9. Assert a **User invited** row exists with target `e2e@puralocal.com` and actor `Org Admin`.
10. Assert a **Role assigned** row exists with target `EDITOR` and actor `Org Admin`.

### Scenario 2 — REPORTER: nav is gated

1. Sign in as `reporter@puralocal.com` (`REPORTER`, permissions: `CONTENT_EDIT` only).
2. Read all `<a>` text from `aside nav`.
3. Assert **present**: Dashboard, Content.
4. Assert **absent**: Reporters, Users, Ads, Notifications, Analytics, Audit Log, Users & Roles.

### Scenario 3 — ANALYTICS\_VIEWER: nav is gated

1. Sign in as `analytics@puralocal.com` (`ANALYTICS_VIEWER`, permissions: `ANALYTICS_VIEW` only).
2. Read all `<a>` text from `aside nav`.
3. Assert **present**: Dashboard, Analytics.
4. Assert **absent**: Content, Reporters, Users, Ads, Notifications, Audit Log, Users & Roles.

## Reset mechanism

`app/api/e2e/reset/route.ts` — `POST /api/e2e/reset` — calls `resetBackend()` and
`setMockSession(null)`. Returns 404 in production. Remove during the Supabase swap.

## Planned additions (Phase 1+)

- Content workflow happy path: create draft → submit → review → approve → publish.
- Cross-tenant denial: ensure a user from a different org cannot read another org's content.

## Related docs

[Testing Strategy](./Testing-Strategy.md) · [Unit Tests](./Unit-Tests.md)

---
_Last updated: Phase 0 complete._
