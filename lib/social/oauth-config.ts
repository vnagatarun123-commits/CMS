import type { PlatformId } from './types'

export interface OAuthPlatformConfig {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string
}

export function getOAuthConfig(platform: PlatformId): OAuthPlatformConfig {
  switch (platform) {
    case 'instagram':
      return {
        clientId:     process.env.FACEBOOK_APP_ID     ?? '',
        clientSecret: process.env.FACEBOOK_APP_SECRET  ?? '',
        authUrl:  'https://www.facebook.com/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
        // Instagram Business access requires pages to be linked in Meta Business Suite
        scopes: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      }
    case 'facebook':
      return {
        clientId:     process.env.FACEBOOK_APP_ID     ?? '',
        clientSecret: process.env.FACEBOOK_APP_SECRET  ?? '',
        authUrl:  'https://www.facebook.com/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
        scopes: 'pages_manage_posts,pages_read_engagement,publish_video,pages_show_list',
      }
    case 'youtube':
      return {
        clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        authUrl:  'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      }
  }
}
