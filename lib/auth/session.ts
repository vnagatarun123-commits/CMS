import type { Session, OrgContext } from '@/types/auth'
import { getBackend } from '@/lib/backend'

export async function getSession(): Promise<Session | null> {
  return getBackend().auth.getSession()
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new UnauthenticatedError()
  return session
}

export async function requireOrgContext(session: Session): Promise<OrgContext> {
  if (!session.orgContext.organizationId) {
    throw new MissingOrgContextError()
  }
  return session.orgContext
}

export class UnauthenticatedError extends Error {
  readonly code = 'UNAUTHENTICATED' as const
  constructor() { super('Not authenticated') }
}

export class MissingOrgContextError extends Error {
  readonly code = 'MISSING_ORG_CONTEXT' as const
  constructor() { super('No organization context on session') }
}
