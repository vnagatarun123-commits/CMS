import type { Session, OrgContext } from '@/types/auth'
import { getBackend } from '@/lib/backend'
import { UnauthenticatedError, MissingOrgContextError } from '@/lib/errors'

export { UnauthenticatedError, MissingOrgContextError }

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
