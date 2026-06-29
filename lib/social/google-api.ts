import type { SocialAccount } from './types'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

interface YtChannel {
  id: string
  snippet: {
    title: string
    customUrl?: string
    thumbnails: { default?: { url: string } }
  }
  statistics: {
    subscriberCount?: string
  }
}

type AccountData = Omit<SocialAccount, 'id' | 'organizationId'>

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status}): ${await res.text()}`)
  return res.json() as Promise<GoogleTokenResponse>
}

export async function fetchYouTubeChannels(
  accessToken: string,
  refreshToken: string | null,
): Promise<AccountData[]> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error(`YouTube channels fetch failed (${res.status}): ${await res.text()}`)
  const { items }: { items: YtChannel[] } = await res.json()

  // Google access tokens expire in 1 h; refresh token is long-lived
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  return (items ?? []).map(ch => ({
    platformId: 'youtube' as const,
    accountName: ch.snippet.title,
    accountHandle: ch.snippet.customUrl
      ? `@${ch.snippet.customUrl.replace(/^@/, '')}`
      : ch.id,
    accountType: 'Channel',
    avatarUrl: ch.snippet.thumbnails.default?.url ?? null,
    followers: parseInt(ch.statistics.subscriberCount ?? '0', 10),
    verified: false,
    status: 'connected' as const,
    active: true,
    connectedAt: new Date(),
    lastSyncedAt: new Date(),
    expiresAt,
    autoPublish: false,
    permissions: ['youtube.upload', 'youtube.readonly'],
    accessToken,
    refreshToken,
  }))
}
