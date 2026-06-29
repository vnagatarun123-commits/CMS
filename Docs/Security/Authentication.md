# Authentication (Security)

> **Status:** Implemented — Supabase swap slice. Both mock and Supabase implementations of `AuthProvider` exist; the active one is selected by `DATA_BACKEND`.

## Architecture

Auth uses the **provider interface pattern** (`lib/auth/auth-provider.ts`): UI, server actions, and `withAuth` depend only on the `AuthProvider` interface — never on Supabase or the mock directly.

```
AuthProvider interface (lib/auth/auth-provider.ts)
  ├── MockAuthProvider (lib/mock/mock-auth.ts)        ← DATA_BACKEND=mock (default)
  └── SupabaseAuthProvider (lib/supabase/supabase-auth.ts)  ← DATA_BACKEND=supabase
```

## Supabase Auth (production path)

- **Provider:** Supabase Auth (email + password). JWTs issued by Supabase.
- **Session storage:** `HttpOnly` cookies managed by `@supabase/ssr`.
- **Session refresh:** `middleware.ts` calls `supabase.auth.getUser()` on every request, which refreshes the JWT if it's near expiry and writes a fresh `Set-Cookie` header.
- **Sign-in flow:** Server Action → `SupabaseAuthProvider.signIn()` → `supabase.auth.signInWithPassword()` → cookies set → profile + role looked up from Postgres → `Session` returned.
- **`getSession()`:** calls `supabase.auth.getUser()` (validates JWT, not just reads cookie) → looks up profile from DB → returns `Session` with `user` + `orgContext`.

### Key files
| File | Role |
|---|---|
| `lib/supabase/server.ts` | Server-side Supabase client factories (anon + service-role) |
| `lib/supabase/supabase-auth.ts` | `SupabaseAuthProvider` implementation |
| `middleware.ts` | JWT refresh on every non-static request |

## Mock Auth (development / unit tests)

- Session stored in `globalThis.__puralocalSession` (shared across Next.js module bundles).
- All seeded users have password `"password"` (dev-only).
- Reset via `POST /api/e2e/reset` for Playwright test isolation.
- No cookies; no JWTs; no expiry. See [Technical Debt TD-001](../Engineering/Technical-Debt.md).

## Session shape

```typescript
interface Session {
  user: {
    id: string            // Supabase auth.users.id (UUID)
    email: string
    name: string
    role: Role
    organizationId: string
  }
  orgContext: {
    organizationId: string
    organizationName: string
  }
}
```

## What is deferred

- Password reset / forgot-password flow (Phase 2+)
- Rate limiting / account lockout (Phase 7 hardening)
- OAuth / SSO providers (not planned)

## Related docs
[Authorization](./Authorization.md) · [API Authentication](../APIs/Authentication.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
