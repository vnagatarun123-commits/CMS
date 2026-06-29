import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { PlatformId } from '@/lib/social/types'
import { exchangeMetaCode, fetchMetaAccounts } from '@/lib/social/meta-api'
import { exchangeGoogleCode, fetchYouTubeChannels } from '@/lib/social/google-api'
import { upsertAccount } from '@/lib/social/store'

// Org resolved from session when Supabase auth lands — pinned to PuraLocal for now
const ORG_ID = process.env.PURALOCAL_ORG_ID ?? 'org_puralocal'

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const socialPage = `${appUrl}/dashboard/social-connect`

  const code  = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const errorDesc = req.nextUrl.searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      `${socialPage}?error=${encodeURIComponent(errorDesc ?? error)}`,
    )
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('social_oauth_state')?.value
  cookieStore.delete('social_oauth_state')

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${socialPage}?error=Invalid+OAuth+state`)
  }

  if (!code) {
    return NextResponse.redirect(`${socialPage}?error=No+authorization+code+received`)
  }

  const platform = state.split(':')[0] as PlatformId
  const redirectUri = `${appUrl}/api/auth/social/callback`

  try {
    let count = 0

    if (platform === 'instagram' || platform === 'facebook') {
      const token = await exchangeMetaCode(code, redirectUri)
      const accounts = await fetchMetaAccounts(token.access_token, platform)
      for (const acc of accounts) {
        upsertAccount(ORG_ID, acc)
        count++
      }
    } else if (platform === 'youtube') {
      const token = await exchangeGoogleCode(code, redirectUri)
      const channels = await fetchYouTubeChannels(token.access_token, token.refresh_token ?? null)
      for (const ch of channels) {
        upsertAccount(ORG_ID, ch)
        count++
      }
    }

    const noun = count === 1 ? 'account' : 'accounts'
    return NextResponse.redirect(
      `${socialPage}?connected=${platform}&count=${count}&message=${encodeURIComponent(`${count} ${noun} connected`)}`,
    )
  } catch (err) {
    console.error('[social/callback] error:', err)
    const msg = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(
      `${socialPage}?error=${encodeURIComponent(msg)}`,
    )
  }
}
