import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { getOAuthConfig } from '@/lib/social/oauth-config'
import type { PlatformId } from '@/lib/social/types'

const VALID_PLATFORMS: PlatformId[] = ['instagram', 'facebook', 'youtube']

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get('platform') as PlatformId | null

  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const config = getOAuthConfig(platform)
  if (!config.clientId) {
    // Credentials not configured — inform the developer clearly
    return new NextResponse(
      `<html><body style="font-family:system-ui;padding:2rem">
        <h2>OAuth not configured for <b>${platform}</b></h2>
        <p>Add these to your <code>.env</code> file and restart the dev server:</p>
        <pre>${platform === 'youtube'
          ? 'GOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET='
          : 'FACEBOOK_APP_ID=\nFACEBOOK_APP_SECRET='
        }</pre>
        <p>Redirect URI to register in the developer console:<br>
        <b>${req.nextUrl.origin}/api/auth/social/callback</b></p>
      </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html' } },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const redirectUri = `${appUrl}/api/auth/social/callback`

  // state = "platform:nonce" — validated in callback to prevent CSRF
  const state = `${platform}:${randomUUID()}`

  const cookieStore = await cookies()
  cookieStore.set('social_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes — enough for the OAuth round-trip
    path: '/',
  })

  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', config.scopes)

  if (platform === 'youtube') {
    // Request offline access so we get a refresh token
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
  }

  return NextResponse.redirect(authUrl.toString())
}
