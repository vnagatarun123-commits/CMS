import type { AuthProvider, SignInParams } from '@/lib/auth/auth-provider'
import type { Session, User } from '@/types/auth'
import type { UserWithRole } from '@/types/domain'
import { UnauthenticatedError } from '@/lib/errors'
import { SEEDED_ORG, MOCK_USER_PASSWORDS } from '@/lib/mock/seed'

// globalThis-based session store — single active session, dev/mock only.
// A cookie (MOCK_SESSION_COOKIE) also stores the user's email so the session
// survives dev-server restarts without forcing a re-login.
// Both the globalThis store and the cookie are cleared on signOut.
// Cookie-based session management is replaced by Supabase Auth in the swap slice.
const G = globalThis as unknown as { __puralocalSession?: Session | null }

const MOCK_SESSION_COOKIE = 'pl_mock_uid'

async function setCookie(email: string) {
  try {
    const { cookies } = await import('next/headers')
    const jar = await cookies()
    jar.set(MOCK_SESSION_COOKIE, email, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      // No maxAge → session cookie; cleared when browser tab/window closes
    })
  } catch {
    // cookies() is unavailable outside request context (tests, CLI); ignore
  }
}

async function clearCookie() {
  try {
    const { cookies } = await import('next/headers')
    const jar = await cookies()
    jar.delete(MOCK_SESSION_COOKIE)
  } catch {
    // same as above
  }
}

async function readCookie(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers')
    const jar = await cookies()
    return jar.get(MOCK_SESSION_COOKIE)?.value ?? null
  } catch {
    return null
  }
}

export class MockAuthProvider implements AuthProvider {
  constructor(private readonly users: UserWithRole[]) {}

  async signIn({ email, password }: SignInParams): Promise<Session> {
    const expected = MOCK_USER_PASSWORDS[email]
    if (!expected || expected !== password) throw new UnauthenticatedError()
    const user = this.users.find(u => u.email === email)
    if (!user) throw new UnauthenticatedError()
    G.__puralocalSession = toSession(user)
    await setCookie(email)
    return G.__puralocalSession
  }

  async signOut(): Promise<void> {
    G.__puralocalSession = null
    await clearCookie()
  }

  async getCurrentUser(): Promise<User | null> {
    return (await this.getSession())?.user ?? null
  }

  async getSession(): Promise<Session | null> {
    // Fast path: session is already in memory
    if (G.__puralocalSession) return G.__puralocalSession

    // Slow path: dev server restarted — try to restore from cookie
    const email = await readCookie()
    if (!email) return null
    const user = this.users.find(u => u.email === email)
    if (!user) return null
    G.__puralocalSession = toSession(user)
    return G.__puralocalSession
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

// Allows e2e fixtures and tests to inject or clear a session without going through signIn.
export function setMockSession(user: UserWithRole | null): void {
  G.__puralocalSession = user ? toSession(user) : null
}
