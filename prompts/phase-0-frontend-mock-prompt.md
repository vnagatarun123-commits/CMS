# Phase 0 Prompt — Frontend-first with mocked backend (Supabase later)

> This REPLACES the original Phase 0 prompt for our chosen approach: build the dashboard UI
> now against an in-memory mock, behind a clean seam, and swap in Supabase (Auth + Postgres +
> Storage) in a later slice WITHOUT rewriting components. Put `CLAUDE.md` at the repo root
> first, then paste everything below the line into Claude Code.

---

## Role

Act as a **Senior Frontend Architect / Staff Software Engineer**. You own the long-term health of this codebase: you set up a clean, conventional, scalable project structure; you enforce separation of concerns (UI vs. domain vs. data); you favor small, typed, testable modules; and you do not take shortcuts that create rework later. Explain your structural decisions briefly as you make them.

You are building Phase 0 (Foundation, frontend-first) of the PuraLocal CMS. Read `CLAUDE.md` first; treat §2 (build approach: mock behind a seam), §3 (tenancy), and §4 (RBAC) as hard constraints. We are building the dashboard UI now against an in-memory mock and will swap in Supabase later. Output a brief plan + file list before coding, then implement in vertical slices that compile and pass tests.

## Tooling — recommend before you build

Before writing code, in your plan, tell me which of the following would improve output, and ask me to install/connect anything you need. Do NOT silently skip this.

- **Skills** you intend to use (e.g. a design/UI skill, a component-generation or shadcn skill, a testing skill). List the ones relevant to a Next.js + Tailwind + shadcn/ui dashboard and say what each buys us.
- **MCP servers / connectors** that would help — e.g. shadcn/ui component registry, Supabase (for the later swap slice), Playwright for e2e, Figma if we have designs. For each, say whether it's needed now (mock phase) or later (Supabase swap).
- **Plugins** worth installing for this stack.
- If something would meaningfully improve quality but isn't installed, **ask me to add it** and explain why. If you can proceed well without it, say so and proceed.

Use installed design/development skills where they raise quality (consistent components, accessible patterns, design tokens). Don't reinvent what a skill already does well.

## Project structure (scaffold to this layout)

Use this directory structure. Keep UI, domain logic, and data access strictly separated — components never import the mock or Supabase directly, only the `lib/` interfaces.

```
puralocal-cms/
├── app/                          # Next.js App Router (routes only — thin)
│   ├── (auth)/                   # public routes: login
│   │   └── login/page.tsx
│   ├── (dashboard)/              # authenticated route group
│   │   ├── layout.tsx            # authenticated shell (nav + topbar)
│   │   ├── page.tsx              # dashboard home
│   │   ├── content/page.tsx      # placeholder (later phase)
│   │   ├── reporters/page.tsx    # placeholder
│   │   ├── users/page.tsx        # placeholder
│   │   ├── ads/page.tsx          # placeholder
│   │   ├── notifications/page.tsx# placeholder
│   │   ├── analytics/page.tsx    # placeholder
│   │   ├── audit-log/page.tsx    # WORKING (reads mock)
│   │   └── settings/
│   │       └── users-roles/page.tsx  # WORKING (list/invite/assign)
│   ├── actions/                  # server actions (call lib/, never the mock directly)
│   ├── layout.tsx                # root layout
│   └── globals.css
├── components/                   # presentational + shared UI
│   ├── ui/                       # shadcn/ui generated components
│   ├── layout/                   # nav, topbar, sidebar
│   └── shared/                   # data table, status badge, page header, etc.
├── lib/                          # domain + data layer (NO React/JSX here)
│   ├── auth/
│   │   ├── auth-provider.ts      # AuthProvider interface
│   │   └── session.ts            # active user + org context
│   ├── data/
│   │   └── repositories.ts       # repository interfaces (org-scoped)
│   ├── rbac/
│   │   ├── permissions.ts        # Permission enum + role→permission map
│   │   └── can.ts                # can() / requirePermission / withAuth
│   ├── mock/                     # in-memory implementations + seed
│   │   ├── seed.ts
│   │   ├── mock-auth.ts
│   │   └── mock-repositories.ts
│   ├── supabase/                 # EMPTY for now — // TODO(supabase) same interfaces
│   ├── errors.ts                 # typed errors + standard error envelope
│   └── backend.ts                # factory: picks mock|supabase via DATA_BACKEND
├── types/                        # shared types (derived from Zod where possible)
├── tests/
│   ├── unit/                     # Vitest (guard, can(), state)
│   └── e2e/                      # Playwright
├── .env.example
├── docker-compose.yml            # (added with the Supabase/local DB slice)
├── package.json
└── README.md
```

If a better-justified structural choice exists, propose it in your plan before deviating — but keep the UI / domain / data separation intact.

## Hard rule for this phase

The UI, server actions, and the `can()` permission helper must depend ONLY on interfaces in `lib/` — **never** import Supabase or the mock directly. No fake users or fake data hardcoded inside components. All mock data lives behind the seam. When we later add Supabase, the only new code is a second implementation of those same interfaces selected by `DATA_BACKEND=supabase`.

## Goal of Phase 0

1. Project scaffold (Next.js App Router, TS strict, Tailwind, shadcn/ui, Zod, Vitest, Playwright, pnpm).
2. An **auth provider interface** + a **mock auth provider** (login as any seeded role).
3. A **data-access layer** (repository interfaces) + a **mock in-memory implementation**, seeded with the PuraLocal org and one user per role.
4. The **tenant guard** enforced inside the data layer (inject `organizationId`, throw if missing) — proven by tests now, even with one org.
5. Capability-based **RBAC** (`Permission` enum, role→permission map, single `can()` helper, `withAuth` wrapper).
6. A working, role-aware **dashboard shell**: login screen (mock), authenticated layout, permission-gated nav, and two working screens — **Audit Log** (reads from mock) and **Settings → Users & Roles** (list/invite/assign against the mock).
7. Tests, including the **cross-org denial** test against the mock.

Do NOT build content, reporters, ads, analytics, the public API, real Supabase wiring, or any multi-tenant management UI yet. Stub the other modules in the nav, gated by permission.

## 1. The seam (most important deliverable)

Create in `lib/`:
- `lib/auth/auth-provider.ts` — an `AuthProvider` interface: `getCurrentUser()`, `signIn(email, password)`, `signOut()`, current session/org context.
- `lib/data/repositories.ts` — repository interfaces: at minimum `OrganizationRepository`, `UserRepository`, `RoleAssignmentRepository`, `AuditLogRepository`. Each method is org-scoped via an injected context; the layer throws `MissingOrgContextError` if org context is absent.
- `lib/backend.ts` — a factory that returns the active implementations based on `process.env.DATA_BACKEND` (`mock` | `supabase`). Today only `mock` is wired; leave a clearly-marked `// TODO(supabase)` branch.
- `lib/mock/*` — the in-memory implementations + a deterministic seed (PuraLocal org; one user per role: ORG_ADMIN, EDITOR, CONTENT_REVIEWER, REPORTER_MANAGER, AD_MANAGER, MARKETING_MANAGER, FINANCE_MANAGER, SUPPORT_EXECUTIVE, ANALYTICS_VIEWER, REPORTER; plus a platform SUPER_ADMIN).

## 2. RBAC

- `Permission` enum covering all roles (`content:edit`, `content:review`, `content:publish`, `reporters:manage`, `ads:manage`, `users:view`, `finance:view`, `analytics:view`, `org:configure`, `platform:manage`, …).
- One source-of-truth role→permission map.
- A single `can(user, permission)` / `requirePermission` helper used everywhere. Never `if (role === ...)`.
- A `withAuth` wrapper for server actions/routes enforcing, in order: authenticated → correct org → permission; returns the standard error shape `{ error: { code, message } }` on failure.

## 3. Dashboard shell (UI)

- Mock **login** screen: pick/sign in as any seeded user so every role can be demoed.
- Authenticated layout: top bar (user menu — NO org switcher yet) + left nav.
- Nav for all modules (Content, Reporters, Users, Ads & Monetization, Notifications, Analytics, Settings, Audit Log), each shown only if the user has the relevant permission. No white-label/Organizations item yet.
- Working screens (against the mock): **Audit Log** viewer (filter by action/date) and **Settings → Users & Roles** (list users, invite, assign role) — every mutation writes a mock audit entry.
- Other modules: "Coming in a later phase" placeholder pages.
- Responsive for desktop + tablet. Use shadcn/ui primitives; keyboard-navigable.

## 4. Tests (definition of done)

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all pass.
- Unit: tenant guard injects org + throws on missing context; `can()` matrix across roles.
- E2E (Playwright): sign in as Org Admin → invite user → assign role → see audit entry; sign in as a low-permission role → confirm gated nav.
- **Cross-org denial test** against the mock (seed a second throwaway org in the test only) proving the repository layer never returns a foreign org's row.
- `.env.example` includes `DATA_BACKEND=mock` and placeholders for future Supabase vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`).
- README explains the mock-now / Supabase-later seam and how to run.
- Update the Status checklist + relevant `/Docs` files (System-Overview, Authorization, Coding-Standards already exist; flip/extend as needed).

## What comes AFTER this phase (do not build now)

A dedicated **"Supabase swap" slice**: implement the same interfaces with Supabase Auth + Prisma-against-Supabase-Postgres + Supabase Storage, add Prisma schema + migrations mirroring the mock models, add **RLS policies** on tenant-owned tables, flip `DATA_BACKEND=supabase`, and re-run the exact same test suite (including cross-org denial) — now against real infra. Because the UI only touches interfaces, this slice adds files; it does not rewrite screens.

Start by printing your plan and file list. Then implement. After each slice, run typecheck + tests and report results.
