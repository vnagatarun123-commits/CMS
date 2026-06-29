import type { AuthProvider, SignInParams } from '@/lib/auth/auth-provider'
import type { Session, User } from '@/types/auth'
import type { UserWithRole, Organization } from '@/types/domain'
import { UnauthenticatedError } from '@/lib/errors'
import { createSupabaseServerClient } from './server'

// Injected by the backend factory in lib/supabase/index.ts (Slice D).
// Given a Supabase auth user ID, resolves the matching profile + org from the DB.
export type LookupUserFn = (supabaseUserId: string) => Promise<{
  userWithRole: UserWithRole
  organization: Organization
} | null>

export class SupabaseAuthProvider implements AuthProvider {
  constructor(private readonly lookupUser: LookupUserFn) {}

  async signIn({ email, password }: SignInParams): Promise<Session> {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) throw new UnauthenticatedError()
    const result = await this.lookupUser(data.user.id)
    if (!result) throw new UnauthenticatedError()
    return toSession(result)
  }

  async signOut(): Promise<void> {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession()
    return session?.user ?? null
  }

  async getSession(): Promise<Session | null> {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    const result = await this.lookupUser(user.id)
    if (!result) return null
    return toSession(result)
  }
}

function toSession({
  userWithRole,
  organization,
}: {
  userWithRole: UserWithRole
  organization: Organization
}): Session {
  return {
    user: {
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      role: userWithRole.role,
      organizationId: userWithRole.organizationId,
    },
    orgContext: {
      organizationId: organization.id,
      organizationName: organization.name,
    },
  }
}
