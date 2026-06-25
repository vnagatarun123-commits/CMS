# Documentation Prompt (Greenfield / docs-as-you-go) — paste into Claude Code

> Use this in TWO ways:
> 1. **Once, now:** to create the `/Docs` scaffold (honest content where it exists, stubs elsewhere).
> 2. **At the end of every phase:** to update the docs affected by the code just written.
>
> This is the greenfield adaptation of the classic "analyze the codebase and document it"
> prompt. The original assumes a finished system; we are building incrementally, so the
> golden rule is: **document what the code actually does today — never describe code that
> does not exist yet.**

---

## Role

Act as a Senior Principal/Staff Engineer, Software Architect, and Technical Documentation Lead for the PuraLocal CMS.

## Context

Read `CLAUDE.md` first — it is the source of architectural intent. The codebase is being built in phases (see the Status checklist in `CLAUDE.md`). The `/Docs` directory is the project's engineering memory and must stay aligned with the actual code at all times.

## THE ANTI-FICTION RULE (most important)

- **Only document what exists in the codebase right now.** If a feature is planned but not built, do NOT describe it as if it exists.
- For anything not yet implemented, write a stub with the exact marker: `> **Status:** Needs Implementation — Phase N` and a one-line note of the intended scope (sourced from `CLAUDE.md` / the roadmap), nothing more.
- For anything implemented but unclear/undecided, mark it: `> **Status:** Needs Investigation` and state the specific open question.
- Distinguish three states everywhere: **Implemented** (describe from code, cite files), **Planned** (stub + phase), **Unclear** (Needs Investigation).
- Extract from the code — open the files, read the Prisma schema, the routes, the components — do not infer. Every "Implemented" claim must cite a real file path.

## Mode A — Initial scaffold (run once now)

1. Create the full `/Docs` folder structure exactly as specified below.
2. For each file: if its subject is already implemented (e.g. coding standards, architecture intent, planned data model from `CLAUDE.md`), write real content and cite sources. If not yet built, write the `Needs Implementation — Phase N` stub.
3. Cross-link related documents (relative Markdown links).
4. Produce `/Docs/Coverage-Report.md` (see format below).

## Mode B — Per-phase update (run at the end of each phase, BEFORE merging)

1. Identify which `/Docs` files the phase's code affects (e.g. Phase 1 Content → `Data/*`, `APIs/Endpoints.md`, `Backend/Business-Logic.md`, `Frontend/*`).
2. Update those files from the actual code just written: real file references, real schema, real endpoints, real component names.
3. Flip the relevant stubs from "Needs Implementation" to "Implemented".
4. Add/refresh Mermaid diagrams where they aid understanding (data flow, ER, state machine, sequence).
5. Update `/Docs/Coverage-Report.md`.
6. Note any new technical debt in `Engineering/Technical-Debt.md` and limitations in `Engineering/Known-Limitations.md`.

## Required structure

```
Docs/
├── README.md                      # index + how to navigate, contributor guide
├── Coverage-Report.md             # what's documented vs pending (see format)
├── Architecture/
│   ├── System-Overview.md
│   ├── Architecture-Decisions.md  # ADR log
│   ├── Data-Flow.md
│   ├── Component-Diagram.md
│   └── Deployment-Architecture.md
├── Design-System/
│   ├── Design-Principles.md
│   ├── UI-Components.md
│   ├── Typography.md
│   ├── Colors.md
│   ├── Spacing.md
│   ├── Accessibility.md
│   └── Design-Tokens.md
├── APIs/
│   ├── API-Overview.md
│   ├── Endpoints.md
│   ├── Authentication.md
│   ├── Request-Response-Examples.md
│   └── Error-Handling.md
├── Data/
│   ├── Database-Schema.md
│   ├── Entities.md
│   ├── Relationships.md
│   └── Migrations.md
├── Frontend/
│   ├── Application-Structure.md
│   ├── State-Management.md
│   ├── Routing.md
│   └── UI-Patterns.md
├── Backend/
│   ├── Services.md
│   ├── Business-Logic.md
│   ├── Integrations.md
│   └── Background-Jobs.md
├── Security/
│   ├── Authentication.md
│   ├── Authorization.md
│   ├── Secrets-Management.md
│   └── Security-Considerations.md
├── Operations/
│   ├── Local-Development.md
│   ├── Deployment.md
│   ├── Monitoring.md
│   ├── Logging.md
│   └── Troubleshooting.md
├── Testing/
│   ├── Testing-Strategy.md
│   ├── Unit-Tests.md
│   ├── Integration-Tests.md
│   └── E2E-Tests.md
└── Engineering/
    ├── Coding-Standards.md
    ├── Project-Conventions.md
    ├── Technical-Debt.md
    ├── Known-Limitations.md
    └── Future-Enhancements.md
```

## Per-document requirements

- A one-line **Status** badge at the top: Implemented / Partially Implemented / Needs Implementation — Phase N / Needs Investigation.
- "What exists today" described from code, with **file/directory references**.
- Mermaid diagrams where they help (ER, sequence, state, flow).
- Architectural patterns + rationale; dependencies + external services.
- Examples taken from the actual implementation (not invented).
- A "Risks / tech debt / improvements" note where relevant.
- Cross-links to related docs.
- A "Last updated: <phase / date>" footer.

## Coverage-Report.md format

A table of every doc with: Area | Status (Full / Partial / Stub) | Source phase | Open items. Followed by four short lists: Fully documented, Partially documented, Missing/Pending, and Recommended next documentation priorities.

## Success criteria

`/Docs` is the authoritative source of truth: a new senior engineer can understand the architecture, design system, APIs, data model, ops workflows, and dev practices that **currently exist** — and can see exactly what is still pending and in which phase — without tribal knowledge, and without being misled by descriptions of unbuilt features.
