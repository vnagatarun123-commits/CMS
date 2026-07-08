'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Search, Users, Activity, CreditCard, AlertTriangle,
  X, MapPin, Filter, Eye, Ban, RotateCcw, ShieldOff,
  StickyNote, CheckCircle2, XCircle, AlertCircle,
  Play, Radio, Film, FileText, Signal, Download,
  ChevronRight, ChevronLeft, UserX, UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEED_APP_USERS } from '@/lib/mock/seed-app-users'
import type {
  AppUser, AppUserStatus, SubscriptionPlan,
  DevicePlatform, ConnectionType, UserType,
} from '@/types/app-user'
import { downloadCsv } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
function fmtDate(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function timeAgo(d: Date | null) {
  if (!d) return '—'
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}
function daysSince(d: Date | null) {
  if (!d) return null
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

function displayName(user: AppUser) {
  return user.name ?? `Guest · ${user.device.deviceId.slice(-6).toUpperCase()}`
}

// ── Badges ────────────────────────────────────────────────────────────────────

function UserTypeBadge({ type }: { type: UserType }) {
  if (type === 'guest') return (
    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
      <UserX className="h-2.5 w-2.5" />GUEST
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
      <UserCheck className="h-2.5 w-2.5" />REGISTERED
    </span>
  )
}

function StatusBadge({ status }: { status: AppUserStatus }) {
  const cfg: Record<AppUserStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    active:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Active' },
    inactive:  { cls: 'bg-gray-100 text-gray-500 border-gray-200',        icon: <XCircle className="h-3 w-3" />,      label: 'Inactive' },
    suspended: { cls: 'bg-amber-50 text-amber-700 border-amber-200',      icon: <AlertCircle className="h-3 w-3" />,  label: 'Suspended' },
    banned:    { cls: 'bg-red-50 text-red-600 border-red-200',            icon: <Ban className="h-3 w-3" />,          label: 'Banned' },
  }
  const { cls, icon, label } = cfg[status]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{icon}{label}</span>
}

function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  const cfg: Record<SubscriptionPlan, { cls: string; label: string }> = {
    premium: { cls: 'bg-violet-50 text-violet-700 border-violet-200', label: '★ Premium' },
    trial:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',       label: 'Trial' },
    free:    { cls: 'bg-gray-100 text-gray-500 border-gray-200',      label: 'Free' },
    expired: { cls: 'bg-red-50 text-red-500 border-red-200',          label: 'Expired' },
  }
  const { cls, label } = cfg[plan]
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
}

function ConnectionBadge({ type }: { type: ConnectionType }) {
  const cfg: Record<ConnectionType, string> = {
    '5g': 'text-violet-600 bg-violet-50', '4g': 'text-blue-600 bg-blue-50',
    'wifi': 'text-emerald-600 bg-emerald-50', '3g': 'text-amber-600 bg-amber-50',
    '2g': 'text-red-600 bg-red-50', 'unknown': 'text-gray-500 bg-gray-100',
  }
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${cfg[type]}`}>{type === 'wifi' ? 'WiFi' : type.toUpperCase()}</span>
}

function BufferHealth({ sec }: { sec: number }) {
  if (sec <= 0.5) return <span className="text-[11px] font-semibold text-emerald-600">{sec.toFixed(1)}s ✓</span>
  if (sec <= 2)   return <span className="text-[11px] font-semibold text-amber-600">{sec.toFixed(1)}s</span>
  return <span className="text-[11px] font-semibold text-red-600">{sec.toFixed(1)}s !</span>
}

function PlatformPill({ platform }: { platform: DevicePlatform }) {
  return platform === 'android'
    ? <span className="text-[10px] font-bold text-emerald-600">AND</span>
    : <span className="text-[10px] font-bold text-gray-600">iOS</span>
}

function AuthMethodPill({ method }: { method: AppUser['authMethod'] }) {
  if (!method) return <span className="text-[10px] text-muted-foreground">—</span>
  const cfg = { phone: 'text-blue-600', google: 'text-red-500', facebook: 'text-blue-800' }
  const label = { phone: 'OTP', google: 'Google', facebook: 'Facebook' }
  return <span className={`text-[10px] font-semibold ${cfg[method]}`}>{label[method]}</span>
}

// ── User avatar ───────────────────────────────────────────────────────────────

function UserAvatar({ user, lg }: { user: AppUser; lg?: boolean }) {
  const sz = lg ? 'h-10 w-10' : 'h-8 w-8'
  const isGuest = user.userType === 'guest'
  return (
    <div className="relative shrink-0">
      {!isGuest && user.avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={user.avatarUrl} alt={user.name ?? ''} className={`${sz} rounded-full object-cover border border-border`} />
        : <div className={`${sz} rounded-full border border-border flex items-center justify-center ${isGuest ? 'bg-orange-50' : 'bg-muted'}`}>
            {isGuest
              ? <UserX className="h-4 w-4 text-orange-400" />
              : <span className="text-xs font-bold text-muted-foreground">{user.name?.charAt(0)}</span>
            }
          </div>
      }
      {user.isOnline && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
      )}
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

type DetailTab = 'profile' | 'activity' | 'streaming' | 'network' | 'monetization'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-foreground text-right ml-4">{value ?? '—'}</span>
    </div>
  )
}
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function UserDetailPanel({ user, onClose, onStatusChange }: {
  user: AppUser
  onClose: () => void
  onStatusChange: (id: string, s: AppUserStatus) => void
}) {
  const [tab, setTab] = useState<DetailTab>('profile')
  const isGuest = user.userType === 'guest'

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'profile',      label: 'Profile' },
    { id: 'activity',     label: 'Activity' },
    { id: 'streaming',    label: 'Streaming' },
    { id: 'network',      label: 'Network' },
    { id: 'monetization', label: 'Monetization' },
  ]

  return (
    <div className="fixed inset-0 z-40 flex" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ml-auto h-full w-[440px] bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} lg />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{displayName(user)}</p>
                  {user.flaggedForReview && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                </div>
                <p className="text-[11px] text-muted-foreground">{user.phone ?? (isGuest ? 'No account' : '—')}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <UserTypeBadge type={user.userType} />
                  <StatusBadge status={user.status} />
                  <PlanBadge plan={user.monetization.subscriptionPlan} />
                </div>
              </div>
            </div>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Guest banner */}
          {isGuest && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 flex items-center justify-between mb-2">
              <div>
                <p className="text-[11px] font-semibold text-orange-700">Guest user — no account</p>
                <p className="text-[10px] text-orange-600">Watching as guest for {daysSince(user.guestSince)} days. No phone/OTP sign-up yet.</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => toast.info('Push sign-up prompt sent')}>
                Nudge to register
              </Button>
            </div>
          )}

          {/* Converted from guest banner */}
          {!isGuest && user.convertedToRegisteredAt && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 mb-2">
              <p className="text-[11px] font-semibold text-blue-700">Converted from guest</p>
              <p className="text-[10px] text-blue-600">
                Was a guest for {daysSince(user.guestSince! > user.convertedToRegisteredAt ? user.guestSince : user.guestSince)} days before signing up on {fmtDate(user.convertedToRegisteredAt)}.
              </p>
            </div>
          )}

          {/* Action buttons (registered only for moderation) */}
          {!isGuest && (
            <div className="flex gap-1.5 flex-wrap">
              {user.status === 'active' && (
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                  onClick={() => { onStatusChange(user.id, 'suspended'); toast.success('User suspended') }}>
                  <ShieldOff className="h-3 w-3" />Suspend
                </Button>
              )}
              {user.status === 'suspended' && (
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => { onStatusChange(user.id, 'active'); toast.success('User reinstated') }}>
                  <RotateCcw className="h-3 w-3" />Reinstate
                </Button>
              )}
              {user.status !== 'banned' && (
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => { onStatusChange(user.id, 'banned'); toast.success('User banned') }}>
                  <Ban className="h-3 w-3" />Ban
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                onClick={() => toast.info('Notes saved')}>
                <StickyNote className="h-3 w-3" />Add note
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-[11px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
                ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {tab === 'profile' && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identity</p>
                <div className="rounded-xl border border-border divide-y divide-border">
                  <Row label="User ID" value={<span className="font-mono text-[10px]">{user.id}</span>} />
                  <Row label="Type" value={<UserTypeBadge type={user.userType} />} />
                  {!isGuest && <Row label="Name" value={user.name} />}
                  {!isGuest && <Row label="Phone" value={user.phone} />}
                  {!isGuest && <Row label="Auth method" value={<AuthMethodPill method={user.authMethod} />} />}
                  {!isGuest && <Row label="Phone verified" value={user.phoneVerified ? '✓ Yes' : '✗ No'} />}
                  <Row label="Device ID" value={<span className="font-mono text-[10px]">{user.device.deviceId}</span>} />
                  {isGuest
                    ? <Row label="Guest since" value={fmtDate(user.guestSince)} />
                    : <Row label="Signed up" value={fmtDateTime(user.signedUpAt)} />
                  }
                  {!isGuest && user.convertedToRegisteredAt && (
                    <Row label="Converted from guest" value={fmtDate(user.convertedToRegisteredAt)} />
                  )}
                  {!isGuest && <Row label="Last login" value={fmtDateTime(user.lastLoginAt)} />}
                  {!isGuest && <Row label="Last sign-out" value={fmtDateTime(user.lastSignOutAt)} />}
                  {!isGuest && <Row label="Reporter status" value={<span className="capitalize">{user.reporterAppStatus}</span>} />}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Location</p>
                <div className="rounded-xl border border-border divide-y divide-border">
                  <Row label="City" value={user.location.city} />
                  <Row label="District" value={user.location.district} />
                  <Row label="State" value={user.location.state} />
                  <Row label="Pincode" value={user.location.pincode} />
                  <Row label="Coordinates" value={user.location.lat ? `${user.location.lat.toFixed(4)}, ${user.location.lng?.toFixed(4)}` : '—'} />
                  <Row label="Source" value={<span className="capitalize">{user.location.source}</span>} />
                  <Row label="Preferred news city" value={user.location.preferredNewsCity} />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Device</p>
                <div className="rounded-xl border border-border divide-y divide-border">
                  <Row label="Platform" value={<span className="capitalize">{user.device.platform}</span>} />
                  <Row label="Model" value={user.device.model} />
                  <Row label="OS version" value={user.device.osVersion} />
                  <Row label="App version" value={user.device.appVersion} />
                  <Row label="Push enabled" value={user.device.pushEnabled ? '✓ Yes' : '✗ No'} />
                  <Row label="Last known IP" value={<span className="font-mono text-[10px]">{user.device.lastKnownIp}</span>} />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acquisition</p>
                <div className="rounded-xl border border-border divide-y divide-border">
                  <Row label="Source" value={<span className="capitalize">{user.acquisition.source}</span>} />
                  <Row label="Store country" value={user.acquisition.storeCountry ?? '—'} />
                  <Row label="Campaign" value={user.acquisition.campaign ?? '—'} />
                  <Row label="Referral code" value={user.acquisition.referralCode ?? '—'} />
                  <Row label="First open" value={fmtDate(user.acquisition.firstOpenAt)} />
                </div>
              </div>

              {user.adminNotes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-semibold text-amber-700 mb-1">Admin Notes</p>
                  <p className="text-xs text-amber-800">{user.adminNotes}</p>
                </div>
              )}
            </>
          )}

          {tab === 'activity' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Total sessions" value={user.engagement.totalSessions} />
                <StatCard label="Avg session" value={`${user.engagement.avgSessionDurationMin.toFixed(1)} min`} />
                <StatCard label="Total time" value={`${user.engagement.totalTimeSpentHrs.toFixed(1)} hrs`} />
                <StatCard label="Active streak" value={`${user.engagement.dailyActiveStreak} days`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Content consumed</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: FileText, label: 'Articles read',  value: user.engagement.articlesRead },
                    { icon: Play,     label: 'Videos watched', value: user.engagement.videosWatched },
                    { icon: Radio,    label: 'Lives watched',  value: user.engagement.livesWatched },
                    { icon: Film,     label: 'Shorts watched', value: user.engagement.shortsWatched },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold text-foreground">{value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border divide-y divide-border">
                <Row label="Searches" value={user.engagement.searchesCount} />
                <Row label="Shares" value={user.engagement.sharesCount} />
                <Row label="Bookmarks" value={isGuest ? <span className="text-muted-foreground text-[10px]">Requires account</span> : user.engagement.bookmarksCount} />
                <Row label="Comments" value={isGuest ? <span className="text-muted-foreground text-[10px]">Requires account</span> : user.engagement.commentsCount} />
                <Row label="Notifications" value={user.engagement.notificationsEnabled ? '✓ Enabled' : '✗ Disabled'} />
                <Row label="Languages" value={user.engagement.preferredLanguages.join(', ')} />
                <Row label="Last active" value={fmtDateTime(user.engagement.lastActive)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.engagement.topCategories.map(c => (
                    <span key={c} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{c}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'streaming' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Avg buffering" value={`${user.streaming.avgBufferingTimeSec.toFixed(1)}s`}
                  sub={user.streaming.avgBufferingTimeSec <= 0.5 ? '✓ Excellent' : user.streaming.avgBufferingTimeSec <= 2 ? 'Acceptable' : '! Poor'} />
                <StatCard label="Buffering events" value={user.streaming.totalBufferingEvents} />
                <StatCard label="Avg bitrate" value={`${(user.streaming.avgBitrateKbps / 1000).toFixed(1)} Mbps`} />
                <StatCard label="Completion rate" value={`${user.streaming.contentCompletionRate}%`} />
              </div>
              <div className="rounded-xl border border-border divide-y divide-border">
                <Row label="Start failures" value={user.streaming.videoStartFailures} />
                <Row label="Avg watch duration" value={`${user.streaming.avgWatchDurationMin.toFixed(1)} min`} />
                <Row label="Quality preference" value={user.streaming.qualityPreference === 'auto' ? 'Auto (adaptive)' : user.streaming.qualityPreference} />
              </div>
              <div className="rounded-xl border border-border bg-muted/10 px-4 py-3">
                <div className="flex justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">Stream quality score</p>
                  <p className="text-xs font-bold">{user.network.networkQualityScore}/100</p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{ width: `${user.network.networkQualityScore}%`, backgroundColor: user.network.networkQualityScore >= 80 ? '#10b981' : user.network.networkQualityScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            </>
          )}

          {tab === 'network' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Bandwidth" value={`${user.network.avgBandwidthMbps.toFixed(1)} Mbps`} />
                <StatCard label="Quality score" value={`${user.network.networkQualityScore}/100`} />
              </div>
              <div className="rounded-xl border border-border divide-y divide-border">
                <Row label="ISP" value={user.network.isp} />
                <Row label="Connection" value={<ConnectionBadge type={user.network.connectionType} />} />
                <Row label="Avg bandwidth" value={`${user.network.avgBandwidthMbps.toFixed(1)} Mbps`} />
                <Row label="Last known IP" value={<span className="font-mono text-[10px]">{user.device.lastKnownIp}</span>} />
              </div>
              {user.network.networkQualityScore < 60 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Poor network quality</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">High buffering expected. Serve lower quality streams or enable adaptive bitrate.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'monetization' && (
            <>
              {isGuest && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-xs font-semibold text-orange-700">Guest users cannot subscribe</p>
                  <p className="text-[11px] text-orange-600 mt-0.5">They must register with a phone number to access Premium or Trial plans.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Revenue" value={`₹${user.monetization.totalRevenueInr.toLocaleString('en-IN')}`} />
                <StatCard label="Ad impressions" value={fmt(user.monetization.adImpressions)} />
                <StatCard label="Ad clicks" value={fmt(user.monetization.adClicks)} />
                <StatCard label="CTR" value={`${user.monetization.ctr.toFixed(1)}%`} />
              </div>
              <div className="rounded-xl border border-border divide-y divide-border">
                <Row label="Plan" value={<PlanBadge plan={user.monetization.subscriptionPlan} />} />
                <Row label="Plan name" value={user.monetization.planName} />
                <Row label="Started" value={fmtDate(user.monetization.subscriptionStartedAt)} />
                <Row label="Expires" value={fmtDate(user.monetization.subscriptionExpiresAt)} />
                <Row label="Premium candidate" value={user.monetization.isPremiumCandidate ? '★ Yes (ML flagged)' : 'No'} />
              </div>
              {user.monetization.isPremiumCandidate && user.monetization.subscriptionPlan === 'free' && !isGuest && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                  <p className="text-xs font-semibold text-violet-700">Conversion opportunity</p>
                  <p className="text-[11px] text-violet-600 mt-0.5">High likelihood to convert. Send targeted offer.</p>
                  <Button size="sm" className="mt-2 h-7 text-[11px] bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => toast.success('Premium offer sent!')}>
                    Send premium offer
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Filters ───────────────────────────────────────────────────────────────────

interface Filters {
  search: string
  userType: UserType | 'all'
  status: AppUserStatus | 'all'
  plan: SubscriptionPlan | 'all'
  platform: DevicePlatform | 'all'
  connection: ConnectionType | 'all'
  onlineOnly: boolean
  flaggedOnly: boolean
}

const DEFAULT_FILTERS: Filters = {
  search: '', userType: 'all', status: 'all', plan: 'all',
  platform: 'all', connection: 'all', onlineOnly: false, flaggedOnly: false,
}

// ── Main component ────────────────────────────────────────────────────────────

export function UserManagementClient() {
  const [users, setUsers]             = useState<AppUser[]>(SEED_APP_USERS)
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS)
  const [detail, setDetail]           = useState<AppUser | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  function setFilter<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(prev => ({ ...prev, [k]: v }))
  }

  function changeStatus(id: string, status: AppUserStatus) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
    setDetail(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  const filtered = useMemo(() => {
    let list = users
    if (filters.onlineOnly)            list = list.filter(u => u.isOnline)
    if (filters.flaggedOnly)           list = list.filter(u => u.flaggedForReview)
    if (filters.userType !== 'all')    list = list.filter(u => u.userType === filters.userType)
    if (filters.status !== 'all')      list = list.filter(u => u.status === filters.status)
    if (filters.plan !== 'all')        list = list.filter(u => u.monetization.subscriptionPlan === filters.plan)
    if (filters.platform !== 'all')    list = list.filter(u => u.device.platform === filters.platform)
    if (filters.connection !== 'all')  list = list.filter(u => u.network.connectionType === filters.connection)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter(u =>
        (u.name?.toLowerCase().includes(q)) ||
        u.phone?.includes(q) ||
        u.location.city.toLowerCase().includes(q) ||
        u.network.isp.toLowerCase().includes(q) ||
        u.device.deviceId.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
      )
    }
    return list
  }, [users, filters])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage  = Math.min(page, pageCount)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const total      = users.length
  const guests     = users.filter(u => u.userType === 'guest').length
  const registered = users.filter(u => u.userType === 'registered').length
  const online     = users.filter(u => u.isOnline).length
  const premium    = users.filter(u => u.monetization.subscriptionPlan === 'premium').length
  const flagged    = users.filter(u => u.flaggedForReview).length
  const avgBuffer  = (users.reduce((s, u) => s + u.streaming.avgBufferingTimeSec, 0) / total).toFixed(2)

  const activeFilters = Object.entries(filters).filter(([k, v]) =>
    k !== 'search' && v !== 'all' && v !== false,
  ).length + (filters.search ? 1 : 0)

  function exportCsv() {
    const rows = filtered.map(u => ({
      'ID':              u.id,
      'Name':            u.name ?? '',
      'Phone':           u.phone ?? '',
      'Type':            u.userType,
      'Status':          u.status,
      'City':            u.location.city,
      'State':           u.location.state,
      'Platform':        u.device.platform,
      'Device Model':    u.device.model,
      'Connection':      u.network.connectionType,
      'ISP':             u.network.isp,
      'Auth Method':     u.authMethod,
      'Plan':            u.monetization.subscriptionPlan,
      'Total Sessions':  u.engagement.totalSessions,
      'Avg Session (min)': u.engagement.avgSessionDurationMin,
      'Content Completion %': u.streaming.contentCompletionRate,
      'Avg Buffering (s)': u.streaming.avgBufferingTimeSec,
      'Flagged':         u.flaggedForReview ? 'Yes' : 'No',
      'Online':          u.isOnline ? 'Yes' : 'No',
      'Last Active':     u.engagement.lastActive ? u.engagement.lastActive.toISOString() : '',
      'Joined':          (u.signedUpAt ?? u.guestSince)?.toISOString() ?? '',
    }))
    downloadCsv('users.csv', rows)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between px-1 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            App users — guests watching without account, and registered users signed up via phone OTP
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {[
          { label: 'Total',      value: total,      icon: Users,        color: 'text-foreground',  bg: 'bg-muted/50' },
          { label: 'Guests',     value: guests,     icon: UserX,        color: 'text-orange-600',  bg: 'bg-orange-50' },
          { label: 'Registered', value: registered, icon: UserCheck,    color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Online now', value: online,     icon: Activity,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Premium',    value: premium,    icon: CreditCard,   color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Flagged',    value: flagged,    icon: AlertTriangle,color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Avg Buffer', value: `${avgBuffer}s`, icon: Signal,  color: 'text-blue-600',    bg: 'bg-blue-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-3 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Name, phone, city, ISP, device ID…"
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        {/* User type quick filter */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          {(['all', 'guest', 'registered'] as const).map(t => (
            <button key={t} onClick={() => setFilter('userType', t)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize
                ${filters.userType === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'all' ? 'All users' : t === 'guest' ? `Guests (${guests})` : `Registered (${registered})`}
            </button>
          ))}
        </div>

        <button onClick={() => setShowFilters(p => !p)}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-colors
            ${showFilters || activeFilters > 0 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
          <Filter className="h-3.5 w-3.5" />More filters
          {activeFilters > 0 && <span className="ml-0.5 h-4 w-4 rounded-full bg-background text-foreground text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
        </button>

        <button onClick={() => setFilter('onlineOnly', !filters.onlineOnly)}
          className={`h-8 flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-colors
            ${filters.onlineOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />Online
        </button>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} of {total} users</span>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 flex-wrap p-3 rounded-xl border border-border bg-muted/10">
          {[
            { label: 'Status', key: 'status' as const, opts: [['all','All'],['active','Active'],['inactive','Inactive'],['suspended','Suspended'],['banned','Banned']] },
            { label: 'Plan',   key: 'plan'   as const, opts: [['all','All'],['premium','Premium'],['trial','Trial'],['free','Free'],['expired','Expired']] },
            { label: 'Connection', key: 'connection' as const, opts: [['all','All'],['wifi','WiFi'],['5g','5G'],['4g','4G'],['3g','3G'],['2g','2G']] },
          ].map(({ label, key, opts }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground shrink-0">{label}:</span>
              {opts.map(([val, lbl]) => (
                <button key={val} onClick={() => setFilter(key, val as never)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors
                    ${(filters[key] as string) === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          ))}
          <button onClick={() => setFilters(DEFAULT_FILTERS)}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2">
            Reset all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto rounded-t-xl">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['S.No.', 'User', 'Type', 'Location', 'Device / ISP', 'Auth', 'Status', 'Plan', 'Sessions', 'Last Active', 'Buffering', 'Completion', ''].map(h => (
                  <th key={h} className={`py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h === 'S.No.' ? 'text-center w-10' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr><td colSpan={13} className="py-16 text-center text-sm text-muted-foreground">No users match filters</td></tr>
              ) : paginated.map((user, index) => (
                <tr key={user.id}
                  className={`hover:bg-muted/20 transition-colors cursor-pointer ${user.userType === 'guest' ? 'bg-orange-50/30' : ''}`}
                  onClick={() => setDetail(user)}>

                  <td className="py-3 px-3 text-center text-xs text-muted-foreground tabular-nums w-10">
                    {(safePage - 1) * pageSize + index + 1}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{displayName(user)}</p>
                          {user.flaggedForReview && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {user.phone ?? `ID: ${user.device.deviceId.slice(-6).toUpperCase()}`}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <UserTypeBadge type={user.userType} />
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-start gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{user.location.city}</p>
                        <p className="text-[10px] text-muted-foreground">{user.location.state}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <PlatformPill platform={user.device.platform} />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">{user.device.model.split(' ').slice(0, 2).join(' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ConnectionBadge type={user.network.connectionType} />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[70px]">{user.network.isp.split(' ')[0]}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <AuthMethodPill method={user.authMethod} />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <PlanBadge plan={user.monetization.subscriptionPlan} />
                  </td>

                  <td className="py-3 px-3">
                    <p className="text-xs font-semibold text-foreground">{user.engagement.totalSessions}</p>
                    <p className="text-[10px] text-muted-foreground">{user.engagement.avgSessionDurationMin.toFixed(1)} min avg</p>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <p className="text-xs text-foreground">{timeAgo(user.engagement.lastActive)}</p>
                    {user.engagement.dailyActiveStreak > 0 && (
                      <p className="text-[10px] text-muted-foreground">🔥 {user.engagement.dailyActiveStreak}d</p>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <BufferHealth sec={user.streaming.avgBufferingTimeSec} />
                    <p className="text-[10px] text-muted-foreground">{user.streaming.totalBufferingEvents} events</p>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${user.streaming.contentCompletionRate}%`, backgroundColor: user.streaming.contentCompletionRate >= 70 ? '#10b981' : user.streaming.contentCompletionRate >= 45 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground">{user.streaming.contentCompletionRate}%</span>
                    </div>
                  </td>

                  <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <button title="Details" onClick={() => setDetail(user)}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {!user.userType.includes('guest') && user.status === 'active' && (
                        <button title="Suspend" onClick={() => { changeStatus(user.id, 'suspended'); toast.success('Suspended') }}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors">
                          <ShieldOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">
                {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
              </span>{' '}
              of <span className="font-medium text-foreground">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Rows</span>
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="h-7 w-[70px] min-w-0 text-xs text-foreground font-medium rounded-md bg-background border-input px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pageCount || Math.abs(p - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(p); return acc
              }, [])
              .map((p, i) => p === '…'
                ? <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                : <button key={p} onClick={() => setPage(p as number)}
                    className={`h-7 w-7 rounded-md text-xs font-medium transition-colors
                      ${safePage === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    {p}
                  </button>
              )}
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount} title="Next"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <UserDetailPanel user={detail} onClose={() => setDetail(null)} onStatusChange={changeStatus} />
      )}
    </div>
  )
}
