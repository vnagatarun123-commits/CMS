# Design Principles

> **Status:** Implemented (intent) — applied as the dashboard is built (Phase 0+). Source: product spec design principles + `CLAUDE.md`.

## Principles

1. **Workflow-driven, not feature-driven navigation.** Organize around what users are trying to accomplish (review content, manage reporters), not around a flat list of features.
2. **Minimal top-level modules, powerful filtering.** Few nav items; depth comes from contextual filters and actions (e.g. one Content list filtered by type/status/language/category/location/reporter/date).
3. **Simple surface, enterprise capability underneath.** Don't overwhelm day-to-day users; advanced power is available but not in the way.
4. **Consistency across modules.** Same table, filter, status-badge, and action patterns everywhere.
5. **Responsive for desktop + tablet.** This is an admin tool, not mobile-first.
6. **Fast with large datasets.** Server-side pagination/filtering; keep heavy queries off the interactive path.
7. **Permission-aware UI.** Users only see modules and actions their role permits (ties to [Authorization](../Security/Authorization.md)).
8. **Accessible by default.** Keyboard-navigable; rely on shadcn/ui accessible primitives. See [Accessibility](./Accessibility.md).

## Implementation notes
- UI built with Tailwind + shadcn/ui only (`CLAUDE.md` §2). No other component library.
- Per-tenant branding/theming is **Phase 8**; until then a single PuraLocal theme.

## Related docs
[UI Components](./UI-Components.md) · [Design Tokens](./Design-Tokens.md) · [Accessibility](./Accessibility.md) · [UI Patterns](../Frontend/UI-Patterns.md)

---
_Last updated: Phase 0 scaffold._
