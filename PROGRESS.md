# PROGRESS — PuraLocal CMS (session handoff)

> Keep this file at the repo root. It is the "save state" for the project.
> **Update it at the end of every working session** (or have Claude Code update it as the
> last step of each sub-slice). To resume work, a fresh Claude Code session reads this +
> CLAUDE.md + `git log` and continues — no need to rely on saved chat history.

---

## Where we are right now
- **Current phase:** Phase 1 — Content module
- **Current sub-slice:** _(e.g. "Sub-slice A: reference data — in progress")_
- **Last thing completed:** _(e.g. "Supabase swap done, all tests green, committed `<hash>`")_
- **Next action:** _(e.g. "Start Sub-slice B: Content model + migration")_

## Done so far
- [x] Phase 0 — foundation (scaffold, RBAC, mock, dashboard shell, design system, login, Audit Log, Users & Roles). Tests green.
- [x] Supabase swap — real Auth + Postgres + RLS, seeded, tests green.
- [ ] Phase 1 — Content module (in progress)
- [ ] Phase 2 — Media pipeline + scheduling/publishing
- [ ] Phase 3 — Reporters
- [ ] Phase 4 — Users & engagement
- [ ] Phase 5 — Monetization + notifications + social
- [ ] Phase 6 — Analytics
- [ ] Phase 7 — Public/mobile API + hardening
- [ ] Phase 8 — White-label / multi-tenant surface

## Key decisions locked (so they don't get re-litigated)
- Stack: Next.js + Supabase (Auth + Postgres + Storage) + Prisma + Tailwind/shadcn.
- Build approach: behind the data seam (interfaces + mock + supabase impls); both backends kept working.
- Tenancy: `organizationId` everywhere + `assertOrg` (primary) + RLS via `prisma_app` role (defense-in-depth). PuraLocal = org #1; white-label surface deferred to Phase 8.
- Content workflow: 5 statuses — DRAFT, UNDER_REVIEW, NEEDS_CLARIFICATION, SCHEDULED, PUBLISHED. APP uploads → always UNDER_REVIEW; CMS authors pick any status. Reporters excluded from CMS create. Lightweight clarification loop (reviewer publishes or rejects-to-Draft after author reply).
- Content types: IMAGE, VIDEO, SHORT, LIVE, YOUTUBE. YouTube is link/embed (fully in Phase 1); other media UPLOAD is Phase 2.
- Reference data: Category / Language / Location, each with active-inactive + soft-delete. Location is a 4-level tree: STATE → DISTRICT → MANDAL → VILLAGE. Cascading dropdowns reused everywhere. Seed States+Districts + default languages (Telugu/Hindi/English+); Mandals/Villages on demand.
- Verification: Claude Code runs typecheck + unit + e2e itself AND hands each slice to the user for manual check.

## Open decisions / parking lot
- Seed passwords are all `password` (dev only) — must be replaced before any non-local deploy. (Tech debt.)
- CMS direct-publish is open to all content creators today — may tighten to Editor/Publisher later.
- Mandal/Village bulk import needs a real dataset (e.g. govt LGD) — later task.

## How to resume next session
1. Open the project in VS Code, start Claude Code.
2. Paste: _"Read CLAUDE.md and PROGRESS.md, and check `git log --oneline -10`. Tell me where we are and what the next sub-slice is, then wait for my go-ahead."_
3. Confirm its summary matches this file, then approve the next slice.
