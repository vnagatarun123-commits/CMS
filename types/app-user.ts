// ── App User — the consumer of the PuraLocal news app ─────────────────────────
// Distinct from UserWithRole (CMS staff). These are the end-users tracked
// for engagement, streaming quality, monetization, and hyper-local targeting.
//
// Two user types:
//   guest      — installed app from Play Store / App Store, watching without signing up.
//               Identified by device fingerprint only. No name/phone/email.
//   registered — signed up with phone number (OTP). May also link Google/Facebook.

export type UserType         = 'guest' | 'registered'
export type AppUserStatus    = 'active' | 'inactive' | 'suspended' | 'banned'
export type AuthMethod       = 'phone' | 'google' | 'facebook'   // phone OTP is primary
export type DevicePlatform   = 'android' | 'ios'
export type ConnectionType   = 'wifi' | '5g' | '4g' | '3g' | '2g' | 'unknown'
export type SubscriptionPlan = 'free' | 'trial' | 'premium' | 'expired'
export type LocationSource   = 'gps' | 'ip' | 'manual'
export type AcquisitionSource = 'playstore' | 'appstore' | 'google' | 'facebook' | 'referral' | 'campaign' | 'whatsapp' | 'organic'
export type QualityPreference = 'auto' | '1080p' | '720p' | '480p' | '360p'
export type ReporterAppStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface UserLocation {
  city: string
  district: string
  state: string
  pincode: string
  lat: number | null
  lng: number | null
  source: LocationSource
  // Where the user wants hyper-local news from (may differ from current location)
  preferredNewsCity: string
  preferredNewsPincode: string
}

export interface UserDevice {
  platform: DevicePlatform
  deviceId: string          // hardware fingerprint — primary ID for guests
  model: string
  osVersion: string
  appVersion: string
  screenResolution: string
  pushEnabled: boolean
  pushToken: string | null
  lastKnownIp: string       // masked — last 2 octets hidden
}

export interface UserNetwork {
  isp: string               // e.g. "Reliance Jio", "Airtel", "BSNL"
  connectionType: ConnectionType
  avgBandwidthMbps: number
  networkQualityScore: number  // 0–100 composite score
}

export interface UserStreaming {
  avgBufferingTimeSec: number   // KEY health metric
  totalBufferingEvents: number
  videoStartFailures: number
  avgBitrateKbps: number
  avgWatchDurationMin: number
  contentCompletionRate: number // 0–100 %
  qualityPreference: QualityPreference
}

export interface UserEngagement {
  totalSessions: number
  avgSessionDurationMin: number
  totalTimeSpentHrs: number
  articlesRead: number
  videosWatched: number
  livesWatched: number
  shortsWatched: number
  searchesCount: number
  sharesCount: number
  bookmarksCount: number        // guests cannot bookmark (requires account)
  commentsCount: number         // guests cannot comment (requires account)
  notificationsEnabled: boolean
  preferredLanguages: string[]  // e.g. ['Telugu', 'English']
  topCategories: string[]       // e.g. ['Local News', 'Sports']
  lastActive: Date
  dailyActiveStreak: number     // consecutive days active
}

export interface UserMonetization {
  subscriptionPlan: SubscriptionPlan
  planName: string | null
  subscriptionStartedAt: Date | null
  subscriptionExpiresAt: Date | null
  totalRevenueInr: number
  adImpressions: number
  adClicks: number
  ctr: number                   // click-through rate %
  isPremiumCandidate: boolean   // ML flag: likely to convert
}

export interface UserAcquisition {
  source: AcquisitionSource
  campaign: string | null
  referralCode: string | null
  referredBy: string | null     // userId of referrer
  utmMedium: string | null
  utmContent: string | null
  firstOpenAt: Date             // first app launch
  storeCountry: string | null   // Play Store / App Store country
}

export interface AppUser {
  id: string
  organizationId: string

  // User type
  userType: UserType

  // Identity (null for guests — identified by device.deviceId only)
  name: string | null
  phone: string | null          // primary auth for registered users (OTP)
  avatarUrl: string | null
  authMethod: AuthMethod | null // null for guests
  status: AppUserStatus
  isOnline: boolean
  phoneVerified: boolean

  // Guest → registered conversion
  guestSince: Date | null            // when the guest session first started
  convertedToRegisteredAt: Date | null  // null if still guest

  // Timestamps (registered users)
  signedUpAt: Date | null
  lastLoginAt: Date | null
  lastSignOutAt: Date | null

  // Reporter link (registered only)
  reporterAppStatus: ReporterAppStatus

  // Admin
  adminNotes: string | null
  flaggedForReview: boolean

  // Sub-objects
  location:     UserLocation
  device:       UserDevice
  network:      UserNetwork
  streaming:    UserStreaming
  engagement:   UserEngagement
  monetization: UserMonetization
  acquisition:  UserAcquisition
}
