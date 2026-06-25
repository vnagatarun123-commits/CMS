# Coding Standards

> **Status:** Implemented (convention) — applies from Phase 0. Source: `CLAUDE.md`.

## Language & types
- TypeScript **strict** mode throughout.
- Types flow from **Zod schemas + Prisma types**. Do not hand-write duplicate types for the same shape.
- Validate **all external input with Zod** at the boundary: API route handlers, server actions, and forms.

## Layering
- **Directory layout:** `app/` (routes), `lib/` (domain logic, no React), `components/` (UI), `prisma/` (schema, migrations, seed), `tests/`.
- Keep domain/business logic in `lib/` as **pure-ish functions** so it's testable without HTTP.
- Default data path: **React Server Components + server actions**. Use **TanStack Query only** for interactive client tables.

## Data access
- Never query tenant data without going through the **Prisma tenant-scoping extension**. Never manually pass `organizationId` to bypass it; never add a model-level escape hatch outside the one sanctioned, audit-logged path.

## Authorization
- Authorize via the single `can(user, permission)` / `requirePermission` helper and the `withAuth` wrapper. **Never** write `if (role === '...')` in a route.

## Errors
- Use the standard error envelope `{ error: { code, message } }`. Never leak stack traces or other tenants' data. See [Error Handling](../APIs/Error-Handling.md).

## Migrations
- One Prisma migration per schema change, committed with the change. **Never edit a shipped migration** — add a new one.

## Secrets
- No secrets in code. Use env vars; keep `.env.example` current.

## Tests
- A feature is not "done" without: unit tests for its `lib/` logic, at least one e2e happy path, and the **cross-org denial test** for every new resource.

## Reviews
- Small, reviewable changes (vertical slices that compile + pass tests). Summarize what changed and why. Run `/review` and (for security-sensitive diffs) `/security-review` before merge.

## Related docs
[Project Conventions](./Project-Conventions.md) · [Testing Strategy](../Testing/Testing-Strategy.md) · [Authorization](../Security/Authorization.md)

---
_Last updated: Phase 0 scaffold._
