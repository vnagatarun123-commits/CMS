# Documentation Coverage Report

> **Status:** Living document. Refresh at the end of every phase.
> Snapshot date: **Phase 1 complete** (2026-06-26).

## Legend
- **Full** — completely describes current reality.
- **Partial** — some real content + clearly marked pending sections.
- **Stub** — placeholder; `Needs Implementation — Phase N`.

## Coverage table

| Doc | Status | Becomes Full in | Open items |
|---|---|---|---|
| README | Full | — | Keep map current |
| Architecture/System-Overview | Full (intent) | — | Verify stack once Supabase lands |
| Architecture/Architecture-Decisions | Full (intent) | — | Resolve 4 pending ADRs |
| Architecture/Data-Flow | Stub | Phase 1–2 | Real request + job flows |
| Architecture/Component-Diagram | Stub | Phase 1–2 | Real components |
| Architecture/Deployment-Architecture | Needs Investigation | Phase 7 | Hosting/infra not chosen |
| Design-System/Design-Principles | Full (intent) | — | — |
| Design-System/Accessibility | Full (convention) | — | Verified WCAG AA contrast Phase 0 |
| Design-System/Design-Tokens | Partial | Phase 1 | OKLCH vars + status pairs in `app/globals.css`; dark-mode tokens pending (KL-006) |
| Design-System/Colors | Partial | Phase 1 | 8 WCAG AA status badge pairs documented; dark palette pending |
| Design-System/Typography | Partial | Phase 1 | Inter via `--font-sans`; no display face yet |
| Design-System/UI-Components | Partial | Phase 1 | shadcn base-nova components used; no component catalogue written yet |
| APIs/API-Overview·Endpoints·Request-Response-Examples | Stub | Phase 7 (some Phase 1) | From real routes |
| APIs/Authentication | Partial | Phase 0/Supabase swap | Mock impl in `lib/mock/mock-auth.ts`; real Supabase Auth pending |
| APIs/Error-Handling | Full (convention) | — | `ApiEnvelope<T>` + `ErrorCode` in `lib/errors.ts` |
| Data/Database-Schema | Full | — | 4-table schema in `prisma/schema.prisma`; ER diagram + index table |
| Data/Entities·Relationships | Partial | per phase | `UserWithRole`, `AuditEntry`, `Organization` defined |
| Data/Migrations | Full | — | `20260626000000_init` documented; conventions + commands in place |
| Frontend/Application-Structure | Partial | Phase 1 | Route groups `(auth)` + `(dashboard)`; `lib/` seam structure in place |
| Frontend/Routing | Partial | Phase 1 | All Phase 0 routes documented; Phase 1+ stubs remain |
| Backend/Services·Business-Logic | Partial | Phase 2 | `can()`, `withAuth()`, state machine, content/ref-data repos in `lib/`; Phase 2+ features pending |
| Backend/Integrations | Partial | Phase 2+ | Supabase documented; Phase 2+ services still stubs |
| Backend/Background-Jobs | Stub | Phase 2+ | BullMQ + queue abstraction deferred |
| Security/Authorization | Full | — | `ROLE_PERMISSIONS` map, `can()`, `withAuth()`, `withOrgContext`, RLS policies documented |
| Security/Authentication | Full | — | Supabase Auth + JWT cookies + mock fallback fully documented |
| Security/Secrets-Management | Partial | Phase 0/deploy | `.env.example` exists; secret store not yet chosen |
| Security/Security-Considerations | Full (living) | — | Pre-launch checklist up to date |
| Operations/Local-Development | Full | — | Mock + Supabase setup, all scripts, all env vars documented |
| Operations/Deployment·Monitoring | Needs Investigation | Phase 7 | Tooling not chosen |
| Operations/Logging·Troubleshooting | Stub | Phase 0+ | Grows with system |
| Testing/Testing-Strategy | Full (convention) | — | — |
| Testing/Unit-Tests | Partial | Phase 2 | 6 test files in `tests/unit/` — RBAC, mock layer, server actions, tenant guard, state machine, content cross-org isolation |
| Testing/E2E-Tests | Partial | Phase 2 | 3 Phase 0 scenarios in `tests/e2e/phase-0.spec.ts`; Phase 1 content e2e pending |
| Testing/Integration-Tests | Partial | Phase 1+ | RLS enforcement test written (4 scenarios); repo contract tests pending |
| Engineering/Coding-Standards | Full (convention) | — | — |
| Engineering/Project-Conventions | Full (convention) | — | — |
| Engineering/Technical-Debt | Partial | ongoing | 8 entries (TD-001 – TD-008; 5 Phase 0 + 3 Supabase swap) |
| Engineering/Known-Limitations | Partial | ongoing | 12 entries (KL-001 – KL-012; 8 Phase 0 + 3 Supabase swap + 1 Phase 1) |
| Engineering/Future-Enhancements | Stub | ongoing | Not yet started |

## Summary

**Fully documented today:**
README, System-Overview, Architecture-Decisions, Design-Principles, Accessibility,
Error-Handling, Authorization, Security-Considerations, Testing-Strategy,
Coding-Standards, Project-Conventions.

**Partially documented (Phase 0 content present):**
Design-Tokens, Colors, Typography, UI-Components, Authentication (mock), Frontend/*,
Backend/Services, Unit-Tests, E2E-Tests, Technical-Debt, Known-Limitations,
Entities/Relationships, Secrets-Management, Local-Development.

**Missing / correctly stubbed (pending Phase 1+):**
Data-Flow, Component-Diagram, all APIs/Endpoints detail, Background-Jobs,
Database-Schema, Migrations, Integration-Tests, Future-Enhancements.

**Needs Investigation (infrastructure decisions):**
Deployment-Architecture, Deployment, Monitoring, secret store, public-API style,
payment + streaming providers.

## Recommended next documentation priorities

1. **Supabase swap:** flip Database-Schema, Migrations, Authentication from stub/partial
   to full once real Prisma schema and Supabase Auth are wired.
2. **Resolve 4 pending ADRs** (hosting, public-API style, payments, streaming) before
   the phases that need them.
3. **Phase 2:** Media pipeline (image/video/shorts/live), scheduling job, Supabase Storage adapter.
4. Add a dark-mode token set to close KL-006 and flip Design-Tokens + Colors to Full.

---
_Last updated: Phase 1 complete (2026-06-26)._
