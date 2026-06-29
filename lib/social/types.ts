export type PlatformId = 'instagram' | 'facebook' | 'youtube'
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'expired'

// Server-side record — includes tokens, never sent to client
export interface SocialAccount {
  id: string
  organizationId: string
  platformId: PlatformId
  accountName: string
  accountHandle: string
  accountType: string
  avatarUrl: string | null
  followers: number
  verified: boolean
  status: ConnectionStatus
  active: boolean
  connectedAt: Date
  lastSyncedAt: Date | null
  expiresAt: Date | null
  autoPublish: boolean
  permissions: string[]
  accessToken: string
  refreshToken: string | null
}

// Client-safe subset — tokens and orgId stripped before sending over the wire
export type ClientSocialAccount = Omit<SocialAccount, 'accessToken' | 'refreshToken' | 'organizationId'>
