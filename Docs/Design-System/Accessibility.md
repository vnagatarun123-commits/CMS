# Accessibility

> **Status:** Implemented (convention) — applied from Phase 0. Source: `CLAUDE.md` §6.

## Requirements

- The dashboard is **keyboard-navigable** end to end.
- Use shadcn/ui's accessible primitives (built on Radix); do not hand-roll interactive controls that bypass their a11y behavior.
- Respect focus management in dialogs, menus, and the review flow.
- Color is never the sole signal — status badges pair color with text/icon.
- Forms expose labels, descriptions, and validation errors programmatically (ties to Zod-validated forms).
- Responsive for desktop + tablet without loss of function.

## Verification (add as built)
- Include keyboard-path coverage in Playwright e2e for core flows (login, content review).
- Note any known a11y gaps in [Known Limitations](../Engineering/Known-Limitations.md).

## Related docs
[Design Principles](./Design-Principles.md) · [UI Components](./UI-Components.md)

---
_Last updated: Phase 0 scaffold._
