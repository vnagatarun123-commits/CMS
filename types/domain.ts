import type { Permission } from '@/lib/rbac/permissions'

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export interface RoleDefinition {
  id: string             // stable key, e.g. 'EDITOR' or 'CUSTOM_REGIONAL'
  organizationId: string
  name: string           // display name
  permissions: Permission[]
  isSystem: boolean      // system roles can be edited but not deleted
  createdAt: Date
}

export interface UserWithRole {
  id: string
  email: string
  name: string
  role: string           // role ID — built-in or custom
  organizationId: string
  invitedAt: Date
  joinedAt: Date | null
}

export interface RoleAssignment {
  userId: string
  role: string           // role ID
  organizationId: string
  assignedAt: Date
  assignedBy: string
}

export interface AuditEntry {
  id: string
  organizationId: string
  actorId: string
  actorName: string
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  targetLabel: string
  metadata: Record<string, unknown>
  createdAt: Date
}

export type AuditAction =
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_changed'
  // User management
  | 'user.invited'
  | 'user.role_assigned'
  | 'user.role_removed'
  | 'user.removed'
  // Org
  | 'org.settings_updated'
  | 'org.role_created'
  | 'org.role_updated'
  | 'org.role_deleted'
  // Content
  | 'content.created'
  | 'content.updated'
  | 'content.transitioned'
  | 'content.deleted'
  | 'content.scheduled'
  | 'content.published'
  // Notifications
  | 'notification.sent'
  | 'notification.scheduled'
  | 'notification.cancelled'
  | 'notification.deleted'
  // Reporter / contributor
  | 'reporter.approved'
  | 'reporter.rejected'
  | 'reporter.earnings_released'
  | 'reporter.commission_updated'
  // Reference data
  | 'category.created'
  | 'category.updated'
  | 'category.toggled'
  | 'category.deleted'
  | 'category.restored'
  | 'location.created'
  | 'location.updated'
  | 'location.toggled'
  | 'location.deleted'
  | 'location.restored'
  | 'language.created'
  | 'language.updated'
  | 'language.toggled'
  | 'language.deleted'
  | 'language.restored'

export type AuditTargetType =
  | 'auth'
  | 'user'
  | 'organization'
  | 'role'
  | 'content'
  | 'notification'
  | 'reporter'
  | 'category'
  | 'location'
  | 'language'

// ── Reference data ────────────────────────────────────────────────────────────

export interface Category {
  id: string
  organizationId: string
  code: string           // short code, e.g. LOC, SPT — unique per org
  name: string
  slug: string
  active: boolean
  deletedAt: Date | null
  createdAt: Date
  // Optional display metadata — client-side for now, wire to backend when Supabase lands
  icon?: string          // emoji, e.g. '📰'
  color?: string         // hex, e.g. '#ef4444'
  sortOrder?: number     // app menu display order
  description?: string
}

export const LocationLevel = {
  STATE:    'STATE',
  DISTRICT: 'DISTRICT',
  MANDAL:   'MANDAL',
  VILLAGE:  'VILLAGE',
} as const
export type LocationLevel = (typeof LocationLevel)[keyof typeof LocationLevel]

export const LOCATION_LEVEL_LABELS: Record<LocationLevel, string> = {
  STATE:    'State',
  DISTRICT: 'District',
  MANDAL:   'Mandal',
  VILLAGE:  'Village',
}

export interface Location {
  id: string
  organizationId: string
  name: string
  slug: string
  level: LocationLevel
  parentId: string | null
  active: boolean
  deletedAt: Date | null
  createdAt: Date
  // Joined display field (populated by list/findById)
  parentName?: string | null
}

export interface Language {
  id: string
  organizationId: string
  code: string           // ISO 639-1, e.g. en, te, hi — unique per org
  name: string
  slug: string
  active: boolean
  deletedAt: Date | null
  createdAt: Date
  nativeName?: string    // e.g. 'తెలుగు' for Telugu
  direction?: 'ltr' | 'rtl'
  sortOrder?: number     // app language picker display order
}

// ── Content ───────────────────────────────────────────────────────────────────

export const ContentType = {
  IMAGE:   'IMAGE',
  VIDEO:   'VIDEO',
  SHORT:   'SHORT',
  LIVE:    'LIVE',
  YOUTUBE: 'YOUTUBE',
} as const
export type ContentType = (typeof ContentType)[keyof typeof ContentType]

export const ContentStatus = {
  DRAFT:               'DRAFT',
  UNDER_REVIEW:        'UNDER_REVIEW',
  NEEDS_CLARIFICATION: 'NEEDS_CLARIFICATION',
  SCHEDULED:           'SCHEDULED',
  PUBLISHED:           'PUBLISHED',
} as const
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus]

export const ContentSource = {
  APP: 'APP',
  CMS: 'CMS',
} as const
export type ContentSource = (typeof ContentSource)[keyof typeof ContentSource]

export interface Content {
  id: string
  organizationId: string
  type: ContentType
  status: ContentStatus
  source: ContentSource
  title: string
  slug: string
  body: string | null
  excerpt: string | null
  mediaUrl: string | null
  youtubeUrl: string | null
  categoryId: string | null
  locationId: string | null
  languageId: string | null
  reporterId: string | null
  tags: string[]
  isBreakingNews: boolean
  isTrending: boolean
  isFeatured: boolean
  isVisibleInApp?: boolean
  scheduledAt: Date | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Joined display fields (populated by list/findById)
  categoryName?: string | null
  locationName?: string | null
  languageName?: string | null
  reporterName?: string | null
  reporterPhotoUrl?: string | null
  reporterRole?: string | null
  thumbnailUrl?: string | null
  rejectionNote?: string | null
}

export interface ContentTransition {
  id: string
  contentId: string
  fromStatus: ContentStatus | null
  toStatus: ContentStatus
  actorId: string
  actorName: string
  note: string | null
  createdAt: Date
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const NotificationChannel = {
  IN_APP: 'IN_APP',
  PUSH:   'PUSH',
  EMAIL:  'EMAIL',
  SMS:    'SMS',
} as const
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel]

export const NotificationAudience = {
  ALL_CMS_USERS: 'ALL_CMS_USERS',
  REPORTERS:     'REPORTERS',
  APP_USERS:     'APP_USERS',
  BY_ROLE:       'BY_ROLE',
  ALL:           'ALL',
} as const
export type NotificationAudience = (typeof NotificationAudience)[keyof typeof NotificationAudience]

export const NotificationStatus = {
  DRAFT:     'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING:   'SENDING',
  SENT:      'SENT',
  FAILED:    'FAILED',
  CANCELLED: 'CANCELLED',
} as const
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus]

export const NotificationPriority = {
  LOW:    'LOW',
  NORMAL: 'NORMAL',
  HIGH:   'HIGH',
  URGENT: 'URGENT',
} as const
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority]

export interface NotificationRecord {
  id: string
  organizationId: string
  title: string
  body: string
  imageUrl?: string | null
  deepLink?: string | null
  channels: NotificationChannel[]
  audience: NotificationAudience
  audienceValue?: string | null
  priority: NotificationPriority
  status: NotificationStatus
  templateId?: string | null
  scheduledAt?: Date | null
  sentAt?: Date | null
  sentBy: string
  sentByName: string
  estimatedRecipients: number
  deliveredCount: number
  openedCount: number
  failedCount: number
  createdAt: Date
  updatedAt: Date
}

export interface NotificationTemplate {
  id: string
  organizationId: string
  name: string
  description: string
  title: string
  body: string
  channels: NotificationChannel[]
  audience: NotificationAudience
  priority: NotificationPriority
  category: 'content' | 'reporter' | 'system' | 'marketing'
}

export interface NotificationStats {
  totalSent: number
  totalScheduled: number
  totalDraft: number
  totalFailed: number
  totalRecipients: number
  totalDelivered: number
  totalOpened: number
  openRate: number
  deliveryRate: number
}
