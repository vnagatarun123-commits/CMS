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
}
