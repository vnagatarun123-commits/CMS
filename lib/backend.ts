import type { AuthProvider } from '@/lib/auth/auth-provider'
import type { DataBackend } from '@/lib/data/repositories'
import { createMockBackend } from '@/lib/mock'

export interface Backend {
  auth: AuthProvider
  data: DataBackend
}

let _instance: Backend | null = null

export function getBackend(): Backend {
  if (_instance) return _instance

  if (process.env['DATA_BACKEND'] === 'supabase') {
    throw new Error('Supabase backend not yet implemented. Set DATA_BACKEND=mock.')
  }

  // Default: lazily initialise the in-memory mock.
  _instance = createMockBackend()
  return _instance
}

// Allows tests to inject a fully-controlled backend and isolate state.
export function registerBackend(backend: Backend): void {
  _instance = backend
}

// Call in test afterEach to prevent state leaking between tests.
export function resetBackend(): void {
  _instance = null
}
