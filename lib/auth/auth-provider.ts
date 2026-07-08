import type { Session, User } from '@/types/auth'

export interface SignInParams {
  email: string
  password: string
}

export interface AuthProvider {
  signIn(params: SignInParams): Promise<Session>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  getSession(): Promise<Session | null>
  // Optional — mock uses globalThis; Supabase refreshes via JWT automatically
  changePassword?(userId: string, currentPassword: string, newPassword: string): Promise<void>
  patchSessionUser?(patch: Partial<Pick<User, 'name' | 'photoUrl'>>): Promise<void>
  requestPasswordReset?(email: string): Promise<void>
  updatePassword?(newPassword: string): Promise<void>
}
