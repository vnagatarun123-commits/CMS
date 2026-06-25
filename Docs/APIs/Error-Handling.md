# Error Handling

> **Status:** Implemented (convention) — applies from Phase 0. Source: `CLAUDE.md` §6.

## Standard error shape

All API errors use a consistent envelope:

```json
{ "error": { "code": "PERMISSION_DENIED", "message": "You do not have permission to publish content." } }
```

## Rules

- **Never leak stack traces** or another tenant's data in an error response or message.
- Use a typed result/exception strategy in `lib/`; map to HTTP status + the envelope at the boundary.
- Validation failures (Zod) return a structured, field-level error with a stable `code` (e.g. `VALIDATION_ERROR`).
- Authorization failures distinguish **not authenticated** (401) from **forbidden** (403); tenancy violations are treated as 404/forbidden, never as a data leak.
- Missing org context (the Prisma guard throwing) is an **internal** error (500) — it indicates a programming bug, not user input.

## Suggested code catalog (extend as built)

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed Zod validation |
| `UNAUTHENTICATED` | 401 | No valid session/JWT |
| `PERMISSION_DENIED` | 403 | Authenticated but lacks capability |
| `NOT_FOUND` | 404 | Resource absent or not in caller's org |
| `CONFLICT` | 409 | Illegal state transition, unique clash |
| `RATE_LIMITED` | 429 | Login / API throttle |
| `INTERNAL` | 500 | Unexpected (incl. missing org context) |

## Related docs
[API Overview](./API-Overview.md) · [Authentication](./Authentication.md) · [Coding Standards](../Engineering/Coding-Standards.md)

---
_Last updated: Phase 0 scaffold._
