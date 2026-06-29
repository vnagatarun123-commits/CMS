import type { SocialAccount, PlatformId } from './types'

const GRAPH = 'https://graph.facebook.com/v19.0'

interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

interface MetaPage {
  id: string
  name: string
  category: string
  access_token: string
  followers_count?: number
  instagram_business_account?: { id: string }
}

interface IgProfile {
  id: string
  name: string
  username: string
  profile_picture_url?: string
  followers_count?: number
}

type AccountData = Omit<SocialAccount, 'id' | 'organizationId'>

export async function exchangeMetaCode(
  code: string,
  redirectUri: string,
): Promise<MetaTokenResponse> {
  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!)
  url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code', code)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Meta token exchange failed (${res.status}): ${body}`)
  }
  return res.json() as Promise<MetaTokenResponse>
}

async function longLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', process.env.FACEBOOK_APP_ID!)
  url.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET!)
  url.searchParams.set('fb_exchange_token', shortToken)
  const res = await fetch(url.toString())
  const data: MetaTokenResponse = await res.json()
  return data.access_token ?? shortToken
}

export async function fetchMetaAccounts(
  userToken: string,
  platform: PlatformId,
): Promise<AccountData[]> {
  const llt = await longLivedToken(userToken)

  const pagesRes = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,category,access_token,followers_count,instagram_business_account&access_token=${llt}`,
  )
  if (!pagesRes.ok) throw new Error(`Meta pages fetch failed: ${await pagesRes.text()}`)
  const { data: pages }: { data: MetaPage[] } = await pagesRes.json()

  const results: AccountData[] = []
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days

  if (platform === 'facebook') {
    for (const page of pages ?? []) {
      results.push({
        platformId: 'facebook',
        accountName: page.name,
        accountHandle: page.name.toLowerCase().replace(/\s+/g, ''),
        accountType: page.category ?? 'Page',
        avatarUrl: `${GRAPH}/${page.id}/picture?type=large`,
        followers: page.followers_count ?? 0,
        verified: false,
        status: 'connected',
        active: true,
        connectedAt: new Date(),
        lastSyncedAt: new Date(),
        expiresAt,
        autoPublish: false,
        permissions: ['pages_manage_posts', 'pages_read_engagement'],
        accessToken: page.access_token,
        refreshToken: null,
      })
    }
  }

  if (platform === 'instagram') {
    for (const page of pages ?? []) {
      const igId = page.instagram_business_account?.id
      if (!igId) continue

      const igRes = await fetch(
        `${GRAPH}/${igId}?fields=id,name,username,profile_picture_url,followers_count&access_token=${page.access_token}`,
      )
      if (!igRes.ok) continue
      const ig: IgProfile = await igRes.json()

      results.push({
        platformId: 'instagram',
        accountName: ig.name ?? ig.username,
        accountHandle: `@${ig.username}`,
        accountType: 'Business',
        avatarUrl: ig.profile_picture_url ?? null,
        followers: ig.followers_count ?? 0,
        verified: false,
        status: 'connected',
        active: true,
        connectedAt: new Date(),
        lastSyncedAt: new Date(),
        expiresAt,
        autoPublish: false,
        permissions: ['instagram_basic', 'instagram_content_publish'],
        accessToken: page.access_token,
        refreshToken: null,
      })
    }
  }

  return results
}
