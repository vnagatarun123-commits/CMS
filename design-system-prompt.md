# Design System Pass — paste into Claude Code (do this as part of / before finishing Slice 5)

You are still the **Senior Frontend Architect**, now also acting as a **Senior Product Designer**. The current UI is too basic. Before building more screens, establish a proper, reusable **design system** so every current and future screen inherits a polished, consistent look. Do NOT polish placeholder pages — invest in the system, the shell, the login, and the real screens (Audit Log, Users & Roles).

Use whatever design/UI skills, the shadcn/ui component registry, and any theming MCP/plugins you have available. Tell me in your plan which you're using.

## Design direction

**Modern SaaS — clean & minimal** (Linear / Vercel / Supabase dashboard feel): generous whitespace, subtle 1px low-contrast borders, minimal shadows, one accent color used sparingly, crisp typography, calm neutral palette. Professional and fast-feeling, not flashy.

## 1. Design tokens (single source of truth — brand-swappable later)

Implement all colors/spacing/type as **CSS variables + Tailwind theme tokens** in `globals.css` / the shadcn theme, so the whole look can be re-skinned (and per-tenant themed in the final phase) by changing tokens in ONE place. No hardcoded hex in components.

Use this tasteful default (you may refine, keep it cohesive):

- **Neutrals:** zinc/slate scale for backgrounds, borders, text (shadcn "neutral" base).
- **Primary accent:** indigo — `#4F46E5` (hover `#4338CA`). Used only for primary actions, active nav, focus rings.
- **Semantic:** success `#16A34A`, warning `#D97706`, destructive `#DC2626`, info `#2563EB`.
- **Surfaces:** app background slightly off-white (`#FAFAFA`), cards pure white, borders `#E4E4E7`.
- **Content-workflow status colors** (reused everywhere later): Draft = zinc, Submitted = blue, Under Review = amber, Needs Changes = orange, Approved = teal, Scheduled = violet, Published = green, Archived = zinc-muted. Define as badge variants now.
- **Radius:** `0.5rem` (medium, subtle). **Shadows:** subtle only (sm/none); no heavy drop shadows.
- Provide **light mode now**; structure tokens so a dark mode can be added later without rework.

## 2. Typography

- Use **Inter** (or Geist) via `next/font` for UI. One family, well-scaled.
- Type scale: page title 24–30px/600, section 18–20px/600, body 14px/400, labels/meta 12–13px/500, tabular numerals for tables.
- Comfortable line-height, slightly tight heading tracking. Document the scale in `Docs/Design-System/Typography.md`.

## 3. Spacing & layout

- 8pt spacing grid (4/8/12/16/24/32...). Consistent page padding and section gaps.
- Max content width on forms/detail; tables go full width.
- A consistent **page shell**: sticky topbar (logo, page title, user menu) + left sidebar nav (grouped, icons via lucide-react, active state in accent, permission-gated) + scrollable content area.

## 4. Component polish (reusable, in components/shared and components/ui)

Add/refine the shadcn components needed and wrap them into consistent patterns:
- **PageHeader** (title + description + primary action slot).
- **DataTable** (TanStack Table): clean header, zebra-free, row hover, sortable, empty state, loading **skeletons**, pagination, sticky header.
- **StatusBadge** (uses the workflow status colors above).
- **Forms**: shadcn Form + Input/Select/Label, inline Zod validation errors, disabled+spinner on submit. Forms open in a **Dialog or Sheet**, not a separate page, for invite/assign.
- **Toasts** (sonner) for action feedback (success/error from the server-action envelope).
- **Empty states** with icon + short copy + action.
- **Avatar + role badge** in the user menu and user lists.
- Consistent focus rings (accent), hover, and disabled states everywhere. Keyboard-navigable.

## 5. The main login page (make this excellent — it's the front door)

There is ONE login for everyone (email + password). Other users are created internally (Users & Roles screen) and see modules based on their access rights — do NOT build per-role login pages.

- Clean centered card on a subtle background, OR a split layout (left: brand panel with logo + one-line value prop on an accent/neutral gradient; right: the form). Pick the more elegant; keep it minimal.
- Logo placeholder ("PuraLocal") wired as a swappable asset/token.
- Email + password, inline validation, clear primary button with loading state, friendly error on bad credentials (from the enveloped server action), a "forgot password" link (stub).
- Fully responsive and accessible.

## 6. Apply, then verify

- Restyle the shell, login, Audit Log, and Users & Roles to the system. Leave other modules as polished-but-minimal placeholders (consistent empty state, not custom work).
- Update `Docs/Design-System/*` (Design-Tokens, Colors, Typography, Spacing, UI-Components, Accessibility) to describe what you actually implemented, with file references.
- Keep everything behind the data seam — this is presentation only; do not touch `lib/` data logic.
- Ensure `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` still pass (RBAC-gated nav must still work).

## Definition of done
A new visitor sees a polished, modern login; signing in lands them in a clean dashboard whose sidebar reflects their permissions; the Audit Log and Users & Roles screens look production-grade; and the whole look is driven by tokens in one place so it can be re-skinned later.

Output your plan (incl. which design skills/MCPs you'll use and the token set) before coding. Then implement in small slices, typecheck + test after each.
