import type { AuthProvider, SignInParams } from '@/lib/auth/auth-provider'
import type { Session, User } from '@/types/auth'
import type { UserWithRole } from '@/types/domain'
import { UnauthenticatedError } from '@/lib/errors'
import { SEEDED_ORG, MOCK_USER_PASSWORDS } from '@/lib/mock/seed'

// Module-level session store — single active session, dev/mock only.
// Cookie-based session management replaces this in Phase 1 (Supabase slice).
let _session: Session | null = null

export class MockAuthProvider implements AuthProvider {
  constructor(private readonly users: UserWithRole[]) {}

  async signIn({ email, password }: SignInParams): Promise<Session> {
    const expected = MOCK_USER_PASSWORDS[email]
    if (!expected || expected !== password) throw new UnauthenticatedError()
    const user = this.users.find(u => u.email === email)
    if (!user) throw new UnauthenticatedError()
    _session = toSession(user)
    return _session
  }

  async signOut(): Promise<void> {
    _session = null
  }

  async getCurrentUser(): Promise<User | null> {
    return _session?.user ?? null
  }

  async getSession(): Promise<Session | null> {
    return _session
  }
}

function toSession(user: UserWithRole): Session {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    },
    orgContext: {
      organizationId: user.organizationId,
      organizationName: SEEDED_ORG.name,
    },
  }
}

// Allows e2e fixtures and tests to inject a session without going through signIn.
export function setMockSession(user: UserWithRole | null): void {
  _session = user ? toSession(user) : null
}
