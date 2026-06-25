# Project Conventions

> **Status:** Implemented (convention) — applies from Phase 0. Source: `CLAUDE.md`.

## Phased build
- Work only within the **current phase prompt**. Do not build ahead. Phase order is in `CLAUDE.md` → Status and [Coverage Report](../Coverage-Report.md).
- Each phase: plan + file list first → implement in vertical slices → typecheck + tests after each slice → update docs + coverage report before merge.

## Tenancy (the cardinal rule)
- Every tenant-owned table carries an indexed `organizationId`; every query goes through the Prisma guard. This holds even though only PuraLocal exists. See [Authorization](../Security/Authorization.md).

## Audit logging
- Mandatory for: auth events, role/permission changes, content transitions, financial actions, tenant-config changes. Audit entries are org-scoped.

## Content workflow
- All four content types share one `Content` model and one state machine: `Draft → Submitted → Under Review → Needs Changes → Approved → Scheduled → Published → Archived`. Transitions are the only place workflow rules + permissions are enforced, and each writes an audit entry.

## Documentation discipline
- `/Docs` is updated **per phase, before merge**: flip stubs to Implemented, cite real files, refresh diagrams and the [Coverage Report](../Coverage-Report.md). Never document unbuilt code as if it exists. See [the docs prompt](../../docs-generation-prompt.md).

## External services
- Always behind an adapter interface (storage, transcode, streaming, push, payments, social). No provider hardcoded in domain code.

## When in doubt
- If a requirement is ambiguous or conflicts with the tenancy/RBAC invariants, **stop and ask** — do not guess on security or tenancy.

## Related docs
[Coding Standards](./Coding-Standards.md) · [Technical Debt](./Technical-Debt.md) · [Known Limitations](./Known-Limitations.md)

---
_Last updated: Phase 0 scaffold._
