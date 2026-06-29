import { NextResponse } from 'next/server'
import { resetBackend } from '@/lib/backend'
import { setMockSession } from '@/lib/mock/mock-auth'

// Hard-gated to non-production. Returns 404 in production so the endpoint is
// effectively invisible even if the route is bundled. Remove the whole file
// during the Supabase swap — real auth uses cookies/JWTs, not module state.
export function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }
  setMockSession(null)
  resetBackend()
  return NextResponse.json({ ok: true })
}
