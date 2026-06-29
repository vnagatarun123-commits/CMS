'use server'

import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ContentAnalytics {
  overview: {
    totalViews: number; viewsTrend: number
    uniqueVisitors: number; visitorsTrend: number
    avgSessionSec: number; sessionTrend: number
    bounceRate: number; bounceTrend: number
    contentPublished: number; publishedTrend: number
    engagementRate: number; engagementTrend: number
  }
  viewsByDay: { date: string; views: number; visitors: number }[]
  contentByType: { type: string; label: string; count: number; views: number; color: string }[]
  topContent: { id: string; title: string; type: string; category: string; views: number; engagement: number; shares: number; publishedAt: string }[]
  categoryPerformance: { name: string; articles: number; views: number; engagement: number; trend: number }[]
  publishFunnel: { status: string; label: string; count: number; pct: number; color: string }[]
  trafficSources: { source: string; sessions: number; pct: number; color: string }[]
  deviceBreakdown: { device: string; pct: number; color: string }[]
  topCities: { city: string; state: string; views: number; pct: number }[]
  peakHours: { hour: number; views: number }[]
}

export interface ReporterAnalytics {
  overview: {
    totalReporters: number; activeReporters: number
    submitted: number; submittedTrend: number
    approvalRate: number; approvalTrend: number
    avgViewsPerArticle: number; viewsTrend: number
    totalEarnings: number; earningsTrend: number
    pendingApprovals: number
  }
  leaderboard: {
    rank: number; name: string; location: string
    submitted: number; published: number; rejected: number
    approvalRate: number; totalViews: number
    earnings: number; trend: 'up' | 'down' | 'stable'
    contentTypes: { type: string; count: number }[]
  }[]
  submissionTrend: { date: string; submitted: number; published: number; rejected: number }[]
  contentTypeBreakdown: { type: string; label: string; count: number; pct: number; color: string }[]
  tierDistribution: { tier: string; label: string; count: number; range: string; color: string }[]
  approvalFunnel: { stage: string; count: number; pct: number }[]
}

export interface VideoAnalytics {
  overview: {
    totalPlays: number; playsTrend: number
    uniqueViewers: number; viewersTrend: number
    avgWatchSec: number; watchTrend: number
    completionRate: number; completionTrend: number
    totalWatchHours: number
    liveStreamCount: number; liveViewers: number
  }
  byType: { type: string; label: string; plays: number; avgWatchSec: number; completion: number; count: number; color: string }[]
  topVideos: { id: string; title: string; type: string; plays: number; completion: number; durationSec: number; likes: number; shares: number; publishedAt: string }[]
  playsTrend: { date: string; plays: number; liveViews: number }[]
  peakHours: { hour: number; plays: number }[]
  qualityBreakdown: { quality: string; pct: number; color: string }[]
  completionBuckets: { label: string; pct: number; viewers: number }[]
}

export interface AdsAnalytics {
  overview: {
    impressions: number; impressionsTrend: number
    clicks: number; clicksTrend: number
    ctr: number; ctrTrend: number
    revenue: number; revenueTrend: number
    cpm: number; cpmTrend: number
    fillRate: number; fillTrend: number
  }
  revenueTrend: { date: string; revenue: number; impressions: number; clicks: number }[]
  topCampaigns: { id: string; name: string; advertiser: string; impressions: number; clicks: number; ctr: number; revenue: number; cpm: number; status: string; budget: number; spent: number }[]
  bySlot: { slot: string; placement: string; impressions: number; clicks: number; ctr: number; fillRate: number; revenue: number }[]
  byFormat: { format: string; impressions: number; ctr: number; revenue: number; pct: number; color: string }[]
  revenueByType: { type: string; revenue: number; pct: number; color: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function last30Days(): { date: string; views: number; visitors: number }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-06-27')
    d.setDate(d.getDate() - (29 - i))
    const base = 60000 + Math.sin(i * 0.4) * 20000 + Math.random() * 15000
    return {
      date: d.toISOString().slice(0, 10),
      views: Math.round(base + (i > 20 ? 25000 : 0)),
      visitors: Math.round(base * 0.32),
    }
  })
}

function last30DaysSimple(base: number, variance: number): { date: string; value: number }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-06-27')
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.round(base + Math.sin(i * 0.35) * variance + i * (base * 0.01)),
    }
  })
}

// ── Server actions ─────────────────────────────────────────────────────────────

export const getContentAnalytics = withAuth(
  Permission.ANALYTICS_VIEW,
  async (_session): Promise<ContentAnalytics> => {
    const viewsByDay = last30Days()

    return {
      overview: {
        totalViews: 2_418_340, viewsTrend: 14.2,
        uniqueVisitors: 782_500, visitorsTrend: 9.8,
        avgSessionSec: 272, sessionTrend: 3.1,
        bounceRate: 38.4, bounceTrend: -2.1,
        contentPublished: 847, publishedTrend: 22.0,
        engagementRate: 6.2, engagementTrend: 1.8,
      },
      viewsByDay,
      contentByType: [
        { type: 'IMAGE',   label: 'Image',   count: 412, views: 980_000,  color: '#6366F1' },
        { type: 'VIDEO',   label: 'Video',   count: 186, views: 720_000,  color: '#0EA5E9' },
        { type: 'SHORT',   label: 'Short',   count: 143, views: 480_000,  color: '#10B981' },
        { type: 'LIVE',    label: 'Live',    count: 52,  views: 175_000,  color: '#F59E0B' },
        { type: 'YOUTUBE', label: 'YouTube', count: 54,  views: 63_340,   color: '#EF4444' },
      ],
      topContent: [
        { id: 'c1', title: 'New metro line approved for Phase 3 expansion', type: 'IMAGE', category: 'Infrastructure', views: 142_000, engagement: 8.4, shares: 3_200, publishedAt: '2026-06-24' },
        { id: 'c2', title: 'Monsoon arrives 3 days early — rain forecast for next 10 days', type: 'VIDEO', category: 'Weather', views: 118_500, engagement: 7.9, shares: 2_870, publishedAt: '2026-06-25' },
        { id: 'c3', title: 'Local startup raises ₹48Cr in Series A funding', type: 'IMAGE', category: 'Business', views: 96_200, engagement: 9.1, shares: 4_100, publishedAt: '2026-06-22' },
        { id: 'c4', title: 'City council approves 24×7 water supply for 12 wards', type: 'IMAGE', category: 'Civic', views: 84_700, engagement: 6.3, shares: 1_950, publishedAt: '2026-06-23' },
        { id: 'c5', title: 'Behind the scenes: How traffic cops are using AI cameras', type: 'SHORT', category: 'Technology', views: 78_400, engagement: 11.2, shares: 5_640, publishedAt: '2026-06-21' },
        { id: 'c6', title: 'Exclusive: Interview with the new municipal commissioner', type: 'VIDEO', category: 'Politics', views: 71_200, engagement: 7.6, shares: 2_100, publishedAt: '2026-06-20' },
        { id: 'c7', title: 'Street food festival draws 40,000 visitors over weekend', type: 'IMAGE', category: 'Lifestyle', views: 65_800, engagement: 12.4, shares: 7_200, publishedAt: '2026-06-19' },
        { id: 'c8', title: 'Power outages to hit 8 zones — 6-hour scheduled cuts', type: 'IMAGE', category: 'Civic', views: 61_300, engagement: 5.8, shares: 1_400, publishedAt: '2026-06-26' },
      ],
      categoryPerformance: [
        { name: 'Infrastructure', articles: 124, views: 480_000, engagement: 7.2, trend: 18.4 },
        { name: 'Weather',        articles: 89,  views: 390_000, engagement: 8.1, trend: 42.0 },
        { name: 'Civic',          articles: 156, views: 360_000, engagement: 5.9, trend: 11.2 },
        { name: 'Business',       articles: 102, views: 285_000, engagement: 9.4, trend: 24.6 },
        { name: 'Lifestyle',      articles: 118, views: 240_000, engagement: 12.1, trend: 8.7 },
        { name: 'Politics',       articles: 76,  views: 218_000, engagement: 7.8, trend: -3.2 },
        { name: 'Technology',     articles: 64,  views: 196_000, engagement: 11.4, trend: 31.5 },
        { name: 'Education',      articles: 48,  views: 142_000, engagement: 6.8, trend: 15.0 },
        { name: 'Sports',         articles: 70,  views: 107_340, engagement: 9.9, trend: 5.3 },
      ],
      publishFunnel: [
        { status: 'DRAFT',               label: 'Draft',             count: 142, pct: 100, color: '#94A3B8' },
        { status: 'UNDER_REVIEW',        label: 'Under Review',      count: 328, pct: 87,  color: '#F59E0B' },
        { status: 'NEEDS_CLARIFICATION', label: 'Needs Clarification', count: 64, pct: 72, color: '#F97316' },
        { status: 'SCHEDULED',           label: 'Scheduled',          count: 48, pct: 58,  color: '#8B5CF6' },
        { status: 'PUBLISHED',           label: 'Published',          count: 847, pct: 100, color: '#10B981' },
      ],
      trafficSources: [
        { source: 'Mobile App',    sessions: 1_240_000, pct: 51.3, color: '#6366F1' },
        { source: 'Direct',        sessions: 480_000,   pct: 19.8, color: '#0EA5E9' },
        { source: 'Search',        sessions: 420_000,   pct: 17.4, color: '#10B981' },
        { source: 'Social Media',  sessions: 192_000,   pct: 7.9,  color: '#F59E0B' },
        { source: 'Referral',      sessions: 86_340,    pct: 3.6,  color: '#8B5CF6' },
      ],
      deviceBreakdown: [
        { device: 'Mobile',  pct: 72.4, color: '#6366F1' },
        { device: 'Desktop', pct: 19.8, color: '#0EA5E9' },
        { device: 'Tablet',  pct: 7.8,  color: '#10B981' },
      ],
      topCities: [
        { city: 'Hyderabad',  state: 'TS', views: 820_000, pct: 33.9 },
        { city: 'Bengaluru',  state: 'KA', views: 380_000, pct: 15.7 },
        { city: 'Chennai',    state: 'TN', views: 290_000, pct: 12.0 },
        { city: 'Mumbai',     state: 'MH', views: 220_000, pct: 9.1  },
        { city: 'Pune',       state: 'MH', views: 165_000, pct: 6.8  },
        { city: 'Vijayawada', state: 'AP', views: 142_000, pct: 5.9  },
        { city: 'Warangal',   state: 'TS', views: 98_000,  pct: 4.1  },
        { city: 'Kochi',      state: 'KL', views: 82_340,  pct: 3.4  },
      ],
      peakHours: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        views: Math.round(
          h >= 7 && h <= 9 ? 120000 + Math.random() * 30000 :
          h >= 12 && h <= 14 ? 95000 + Math.random() * 25000 :
          h >= 18 && h <= 22 ? 180000 + Math.random() * 40000 :
          h >= 0 && h <= 5 ? 15000 + Math.random() * 8000 :
          40000 + Math.random() * 20000
        ),
      })),
    }
  }
)

export const getReporterAnalytics = withAuth(
  Permission.ANALYTICS_VIEW,
  async (_session): Promise<ReporterAnalytics> => {
    return {
      overview: {
        totalReporters: 42, activeReporters: 28,
        submitted: 324, submittedTrend: 18.4,
        approvalRate: 78.2, approvalTrend: 3.6,
        avgViewsPerArticle: 2840, viewsTrend: 11.2,
        totalEarnings: 150000, earningsTrend: 22.0,
        pendingApprovals: 34,
      },
      leaderboard: [
        { rank: 1, name: 'Priya Sharma',    location: 'Hyderabad',  submitted: 48, published: 42, rejected: 3, approvalRate: 93.3, totalViews: 284_000, earnings: 18_400, trend: 'up',   contentTypes: [{ type: 'IMAGE', count: 28 }, { type: 'VIDEO', count: 14 }] },
        { rank: 2, name: 'Arjun Reddy',     location: 'Hyderabad',  submitted: 41, published: 35, rejected: 4, approvalRate: 89.7, totalViews: 241_500, earnings: 15_800, trend: 'up',   contentTypes: [{ type: 'VIDEO', count: 22 }, { type: 'SHORT', count: 13 }] },
        { rank: 3, name: 'Kavitha Menon',   location: 'Bengaluru',  submitted: 38, published: 29, rejected: 6, approvalRate: 82.9, totalViews: 198_200, earnings: 12_400, trend: 'stable', contentTypes: [{ type: 'IMAGE', count: 19 }, { type: 'SHORT', count: 10 }] },
        { rank: 4, name: 'Sai Krishna',     location: 'Vijayawada', submitted: 35, published: 26, rejected: 7, approvalRate: 78.8, totalViews: 172_000, earnings: 10_200, trend: 'up',   contentTypes: [{ type: 'IMAGE', count: 16 }, { type: 'VIDEO', count: 10 }] },
        { rank: 5, name: 'Meera Nair',      location: 'Kochi',      submitted: 32, published: 23, rejected: 8, approvalRate: 74.2, totalViews: 148_600, earnings: 9_100,  trend: 'down', contentTypes: [{ type: 'IMAGE', count: 15 }, { type: 'SHORT', count: 8 }] },
        { rank: 6, name: 'Ravi Shankar',    location: 'Chennai',    submitted: 29, published: 20, rejected: 7, approvalRate: 74.1, totalViews: 132_400, earnings: 8_200,  trend: 'stable', contentTypes: [{ type: 'VIDEO', count: 12 }, { type: 'IMAGE', count: 8 }] },
        { rank: 7, name: 'Ananya Das',      location: 'Hyderabad',  submitted: 27, published: 18, rejected: 6, approvalRate: 75.0, totalViews: 118_200, earnings: 7_400,  trend: 'up',   contentTypes: [{ type: 'SHORT', count: 10 }, { type: 'IMAGE', count: 8 }] },
        { rank: 8, name: 'Vikram Tiwari',   location: 'Mumbai',     submitted: 24, published: 16, rejected: 5, approvalRate: 76.2, totalViews: 102_800, earnings: 6_800,  trend: 'down', contentTypes: [{ type: 'IMAGE', count: 10 }, { type: 'VIDEO', count: 6 }] },
      ],
      submissionTrend: Array.from({ length: 30 }, (_, i) => {
        const d = new Date('2026-06-27')
        d.setDate(d.getDate() - (29 - i))
        const submitted = Math.round(8 + Math.sin(i * 0.4) * 3 + Math.random() * 4)
        return { date: d.toISOString().slice(0, 10), submitted, published: Math.round(submitted * 0.78), rejected: Math.round(submitted * 0.1) }
      }),
      contentTypeBreakdown: [
        { type: 'IMAGE',   label: 'Image',   count: 152, pct: 46.9, color: '#6366F1' },
        { type: 'VIDEO',   label: 'Video',   count: 98,  pct: 30.2, color: '#0EA5E9' },
        { type: 'SHORT',   label: 'Short',   count: 58,  pct: 17.9, color: '#10B981' },
        { type: 'LIVE',    label: 'Live',    count: 16,  pct: 4.9,  color: '#F59E0B' },
      ],
      tierDistribution: [
        { tier: 'star',   label: 'Star Reporter',   count: 4,  range: '30+ articles/mo', color: '#F59E0B' },
        { tier: 'senior', label: 'Senior Reporter',  count: 8,  range: '20–29/mo',        color: '#6366F1' },
        { tier: 'mid',    label: 'Mid Reporter',     count: 14, range: '10–19/mo',        color: '#0EA5E9' },
        { tier: 'junior', label: 'Junior Reporter',  count: 16, range: '1–9/mo',          color: '#94A3B8' },
      ],
      approvalFunnel: [
        { stage: 'Submitted',          count: 324, pct: 100 },
        { stage: 'Under Review',       count: 298, pct: 92  },
        { stage: 'Approved',           count: 253, pct: 78  },
        { stage: 'Published',          count: 246, pct: 76  },
        { stage: 'Needs Clarification', count: 28, pct: 9   },
        { stage: 'Rejected',           count: 45,  pct: 14  },
      ],
    }
  }
)

export const getVideoAnalytics = withAuth(
  Permission.ANALYTICS_VIEW,
  async (_session): Promise<VideoAnalytics> => {
    return {
      overview: {
        totalPlays: 4_218_600, playsTrend: 22.4,
        uniqueViewers: 1_082_400, viewersTrend: 17.6,
        avgWatchSec: 198, watchTrend: 5.2,
        completionRate: 64.2, completionTrend: 3.8,
        totalWatchHours: 232_000,
        liveStreamCount: 8, liveViewers: 24_800,
      },
      byType: [
        { type: 'SHORT',   label: 'Shorts',        plays: 2_100_000, avgWatchSec: 52,  completion: 84.2, count: 143, color: '#10B981' },
        { type: 'VIDEO',   label: 'Full Video',    plays: 1_240_000, avgWatchSec: 342, completion: 58.6, count: 186, color: '#6366F1' },
        { type: 'LIVE',    label: 'Live Stream',   plays: 620_000,   avgWatchSec: 1240, completion: 41.2, count: 52, color: '#F59E0B' },
        { type: 'YOUTUBE', label: 'YouTube Embed', plays: 258_600,   avgWatchSec: 218, completion: 62.4, count: 54, color: '#EF4444' },
      ],
      topVideos: [
        { id: 'v1', title: 'Monsoon arrives — live coverage',                    type: 'LIVE',  plays: 284_000, completion: 52.4, durationSec: 5400, likes: 18_200, shares: 6_400, publishedAt: '2026-06-25' },
        { id: 'v2', title: 'Metro phase 3 tunnel boring machine launch',          type: 'VIDEO', plays: 198_400, completion: 72.1, durationSec: 420,  likes: 9_800,  shares: 3_100, publishedAt: '2026-06-24' },
        { id: 'v3', title: '60 seconds: How the AI traffic camera works',         type: 'SHORT', plays: 186_200, completion: 91.4, durationSec: 58,   likes: 22_400, shares: 11_200, publishedAt: '2026-06-21' },
        { id: 'v4', title: 'Exclusive walk-through: new airport terminal',        type: 'VIDEO', plays: 142_800, completion: 68.2, durationSec: 840,  likes: 7_600,  shares: 2_400, publishedAt: '2026-06-20' },
        { id: 'v5', title: 'Street food festival highlights',                     type: 'SHORT', plays: 128_600, completion: 88.6, durationSec: 45,   likes: 19_200, shares: 8_400, publishedAt: '2026-06-19' },
        { id: 'v6', title: 'Mayor press conference on water supply',               type: 'VIDEO', plays: 114_200, completion: 61.4, durationSec: 2400, likes: 4_200,  shares: 1_800, publishedAt: '2026-06-23' },
        { id: 'v7', title: 'Startup Series A announcement — full interview',       type: 'VIDEO', plays: 96_400,  completion: 74.8, durationSec: 1800, likes: 6_400,  shares: 2_800, publishedAt: '2026-06-22' },
        { id: 'v8', title: 'Quick: Traffic diversion routes explained in 30 secs', type: 'SHORT', plays: 88_200, completion: 95.2, durationSec: 30,   likes: 12_800, shares: 5_600, publishedAt: '2026-06-26' },
      ],
      playsTrend: Array.from({ length: 30 }, (_, i) => {
        const d = new Date('2026-06-27')
        d.setDate(d.getDate() - (29 - i))
        return {
          date: d.toISOString().slice(0, 10),
          plays: Math.round(100000 + Math.sin(i * 0.4) * 40000 + i * 3000 + Math.random() * 20000),
          liveViews: Math.round(i > 20 ? 20000 + Math.random() * 10000 : 5000 + Math.random() * 8000),
        }
      }),
      peakHours: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        plays: Math.round(
          h >= 8 && h <= 10 ? 85000 + Math.random() * 20000 :
          h >= 12 && h <= 14 ? 70000 + Math.random() * 15000 :
          h >= 18 && h <= 23 ? 160000 + Math.random() * 60000 :
          h >= 0 && h <= 5 ? 10000 + Math.random() * 5000 :
          30000 + Math.random() * 15000
        ),
      })),
      qualityBreakdown: [
        { quality: '1080p',  pct: 38.4, color: '#6366F1' },
        { quality: '720p',   pct: 34.2, color: '#0EA5E9' },
        { quality: '480p',   pct: 18.6, color: '#10B981' },
        { quality: '360p',   pct: 6.4,  color: '#F59E0B' },
        { quality: 'Auto',   pct: 2.4,  color: '#94A3B8' },
      ],
      completionBuckets: [
        { label: '0–25%',   pct: 14.2, viewers: 153_700 },
        { label: '25–50%',  pct: 21.6, viewers: 233_800 },
        { label: '50–75%',  pct: 28.4, viewers: 307_400 },
        { label: '75–100%', pct: 35.8, viewers: 387_500 },
      ],
    }
  }
)

export const getAdsAnalytics = withAuth(
  Permission.ANALYTICS_VIEW,
  async (_session): Promise<AdsAnalytics> => {
    return {
      overview: {
        impressions: 12_440_000, impressionsTrend: 18.2,
        clicks: 186_600, clicksTrend: 12.4,
        ctr: 1.50, ctrTrend: -0.3,
        revenue: 432_000, revenueTrend: 24.8,
        cpm: 34.8, cpmTrend: 5.6,
        fillRate: 87.4, fillTrend: 2.1,
      },
      revenueTrend: Array.from({ length: 30 }, (_, i) => {
        const d = new Date('2026-06-27')
        d.setDate(d.getDate() - (29 - i))
        return {
          date: d.toISOString().slice(0, 10),
          revenue: Math.round(10000 + Math.sin(i * 0.3) * 4000 + i * 600 + Math.random() * 3000),
          impressions: Math.round(320000 + Math.sin(i * 0.4) * 80000 + Math.random() * 50000),
          clicks: Math.round(4800 + Math.sin(i * 0.4) * 1200 + Math.random() * 800),
        }
      }),
      topCampaigns: [
        { id: 'ca1', name: 'Summer Sale 2026',          advertiser: 'BigBazaar',         impressions: 2_840_000, clicks: 56_800, ctr: 2.00, revenue: 98_800, cpm: 34.8, status: 'ACTIVE',   budget: 150_000, spent: 98_800 },
        { id: 'ca2', name: 'Independence Day Offers',   advertiser: 'Amazon India',       impressions: 1_920_000, clicks: 38_400, ctr: 2.00, revenue: 67_200, cpm: 35.0, status: 'ACTIVE',   budget: 120_000, spent: 67_200 },
        { id: 'ca3', name: 'New App Download Push',     advertiser: 'Swiggy',             impressions: 1_480_000, clicks: 22_200, ctr: 1.50, revenue: 52_800, cpm: 35.7, status: 'ACTIVE',   budget: 80_000,  spent: 52_800 },
        { id: 'ca4', name: 'Festive Season Awareness',  advertiser: 'Muthoot Finance',    impressions: 1_200_000, clicks: 14_400, ctr: 1.20, revenue: 42_000, cpm: 35.0, status: 'PAUSED',   budget: 60_000,  spent: 42_000 },
        { id: 'ca5', name: 'Insurance Open Enrolment',  advertiser: 'LIC',                impressions: 980_000,   clicks: 9_800,  ctr: 1.00, revenue: 34_600, cpm: 35.3, status: 'ACTIVE',   budget: 50_000,  spent: 34_600 },
        { id: 'ca6', name: 'Real Estate Projects Expo', advertiser: 'Prestige Group',     impressions: 740_000,   clicks: 14_800, ctr: 2.00, revenue: 26_200, cpm: 35.4, status: 'ACTIVE',   budget: 40_000,  spent: 26_200 },
        { id: 'ca7', name: 'Car Launch — City SUV',     advertiser: 'Tata Motors',        impressions: 620_000,   clicks: 12_400, ctr: 2.00, revenue: 22_000, cpm: 35.5, status: 'COMPLETED', budget: 25_000,  spent: 22_000 },
      ],
      bySlot: [
        { slot: 'Homepage Banner',     placement: 'Top',      impressions: 3_200_000, clicks: 64_000, ctr: 2.00, fillRate: 94.2, revenue: 112_000 },
        { slot: 'Article Inline 1',    placement: 'Mid',      impressions: 2_840_000, clicks: 42_600, ctr: 1.50, fillRate: 91.4, revenue: 99_400 },
        { slot: 'Video Pre-Roll',      placement: 'Pre-roll', impressions: 1_960_000, clicks: 41_160, ctr: 2.10, fillRate: 88.6, revenue: 88_200 },
        { slot: 'Article Inline 2',    placement: 'Bottom',   impressions: 1_740_000, clicks: 19_140, ctr: 1.10, fillRate: 82.4, revenue: 60_900 },
        { slot: 'Sidebar Right',       placement: 'Sidebar',  impressions: 1_480_000, clicks: 11_840, ctr: 0.80, fillRate: 78.2, revenue: 44_400 },
        { slot: 'App Interstitial',    placement: 'Full',     impressions: 980_000,   clicks: 7_840,  ctr: 0.80, fillRate: 86.4, revenue: 27_100 },
        { slot: 'Push Notification Ad', placement: 'Push',   impressions: 240_000,   clicks: 0,      ctr: 0.00, fillRate: 100,  revenue: 0 },
      ],
      byFormat: [
        { format: 'Display Banner',  impressions: 5_400_000, ctr: 1.20, revenue: 189_000, pct: 43.7, color: '#6366F1' },
        { format: 'Video Pre-Roll',  impressions: 1_960_000, ctr: 2.10, revenue: 88_200,  pct: 15.8, color: '#0EA5E9' },
        { format: 'Native Article',  impressions: 2_200_000, ctr: 1.80, revenue: 92_400,  pct: 17.7, color: '#10B981' },
        { format: 'Interstitial',    impressions: 980_000,   ctr: 0.80, revenue: 27_100,  pct: 7.9,  color: '#F59E0B' },
        { format: 'Sponsored Push',  impressions: 1_900_000, ctr: 1.40, revenue: 35_300,  pct: 15.3, color: '#8B5CF6' },
      ],
      revenueByType: [
        { type: 'Display',    revenue: 189_000, pct: 43.7, color: '#6366F1' },
        { type: 'Video',      revenue: 88_200,  pct: 20.4, color: '#0EA5E9' },
        { type: 'Native',     revenue: 92_400,  pct: 21.4, color: '#10B981' },
        { type: 'Sponsored',  revenue: 35_300,  pct: 8.2,  color: '#F59E0B' },
        { type: 'Other',      revenue: 27_100,  pct: 6.3,  color: '#94A3B8' },
      ],
    }
  }
)
