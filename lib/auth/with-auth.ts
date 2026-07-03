import type { Session } from '@/types/auth'
import type { ApiEnvelope } from '@/types/api'
import type { Permission, Capability } from '@/lib/rbac/permissions'
import { requireSession } from '@/lib/auth/session'
import { requirePermission } from '@/lib/rbac/can'
import { ok, envelopeFromError } from '@/lib/errors'

type AuthedHandler<TArgs extends unknown[], TReturn> = (
  session: Session,
  ...args: TArgs
) => Promise<TReturn>

// Like withAuth but requires only authentication — no permission check.
// Used for actions any signed-in user can perform (e.g. updating their own profile).
export function withSession<TArgs extends unknown[], TReturn>(
  handler: AuthedHandler<TArgs, TReturn>,
) {
  return async (...args: TArgs): Promise<ApiEnvelope<TReturn>> => {
    try {
      const session = await requireSession()
      const data = await handler(session, ...args)
      return ok(data)
    } catch (err) {
      return envelopeFromError(err)
    }
  }
}

// Wraps a server-action handler: checks auth → org → permission in order,
// returns a typed ApiEnvelope so callers never see raw throws.
export function withAuth<TArgs extends unknown[], TReturn>(
  permission: Permission | Capability,
  handler: AuthedHandler<TArgs, TReturn>,
) {
  return async (...args: TArgs): Promise<ApiEnvelope<TReturn>> => {
    try {
      const session = await requireSession()
      requirePermission(session.user, permission)
      const data = await handler(session, ...args)
      return ok(data)
    } catch (err) {
      return envelopeFromError(err)
    }
  }
}
