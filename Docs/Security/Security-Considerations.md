# Security Considerations

> **Status:** Living document. Foundations defined in `CLAUDE.md`; hardening pass in Phase 7, full tenant isolation proof in Phase 8.

## Threat model summary

The product's defining security property is **tenant isolation** — one publisher's data must
never reach another. Today only PuraLocal exists, but the controls are built now so the
property holds when more tenants are added.

| Risk | Control | Status |
|---|---|---|
| Cross-tenant data leak | `organizationId` on every table + Prisma guard that throws on missing context; cross-org denial tests per resource; Postgres RLS (Phase 8) | Guard: Phase 0 · RLS: Phase 8 |
| Broken access control | Capability-based RBAC, single `can()` helper, `withAuth` order: authn → org → permission | Phase 0 |
| Credential attacks | Strong password hashing (argon2/bcrypt), login rate-limit/lockout | Phase 0 |
| Injection | Prisma parameterized queries; Zod validation at all boundaries | Phase 0 |
| Secret exposure | No secrets in code; env vars + `.env.example`; secret store TBD | Partial — store TBD |
| Sensitive data in errors/logs | Standard error envelope, no stack traces/PII leakage; structured logs | Phase 0 convention |
| Privilege escalation via Super Admin | Only cross-org role; "act as org" is explicit + audit-logged | Phase 8 |
| Abuse of public API | Rate limiting, validation, pagination | Phase 7 |

## Audit logging

Mandatory for auth events, role/permission changes, content transitions, financial actions,
and tenant-config changes (`CLAUDE.md` §6). Audit logs are themselves org-scoped.

## Pending security decisions (Needs Investigation)
- Secret management store for deployed environments.
- Whether RLS can be enabled earlier than Phase 8 (cheap if infra allows — see ADR-0002).
- Dependency-audit + SAST in CI.

## Pre-launch checklist (run before Phase 7/8 ship)
- [ ] Cross-org fuzz tests pass with ≥2 orgs.
- [ ] RLS policies on every tenant-owned table.
- [ ] Dependency audit clean; secrets scan clean.
- [ ] Rate limits verified under load.
- [ ] `/security-review` run on the diff.

## Related docs
[Authorization](./Authorization.md) · [Authentication](./Authentication.md) · [Secrets Management](./Secrets-Management.md) · [Error Handling](../APIs/Error-Handling.md)

---
_Last updated: Phase 0 scaffold._
