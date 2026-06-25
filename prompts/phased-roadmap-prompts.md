# PuraLocal CMS — Phased Build Roadmap (PuraLocal-first)

We build PuraLocal as org #1 and ship a working product, THEN add the white-label surface
at the end. The `organizationId` column + query guard exist from Phase 0, so the final
white-label phase is additive (build UI on top), not a data-layer rewrite.

Read this after Phase 0 is green. Each phase is a separate Claude Code session/prompt.
**Do not skip ahead.** Each phase assumes the previous one is merged and tests pass.

For every phase, open with this preamble:

> "Read `CLAUDE.md`. Treat the §3 tenancy invariants and §4 RBAC as hard constraints.
> We are building PuraLocal as org #1; keep the `organizationId` column + query guard but
> do NOT build any multi-tenant management surface (deferred to the final phase). Phases
> 0..N-1 are done. Output a plan + file list first, implement in vertical slices, run
> typecheck + tests after each slice, and add the cross-org denial test for every new
> resource. Stop and ask if anything conflicts with the invariants."

---

## Phase 1 — Content module + workflow state machine (the core)

One `Content` model, one lifecycle, four types.

- `Content` model: `type` (IMAGE | VIDEO | SHORT | LIVE), status, language, category, location, reporter, scheduledAt, publishedAt, body/media relations. All carry `organizationId`.
- Per-org reference data this needs: **Languages**, **Locations**, **Categories** (seed PuraLocal's set; simple CRUD for Org Admin).
- State machine: `Draft → Submitted → Under Review → Needs Changes → Approved → Scheduled → Published → Archived`, with allowed transitions + per-transition permission checks + audit log.
- Single Content list view with filters (type, status, language, category, location, reporter, date) and contextual actions per status.
- Editor UI (create/edit), review UI (approve / request changes with notes).
- Tests: full transition matrix, illegal-transition rejection, permission enforcement, cross-org denial.

Done when: an Editor drafts and submits, a Reviewer approves or requests changes, content can be scheduled and published, all transitions logged.

---

## Phase 2 — Media pipeline & scheduling/publishing

- Storage interface (S3-compatible): image upload + derivatives, video transcode job, shorts, live stream config (ingest URL / stream key behind a provider interface).
- Background jobs (BullMQ + Redis): media processing, scheduled publishing (publish at `scheduledAt`), archival.
- Publish job idempotent; retries; dead-letter handling.

Done when: scheduling a post actually publishes it at the set time via a worker, and media derivatives generate asynchronously.

---

## Phase 3 — Reporters

- Onboarding + verification (document upload, approval workflow).
- Assignments (beats/locations/topics), performance metrics (volume, approval rate, engagement), and an **earnings** ledger (per-content or per-performance payout rules).
- Reporter Manager dashboards; Finance Manager earnings view.
- Earnings calculations auditable and org-scoped.

Done when: a reporter is onboarded, verified, assigned work, and accrues earnings tied to published content.

---

## Phase 4 — Users & engagement

- App end-user model (distinct from CMS staff), org-scoped.
- Engagement event ingestion (views, reads, shares) + rollup jobs.
- User list, segments, basic engagement views.

Done when: app users and engagement events are stored per org and visible in the CMS.

---

## Phase 5 — Monetization, notifications, social publishing

- **Ads:** ad units, campaigns, placement rules, scheduling, basic delivery/reporting; Ad Manager UI.
- **Subscriptions:** plans, subscriber records, entitlement checks (payment provider behind an interface).
- **Notifications:** push/in-app composition + scheduling via jobs.
- **Social publishing:** publish-to-social adapters behind an interface (no real keys committed).

Done when: an Ad Manager runs a campaign, a subscription gates content, and publishing can fan out a notification + social post.

---

## Phase 6 — Analytics & business intelligence

- Aggregation jobs producing per-org rollups (content performance, engagement, revenue, operational KPIs).
- Dashboards for Analytics Viewer / Marketing / Finance, permission-respecting.
- CSV export, date-range filtering. Keep heavy queries off the transactional path (read models / materialized views).

Done when: PuraLocal sees accurate dashboards for content, engagement, and revenue.

---

## Phase 7 — Public/mobile API + hardening

- Versioned REST (or GraphQL) API for the PuraLocal app: auth (JWT), content feeds by location/language/category, engagement ingestion, subscription/entitlement checks.
- Rate limiting, validation, pagination, caching headers.
- Security pass: cross-org fuzz tests, dependency audit, secrets check.
- Load test feed + ingestion; document scaling assumptions.

Done when: the PuraLocal mobile client can authenticate, fetch its feed, and post engagement events, with rate limits and isolation verified.

---

## Phase 8 — White-label / multi-tenant surface (the deferred work)

NOW you turn the single-org product into a sellable white-label SaaS. Because every table
already has `organizationId` and every query is guarded, this is additive UI + routing —
not a data migration.

- **Org onboarding / CRUD** (Super Admin): create org, assign Org Admin, suspend/activate.
- **Per-tenant branding/theming:** logo, colors, theme; applied to dashboard and app feeds.
- **Custom domain + subdomain routing:** replace the Phase 0 org-resolution seam internals so the active org comes from the host. No business-logic changes.
- **Enabled-module flags** per org (turn features on/off per client).
- **Org switcher** + Super Admin "act as org" (audit-logged).
- **Postgres Row-Level Security:** add policies on tenant-owned tables keyed on a per-connection GUC, as defense-in-depth on top of the Prisma guard.
- **Onboard a second real/demo org** and run the full cross-org isolation + fuzz suite to prove true tenant separation before selling.

Done when: a Super Admin spins up a second tenant with its own branding, domain, categories, locations, and users — and that tenant cannot see PuraLocal's data through any code path.

---

## How to drive this in VS Code / Claude Code

1. `CLAUDE.md` at repo root, committed first.
2. Paste the **Phase 0 prompt**, let it plan, implement, review and commit each slice.
3. Only when Phase 0 is green (typecheck + tests + e2e), start a fresh session for Phase 1 using the preamble + the Phase 1 section.
4. Keep phases on separate branches/PRs. Run `/review` and `/security-review` before merging — `/security-review` especially before Phase 7 and Phase 8.
5. If a phase is too big, split it (e.g. Phase 1 → "model + state machine" then "list/filter UI" then "review UI").
6. Re-run the cross-org denial tests every phase. This is the discipline that keeps Phase 8 easy instead of a rewrite.

### Why this ordering
You ship a real, working PuraLocal product first and prove it, instead of building an
abstract multi-tenant platform with no live app. But you pay the one cheap cost now —
the `organizationId` column and query guard — so the white-label conversion in Phase 8 is
building screens, not rewriting the database under live data.
