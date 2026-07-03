'use server'

import { withSession } from '@/lib/auth/with-auth'
import { getBackend } from '@/lib/backend'
import { can } from '@/lib/rbac/can'
import { Permission } from '@/lib/rbac/permissions'
import { getStoredContributors } from '@/lib/mock/contributors-store'
import { MOCK_ADS } from '@/lib/mock/ads-store'

export interface RecentContentItem {
  id: string
  title: string
  type: string
  status: string
  source: string
  isBreakingNews: boolean
  isTrending: boolean
  reporterName: string | null
  createdAt: string
  publishedAt: string | null
}

export interface ReviewQueueItem {
  id: string
  title: string
  type: string
  source: string
  thumbnailUrl: string | null
  reporterName: string | null
  reporterPhotoUrl: string | null
  locationName: string | null
  createdAt: string
}

export interface TopStory {
  id: string
  title: string
  type: string
  status: string
  thumbnailUrl: string | null
  locationName: string | null
  categoryName: string | null
  isFeatured: boolean
  isTrending: boolean
  isBreakingNews: boolean
  date: string
}

export interface TopReporter {
  name: string
  photoUrl: string | null
  stories: number
}

export interface LiveStream {
  id: string
  title: string
  reporterName: string | null
  reporterPhotoUrl: string | null
  locationName: string | null
  thumbnailUrl: string | null
  startedAt: string | null
}

export interface PendingApproval {
  id: string
  name: string
  photoUrl: string | null
  district: string | null
  designation: string | null
  appliedOn: string
}

export interface PublishingDay {
  label: string
  submitted: number
  published: number
}

export interface DashboardStats {
  content?: {
    total: number
    published: number
    underReview: number
    needsClarification: number
    scheduled: number
    draft: number
    trending: number
    breaking: number
    createdThisWeek: number
    createdDelta: number      // % vs prior week
    publishedThisWeek: number
  }
  contributors?: { total: number; approved: number; pending: number }
  users?: { total: number }
  ads?: { total: number; active: number; totalRevenue: number; totalImpressions: number }
  notifications?: { totalSent: number; totalScheduled: number; deliveryRate: number }
  live?: { now: number; upcoming: number; streams: LiveStream[] }
  publishingActivity?: PublishingDay[]
  reviewQueue?: ReviewQueueItem[]
  pendingApprovals?: PendingApproval[]
  topStories?: TopStory[]
  topReporters?: TopReporter[]
  recentContent: RecentContentItem[]
}

function startOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

export const getDashboardStats = withSession(async (session) => {
  const backend = getBackend()
  const { user } = session
  const orgId = user.organizationId
  const stats: DashboardStats = { recentContent: [] }

  if (can(user, Permission.CONTENT_EDIT) || can(user, Permission.CONTENT_REVIEW)) {
    const all = await backend.data.content.list(orgId)

    // ── Week-over-week (created) ──────────────────────────────────────────────
    const today0 = startOfDay(new Date())
    const weekAgo = new Date(today0);     weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeekAgo = new Date(today0);  twoWeekAgo.setDate(twoWeekAgo.getDate() - 14)
    const thisWeek = all.filter(c => c.createdAt >= weekAgo).length
    const lastWeek = all.filter(c => c.createdAt >= twoWeekAgo && c.createdAt < weekAgo).length
    const createdDelta = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : (thisWeek > 0 ? 100 : 0)
    const publishedThisWeek = all.filter(c => c.publishedAt && c.publishedAt >= weekAgo).length

    stats.content = {
      total: all.length,
      published:          all.filter(c => c.status === 'PUBLISHED').length,
      underReview:        all.filter(c => c.status === 'UNDER_REVIEW').length,
      needsClarification: all.filter(c => c.status === 'NEEDS_CLARIFICATION').length,
      scheduled:          all.filter(c => c.status === 'SCHEDULED').length,
      draft:              all.filter(c => c.status === 'DRAFT').length,
      trending:           all.filter(c => c.isTrending).length,
      breaking:           all.filter(c => c.isBreakingNews).length,
      createdThisWeek: thisWeek,
      createdDelta,
      publishedThisWeek,
    }

    // ── Publishing activity — last 7 days ────────────────────────────────────
    const activity: PublishingDay[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today0); day.setDate(day.getDate() - i)
      const next = new Date(day);   next.setDate(next.getDate() + 1)
      activity.push({
        label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
        submitted: all.filter(c => c.createdAt >= day && c.createdAt < next).length,
        published: all.filter(c => c.publishedAt && c.publishedAt >= day && c.publishedAt < next).length,
      })
    }
    stats.publishingActivity = activity

    // ── Review queue — awaiting review ───────────────────────────────────────
    stats.reviewQueue = all
      .filter(c => c.status === 'UNDER_REVIEW')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id, title: c.title, type: c.type, source: c.source,
        thumbnailUrl: c.thumbnailUrl ?? c.mediaUrl ?? null,
        reporterName: c.reporterName ?? null,
        reporterPhotoUrl: c.reporterPhotoUrl ?? null,
        locationName: c.locationName ?? null,
        createdAt: c.createdAt.toISOString(),
      }))

    // ── Top stories — ranked by editorial signals + recency ──────────────────
    const score = (c: typeof all[number]) =>
      (c.isFeatured ? 4 : 0) + (c.isTrending ? 2 : 0) + (c.isBreakingNews ? 1 : 0)
    stats.topStories = [...all]
      .sort((a, b) =>
        score(b) - score(a) ||
        new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id, title: c.title, type: c.type, status: c.status,
        thumbnailUrl: c.thumbnailUrl ?? c.mediaUrl ?? null,
        locationName: c.locationName ?? null,
        categoryName: c.categoryName ?? null,
        isFeatured: c.isFeatured, isTrending: c.isTrending, isBreakingNews: c.isBreakingNews,
        date: (c.publishedAt ?? c.createdAt).toISOString(),
      }))

    // ── Top reporters — by story count ───────────────────────────────────────
    const repMap = new Map<string, TopReporter>()
    for (const c of all) {
      if (!c.reporterName) continue
      const e = repMap.get(c.reporterName) ?? { name: c.reporterName, photoUrl: c.reporterPhotoUrl ?? null, stories: 0 }
      e.stories++
      repMap.set(c.reporterName, e)
    }
    stats.topReporters = [...repMap.values()].sort((a, b) => b.stories - a.stories).slice(0, 5)

    // ── Live streams — currently on air + upcoming ───────────────────────────
    const liveContent = all.filter(c => c.type === 'LIVE')
    stats.live = {
      now:      liveContent.filter(c => c.status === 'PUBLISHED').length,
      upcoming: liveContent.filter(c => c.status === 'SCHEDULED').length,
      streams:  liveContent
        .filter(c => c.status === 'PUBLISHED')
        .slice(0, 4)
        .map(c => ({
          id: c.id, title: c.title,
          reporterName: c.reporterName ?? null,
          reporterPhotoUrl: c.reporterPhotoUrl ?? null,
          locationName: c.locationName ?? null,
          thumbnailUrl: c.thumbnailUrl ?? c.mediaUrl ?? null,
          startedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
        })),
    }

    // ── Recent content ───────────────────────────────────────────────────────
    const sorted = [...all].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    stats.recentContent = sorted.slice(0, 8).map(c => ({
      id: c.id, title: c.title, type: c.type, status: c.status, source: c.source,
      isBreakingNews: c.isBreakingNews, isTrending: c.isTrending,
      reporterName: c.reporterName ?? null,
      createdAt: c.createdAt.toISOString(),
      publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
    }))
  }

  if (can(user, Permission.REPORTERS_MANAGE)) {
    const contributors = getStoredContributors()
    const active = contributors.filter(c => c.status !== 'deleted')
    stats.contributors = {
      total:    active.length,
      approved: active.filter(c => c.status === 'approved').length,
      pending:  active.filter(c => c.status === 'pending').length,
    }
    stats.pendingApprovals = active
      .filter(c => c.status === 'pending')
      .sort((a, b) => b.appliedOn.getTime() - a.appliedOn.getTime())
      .slice(0, 5)
      .map(c => ({
        id: c.id, name: c.name, photoUrl: c.photoUrl ?? null,
        district: c.district ?? null, designation: c.designation ?? null,
        appliedOn: c.appliedOn.toISOString(),
      }))
  }

  if (can(user, Permission.USERS_VIEW)) {
    const users = await backend.data.users.listByOrg(orgId)
    stats.users = { total: users.length }
  }

  if (can(user, Permission.ADS_MANAGE)) {
    stats.ads = {
      total:            MOCK_ADS.length,
      active:           MOCK_ADS.filter(a => a.status === 'Active').length,
      totalRevenue:     MOCK_ADS.reduce((sum, a) => sum + a.spent, 0),
      totalImpressions: MOCK_ADS.reduce((sum, a) => sum + a.impressions, 0),
    }
  }

  if (can(user, Permission.NOTIFICATIONS_MANAGE)) {
    const notifStats = await backend.data.notifications.getStats(orgId)
    stats.notifications = {
      totalSent:      notifStats.totalSent,
      totalScheduled: notifStats.totalScheduled,
      deliveryRate:   notifStats.deliveryRate,
    }
  }

  return stats
})
