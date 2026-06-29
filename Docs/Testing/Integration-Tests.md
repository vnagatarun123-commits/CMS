# Integration Tests

> **Status:** Partial — Supabase swap slice. RLS enforcement tests written; full repository contract tests pending.

## Running integration tests

Integration tests require a real Supabase Postgres database (`DATABASE_URL`). They are excluded from the default `pnpm test` run and must be opted in:

```bash
RUN_INTEGRATION=1 pnpm test:integration
# or equivalently:
pnpm test:integration   # script already sets RUN_INTEGRATION=1
```

All tests in `tests/integration/` use `it.skipIf(!RUN)` to be no-ops when `RUN_INTEGRATION` is unset.

## Tests written

### `rls-enforcement.test.ts` — proves RLS has teeth

`tests/integration/rls-enforcement.test.ts`

Explicitly bypasses the app-layer `assertOrg` guard and calls `withOrgContext` directly with Org B's ID, then tries to read Org A's data. Proves the DB-layer (RLS) isolation is independent of the app-layer guard.

| Test | What it proves |
|---|---|
| `withOrgContext(orgB)` returns orgB profile only | Baseline — correct org is visible |
| `withOrgContext(orgB)` + WHERE `organization_id = orgA` → empty | RLS USING overrides WHERE clause |
| `withOrgContext(orgB)` + `findUnique({ where: { id: orgAUserId } })` → null | Direct ID lookup also blocked |
| Empty org context (`''`) → no rows | Unset org context denies all access |

Setup/teardown creates and removes dedicated test orgs (`rls-test-org-a`, `rls-test-org-b`) so the test is non-destructive.

## Planned (pending Phase 1+)

- Repository contract tests: verify every repository method's behaviour (including cross-org denial) against a real DB.
- Server action integration tests: end-to-end through `withAuth` → repository → DB.

## Related docs

[Testing Strategy](./Testing-Strategy.md) · [Authorization](../Security/Authorization.md) · [Unit Tests](./Unit-Tests.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
