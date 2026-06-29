# Integrations

> **Status:** Partial — Supabase integrated (Supabase swap slice). Phase 2+ services are stubs.

## Supabase (implemented)

| Service | Used for | Key env vars |
|---|---|---|
| Supabase Auth | User authentication, JWTs, session cookies | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Supabase Postgres | Persistent data (via Prisma + `@prisma/adapter-pg`) | `DATABASE_URL` (pooled), `DIRECT_URL` (direct for migrations) |

### Supabase client factories

| File | Client | Usage |
|---|---|---|
| `lib/supabase/server.ts` | `createSupabaseServerClient()` | Server Components, Server Actions, Route Handlers |
| `lib/supabase/server.ts` | `createSupabaseServiceClient()` | Service-role operations (seed, admin) |
| `middleware.ts` | Inline `createServerClient()` | JWT refresh on every request |

### Prisma adapter

`lib/supabase/prisma.ts` — singleton `PrismaClient` using `@prisma/adapter-pg`. Connection string from `DATABASE_URL` (PgBouncer pooled, port 6543). Stored on `globalThis.__puralocalPrisma` to survive Next.js hot-reload module bundle isolation.

## Phase 2+ integrations (stubs — not built yet)

| Integration | Phase | Purpose |
|---|---|---|
| Supabase Storage | 2 | Image/video/short uploads |
| BullMQ + Redis | 2 | Background jobs: publishing, notifications, analytics rollups |
| Video transcoding service | 2 | Short/video processing pipeline |
| Email provider (Resend/SendGrid) | 2–3 | Invite emails, reporter notifications |
| Push notification service | 5 | Mobile user engagement |
| Payment provider | 5 | Subscriptions |
| Social publishing APIs | 5 | Cross-post to social platforms |
| Streaming CDN | 2 | Live stream delivery |

All Phase 2+ integrations will be added behind provider interfaces in `lib/` and selected by env-driven factory (same pattern as auth + data backends).

## Related docs

[Background Jobs](./Background-Jobs.md) · [Secrets Management](../Security/Secrets-Management.md) · [Authentication](../Security/Authentication.md)

---
_Last updated: Supabase swap slice complete (2026-06-26)._
