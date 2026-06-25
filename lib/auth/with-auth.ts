import type { Session } from '@/types/auth'
import type { ApiEnvelope } from '@/types/api'
import type { Permission } from '@/lib/rbac/permissions'
import { requireSession } from '@/lib/auth/session'
import { requirePermission } from '@/lib/rbac/can'
import { ok, envelopeFromError } from '@/lib/errors'

type AuthedHandler<TArgs extends unknown[], TReturn> = (
  session: Session,
  ...args: TArgs
) => Promise<TReturn>

// Wraps a server-action handler: checks auth → org → permission in order,
// returns a typed ApiEnvelope so callers never see raw throws.
export function withAuth<TArgs extends unknown[], TReturn>(
  permission: Permission,
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
