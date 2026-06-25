# PuraLocal CMS — Engineering Documentation

> **Status:** Living index. This `/Docs` tree is the authoritative engineering memory for the project.

This documentation is maintained **docs-as-you-go**. Because the system is built in phases
(see `CLAUDE.md` → Status), each document is in one of these states:

| Badge | Meaning |
|---|---|
| **Implemented** | Describes code that exists today; claims cite real files. |
| **Partially Implemented** | Some of the subject exists; the rest is marked pending. |
| **Needs Implementation — Phase N** | Not built yet; stub describes intended scope only. |
| **Needs Investigation** | A decision or detail is unresolved; the open question is stated. |

> **Golden rule:** never document code that does not exist yet. See [the documentation prompt](../docs-generation-prompt.md) and `CLAUDE.md`.

## How to navigate

- **New to the project?** Start with [Architecture / System Overview](./Architecture/System-Overview.md), then [Data / Database Schema](./Data/Database-Schema.md) and [Security / Authorization](./Security/Authorization.md).
- **Setting up locally?** [Operations / Local Development](./Operations/Local-Development.md).
- **Writing code?** [Engineering / Coding Standards](./Engineering/Coding-Standards.md) and [Project Conventions](./Engineering/Project-Conventions.md).
- **What's done vs. pending?** [Coverage Report](./Coverage-Report.md).

## Map

| Area | Purpose |
|---|---|
| [Architecture](./Architecture/) | System shape, decisions (ADRs), data flow, components, deployment. |
| [Design-System](./Design-System/) | Principles, components, tokens, accessibility. |
| [APIs](./APIs/) | Internal server actions + (Phase 7) public/mobile API. |
| [Data](./Data/) | Prisma schema, entities, relationships, migrations. |
| [Frontend](./Frontend/) | App structure, state, routing, UI patterns. |
| [Backend](./Backend/) | Services, business logic, integrations, background jobs. |
| [Security](./Security/) | AuthN, AuthZ, secrets, threat considerations. |
| [Operations](./Operations/) | Local dev, deployment, monitoring, logging, troubleshooting. |
| [Testing](./Testing/) | Strategy, unit, integration, e2e. |
| [Engineering](./Engineering/) | Standards, conventions, tech debt, limitations, future work. |

## Maintenance contract

At the **end of every phase, before merging**, update the docs the phase's code touched, flip
the relevant stubs to "Implemented", and refresh [Coverage-Report.md](./Coverage-Report.md).
This is enforced as a working rule in `CLAUDE.md`.

---
_Last updated: Phase 0 scaffold._
