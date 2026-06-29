'use server'

import { z } from 'zod'
import type { NotificationRecord, NotificationTemplate, NotificationStats } from '@/types/domain'
import { NotificationChannel, NotificationAudience, NotificationPriority, NotificationStatus } from '@/types/domain'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'
import { ValidationError, NotFoundError } from '@/lib/errors'

// ── Audience → estimated recipient count map ──────────────────────────────────
// These mirror the display values shown in the UI and are used when creating
// notifications in the mock. The real Supabase implementation will query actual counts.
const AUDIENCE_ESTIMATES: Record<string, number> = {
  APP_USERS:     24500,
  REPORTERS:     42,
  ALL_CMS_USERS: 11,
  ALL:           24553,
  BY_ROLE:       5, // placeholder; real impl counts by role
}

// ── Validation schema ─────────────────────────────────────────────────────────

const NotificationInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 chars or less'),
  body: z.string().min(1, 'Body is required').max(500, 'Body must be 500 chars or less'),
  deepLink: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1, 'Select at least one channel'),
  audience: z.nativeEnum(NotificationAudience),
  audienceValue: z.string().max(100).optional().nullable(),
  priority: z.nativeEnum(NotificationPriority),
  templateId: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

// ── List ──────────────────────────────────────────────────────────────────────

export const listNotifications = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session, opts?: { status?: string; search?: string }): Promise<NotificationRecord[]> => {
    return getBackend().data.notifications.list(session.orgContext.organizationId, {
      status: opts?.status as NotificationStatus | undefined,
      search: opts?.search,
    })
  },
)

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getNotificationStats = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session): Promise<NotificationStats> => {
    return getBackend().data.notifications.getStats(session.orgContext.organizationId)
  },
)

// ── Templates ─────────────────────────────────────────────────────────────────

export const listNotificationTemplates = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session): Promise<NotificationTemplate[]> => {
    return getBackend().data.notificationTemplates.list(session.orgContext.organizationId)
  },
)

// ── Create + Send immediately ─────────────────────────────────────────────────

export const createAndSendNotification = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session, input: unknown): Promise<NotificationRecord> => {
    const parsed = NotificationInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')

    const orgId = session.orgContext.organizationId
    const estimate = AUDIENCE_ESTIMATES[parsed.data.audience] ?? 0

    return getBackend().data.notifications.create({
      organizationId: orgId,
      title: parsed.data.title,
      body: parsed.data.body,
      deepLink: parsed.data.deepLink ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      channels: parsed.data.channels,
      audience: parsed.data.audience,
      audienceValue: parsed.data.audienceValue ?? null,
      priority: parsed.data.priority,
      status: NotificationStatus.SENT,
      templateId: parsed.data.templateId ?? null,
      scheduledAt: null,
      sentBy: session.user.id,
      sentByName: session.user.name,
      estimatedRecipients: estimate,
    })
  },
)

// ── Create + Schedule ─────────────────────────────────────────────────────────

export const createScheduledNotification = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session, input: unknown): Promise<NotificationRecord> => {
    const parsed = NotificationInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
    if (!parsed.data.scheduledAt) throw new ValidationError('scheduledAt is required for scheduled notifications')

    const orgId = session.orgContext.organizationId
    const estimate = AUDIENCE_ESTIMATES[parsed.data.audience] ?? 0

    return getBackend().data.notifications.create({
      organizationId: orgId,
      title: parsed.data.title,
      body: parsed.data.body,
      deepLink: parsed.data.deepLink ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      channels: parsed.data.channels,
      audience: parsed.data.audience,
      audienceValue: parsed.data.audienceValue ?? null,
      priority: parsed.data.priority,
      status: NotificationStatus.SCHEDULED,
      templateId: parsed.data.templateId ?? null,
      scheduledAt: new Date(parsed.data.scheduledAt),
      sentBy: session.user.id,
      sentByName: session.user.name,
      estimatedRecipients: estimate,
    })
  },
)

// ── Save Draft ────────────────────────────────────────────────────────────────

export const saveDraftNotification = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session, input: unknown): Promise<NotificationRecord> => {
    const parsed = NotificationInputSchema.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')

    const orgId = session.orgContext.organizationId
    const estimate = AUDIENCE_ESTIMATES[parsed.data.audience] ?? 0

    return getBackend().data.notifications.create({
      organizationId: orgId,
      title: parsed.data.title,
      body: parsed.data.body,
      deepLink: parsed.data.deepLink ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      channels: parsed.data.channels,
      audience: parsed.data.audience,
      audienceValue: parsed.data.audienceValue ?? null,
      priority: parsed.data.priority,
      status: NotificationStatus.DRAFT,
      templateId: parsed.data.templateId ?? null,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      sentBy: session.user.id,
      sentByName: session.user.name,
      estimatedRecipients: estimate,
    })
  },
)

// ── Cancel ────────────────────────────────────────────────────────────────────

export const cancelNotification = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session, id: string): Promise<NotificationRecord> => {
    const orgId = session.orgContext.organizationId
    const item = await getBackend().data.notifications.findById(id, orgId)
    if (!item) throw new NotFoundError('Notification')
    if (item.status !== NotificationStatus.SCHEDULED) {
      throw new ValidationError('Only scheduled notifications can be cancelled')
    }
    return getBackend().data.notifications.updateStatus(id, orgId, NotificationStatus.CANCELLED)
  },
)

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteNotification = withAuth(
  Permission.NOTIFICATIONS_MANAGE,
  async (session, id: string): Promise<void> => {
    const orgId = session.orgContext.organizationId
    const item = await getBackend().data.notifications.findById(id, orgId)
    if (!item) throw new NotFoundError('Notification')
    if (item.status !== NotificationStatus.DRAFT && item.status !== NotificationStatus.CANCELLED) {
      throw new ValidationError('Only draft or cancelled notifications can be deleted')
    }
    await getBackend().data.notifications.delete(id, orgId)
  },
)
