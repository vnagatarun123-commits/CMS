# Architecture Decisions (ADR Log)

> **Status:** Implemented (intent). These ADRs capture decisions made in `CLAUDE.md`. Add a new ADR whenever a significant decision is made; never rewrite a shipped ADR — supersede it.

ADR format: Status · Context · Decision · Consequences.

---

## ADR-0001 — Next.js + Postgres + Prisma as the core stack
- **Status:** Accepted
- **Context:** Need one codebase for an admin dashboard + API, with strong TypeScript ergonomics and a relational data model.
- **Decision:** Next.js App Router (TS strict), PostgreSQL, Prisma ORM. Tailwind + shadcn/ui for UI.
- **Consequences:** Server components + server actions are the default data path; TanStack Query only for interactive client tables. Strong type flow from Prisma + Zod.

## ADR-0002 — Keep the tenant column now, defer the multi-tenant surface
- **Status:** Accepted
- **Context:** Product is white-label SaaS eventually, but we ship PuraLocal first. Retrofitting tenancy onto a single-org schema is a costly, risky data-layer rewrite.
- **Decision:** Every tenant-owned table carries a non-null indexed `organizationId` from day one; a Prisma client extension enforces org-scoping on every query. But org onboarding, branding, custom domains, RLS, and the org switcher are deferred to the final phase. A single org (PuraLocal) is seeded and pinned.
- **Consequences:** Small cost now (one column + a guard). White-label later becomes additive UI + routing, not a migration. Cross-org denial tests run from Phase 0 even with one org.

## ADR-0003 — Capability-based RBAC, not role-name checks
- **Status:** Accepted
- **Context:** 11 roles with overlapping access; scattered `if (role === ...)` checks rot quickly.
- **Decision:** A `Permission` enum + one role→permission map + a single `can(user, permission)` helper. A `withAuth` wrapper enforces authenticated → correct org → permission, in that order.
- **Consequences:** Authorization is testable and centralized; adding a role is a mapping change.

## ADR-0004 — One Content model + one workflow state machine
- **Status:** Accepted
- **Context:** Four content types (image, video, short, live) share an identical lifecycle.
- **Decision:** A single `Content` model with a `type` discriminator; one state machine `Draft → Submitted → Under Review → Needs Changes → Approved → Scheduled → Published → Archived` with per-transition permission checks and audit entries.
- **Consequences:** No parallel modules to keep in sync; transitions are the single place to enforce rules.

## ADR-0005 — Zod at every boundary; types flow from schemas
- **Status:** Accepted
- **Decision:** All external input validated with Zod at API routes, server actions, and forms. Types derive from Zod + Prisma — no duplicated hand-written types.
- **Consequences:** Runtime safety at the edge; fewer type drift bugs.

## ADR-0006 — Background jobs via BullMQ + Redis (from Phase 2)
- **Status:** Accepted (deferred to Phase 2)
- **Decision:** Scheduled publishing, media processing, notifications, and analytics rollups run as idempotent, retryable queue jobs with dead-letter handling.
- **Consequences:** Redis becomes an infra dependency from Phase 2.

## ADR-0007 — External services behind interfaces
- **Status:** Accepted
- **Decision:** Object storage, video/transcode, streaming, push, payments, and social publishing are accessed through adapter interfaces; no provider hardcoded.
- **Consequences:** Providers are swappable; tests use fakes; no vendor lock-in in domain code.

## Open / pending decisions (Needs Investigation)
- **ADR-TBD — Hosting & deployment target** (before Phase 7): platform, Postgres host, Redis, object storage, CI/CD. See [Deployment Architecture](./Deployment-Architecture.md).
- **ADR-TBD — Public API style** (Phase 7): REST vs GraphQL for the mobile app.
- **ADR-TBD — Payment provider** (Phase 5).
- **ADR-TBD — Streaming/transcode provider** (Phase 2/3).

## Related docs
[System Overview](./System-Overview.md) · [Authorization](../Security/Authorization.md) · [Technical Debt](../Engineering/Technical-Debt.md)

---
_Last updated: Phase 0 scaffold._
