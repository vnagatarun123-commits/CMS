import type { AuthProvider } from '@/lib/auth/auth-provider'
import type { DataBackend } from '@/lib/data/repositories'
import { createMockBackend } from '@/lib/mock'
import { createSupabaseBackend } from '@/lib/supabase'

export interface Backend {
  auth: AuthProvider
  data: DataBackend
}

// Use globalThis so the singleton is shared across all Next.js module bundles
// (Route Handlers and Server Actions are compiled into separate module caches in
// dev mode; module-level `let` would give each bundle its own unrelated instance).
//
// BACKEND_VERSION: bump this string any time a new repository is added to the
// backend or seeded data changes shape. The old globalThis singleton will be
// discarded and recreated so hot-reloads pick up the new data automatically.
const BACKEND_VERSION = '2026-06-27-v6'

const G = globalThis as unknown as {
  __puralocalBackend?: Backend | null
  __puralocalBackendVersion?: string
}

function isValidBackend(b: Backend): boolean {
  if (G.__puralocalBackendVersion !== BACKEND_VERSION) return false
  // Guards against a stale globalThis singleton that was created before a
  // hot-reload added new repositories. Check every top-level repo.
  return !!(
    b.data.roleDefinitions &&
    b.data.notifications &&
    b.data.auditLog &&
    b.data.content &&
    b.data.categories
  )
}

export function getBackend(): Backend {
  if (G.__puralocalBackend && isValidBackend(G.__puralocalBackend)) return G.__puralocalBackend

  // Stale or missing — recreate.
  G.__puralocalBackend = null

  if (process.env['DATA_BACKEND'] === 'supabase') {
    G.__puralocalBackend = createSupabaseBackend()
    return G.__puralocalBackend
  }

  G.__puralocalBackend = createMockBackend()
  G.__puralocalBackendVersion = BACKEND_VERSION
  return G.__puralocalBackend
}

// Allows tests to inject a fully-controlled backend and isolate state.
export function registerBackend(backend: Backend): void {
  G.__puralocalBackend = backend
}

// Call in test afterEach to prevent state leaking between tests.
export function resetBackend(): void {
  G.__puralocalBackend = null
}
