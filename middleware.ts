import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // No-op in mock mode — sessions are stored in globalThis, not cookies.
  if (process.env.DATA_BACKEND !== 'supabase') {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  // Middleware can't use next/headers — it creates a client directly from
  // the request/response cookie APIs instead.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Refreshes the JWT if it's near expiry. Must be awaited before returning
  // the response so the updated Set-Cookie header is included.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals, static assets, and the
    // e2e reset endpoint (which clears mock state, not Supabase cookies),
    // and the upload endpoint to prevent middleware request body buffering limits.
    '/((?!_next/static|_next/image|favicon.ico|api/e2e|api/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
