# Documentation Coverage Report

> **Status:** Living document. Refresh at the end of every phase.
> Snapshot date: **Phase 0 scaffold** (no application code written yet).

This report is honest about a greenfield reality: most docs are intentionally stubs, because
their subject matter does not exist in code yet. "Full" below means "fully describes what
exists today" — for convention/intent docs that is achievable now; for code-describing docs
it is not.

## Legend
- **Full** — completely describes current reality (intent or convention that is already fixed).
- **Partial** — some real content + clearly marked pending sections.
- **Stub** — placeholder; `Needs Implementation — Phase N` or `Needs Investigation`.

## Coverage table

| Doc | Status | Becomes Full in | Open items |
|---|---|---|---|
| README | Full | — | Keep map current |
| Architecture/System-Overview | Full (intent) | — | Verify stack once scaffolded |
| Architecture/Architecture-Decisions | Full (intent) | — | Resolve 4 pending ADRs |
| Architecture/Data-Flow | Stub | Phase 0–2 | Real request + job flows |
| Architecture/Component-Diagram | Stub | Phase 0–2 | Real components |
| Architecture/Deployment-Architecture | Needs Investigation | Phase 7 | Hosting/infra not chosen |
| Design-System/Design-Principles | Full (intent) | — | — |
| Design-System/Accessibility | Full (convention) | — | Add verified a11y checks |
| Design-System/UI-Components | Stub | Phase 0–1 | From shadcn usage |
| Design-System/Typography·Colors·Spacing·Design-Tokens | Stub | Phase 0 | From Tailwind config |
| APIs/API-Overview·Endpoints·Request-Response-Examples | Stub | Phase 7 (some Phase 0–1) | From real routes |
| APIs/Authentication | Stub (intent strong) | Phase 0/7 | From Auth.js impl |
| APIs/Error-Handling | Full (convention) | — | Extend code catalog |
| Data/Database-Schema | Partial | Phase 0 | Verify vs `prisma/schema.prisma` |
| Data/Entities·Relationships | Partial | per phase | Grows with models |
| Data/Migrations | Stub | Phase 0 | From migration history |
| Frontend/* | Stub | Phase 0–1 | From app/ structure |
| Backend/Services·Business-Logic | Stub | Phase 0–1 | From lib/ |
| Backend/Integrations·Background-Jobs | Stub | Phase 2+ | From adapters/queues |
| Security/Authorization | Full (intent) | — | Verify role→perm map vs code |
| Security/Authentication | Stub (intent) | Phase 0 | From impl |
| Security/Secrets-Management | Partial | Phase 0/deploy | Secret store TBD |
| Security/Security-Considerations | Full (living) | — | Run pre-launch checklist |
| Operations/Local-Development | Partial | Phase 0 | Verify commands vs README |
| Operations/Deployment·Monitoring | Needs Investigation | Phase 7 | Tooling not chosen |
| Operations/Logging·Troubleshooting | Stub | Phase 0+ | Grows with system |
| Testing/Testing-Strategy | Full (convention) | — | — |
| Testing/Unit·Integration·E2E | Stub | Phase 0+ | From actual tests |
| Engineering/Coding-Standards | Full (convention) | — | — |
| Engineering/Project-Conventions | Full (convention) | — | — |
| Engineering/Technical-Debt·Known-Limitations·Future-Enhancements | Living | ongoing | Add entries per phase |

## Summary

**Fully documented today (convention/intent that is already fixed):**
README, System-Overview, Architecture-Decisions, Design-Principles, Accessibility,
Error-Handling, Authorization, Security-Considerations, Testing-Strategy, Coding-Standards,
Project-Conventions.

**Partially documented:**
Database-Schema, Entities, Relationships, Secrets-Management, Local-Development.

**Missing / pending code (correctly stubbed):**
All APIs/Endpoints detail, Frontend/*, Backend/*, Background-Jobs, Migrations, Unit/Integration/E2E specifics, Design tokens/components.

**Needs Investigation (decisions, not code):**
Deployment-Architecture, Deployment, Monitoring, secret store, public-API style (REST vs GraphQL), payment + streaming providers.

## Recommended next documentation priorities

1. **End of Phase 0:** flip Database-Schema → Implemented (verify vs `prisma/schema.prisma`), fill Migrations, Security/Authentication, Frontend/Application-Structure + Routing, Operations/Local-Development (verify commands), Testing/Unit + E2E, design tokens from Tailwind.
2. **Resolve the 4 pending ADRs** (hosting, public-API style, payments, streaming) before the phases that need them — don't let them become silent assumptions.
3. **End of Phase 1:** Content data model, Business-Logic (state machine), Endpoints, UI-Patterns.
4. Keep Technical-Debt / Known-Limitations updated **every** phase — the no-op email adapter and pinned single-org are the first two entries to add.

---
_Last updated: Phase 0 scaffold._
