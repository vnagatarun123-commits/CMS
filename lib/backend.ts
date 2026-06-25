import type { AuthProvider } from '@/lib/auth/auth-provider'
import type { DataBackend } from '@/lib/data/repositories'

export interface Backend {
  auth: AuthProvider
  data: DataBackend
}

let _instance: Backend | null = null

export function getBackend(): Backend {
  if (!_instance) {
    // Populated by registerBackend() called from the mock or supabase bootstrap.
    // Throw early rather than silently returning undefined.
    throw new Error(
      'Backend not initialised. Call registerBackend() before using getBackend().',
    )
  }
  return _instance
}

export function registerBackend(backend: Backend): void {
  _instance = backend
}

// Reset used in tests to avoid cross-test state leakage.
export function resetBackend(): void {
  _instance = null
}
