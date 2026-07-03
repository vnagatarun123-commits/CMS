'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, CheckCircle2, TrendingUp, Zap, Users2, Users,
  ArrowRight, ArrowUpRight, ArrowDownRight, Plus, Clock, Wallet,
  Check, X, Star, Flame, Activity, Image as ImageIcon, Radio, UserCheck,
} from 'lucide-react'
import type { User } from '@/types/auth'
import type { DashboardStats, ReviewQueueItem, TopStory, TopReporter, LiveStream, PendingApproval } from '@/app/actions/dashboard'
import { can } from '@/lib/rbac/can'
import { Permission } from '@/lib/rbac/permissions'
import { transitionContent } from '@/app/actions/content'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(name: string): string {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name.split(' ')[0] ?? name}`
}
function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtINR(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}k`
  return `₹${n.toLocaleString('en-IN')}`
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}
function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return (p.length >= 2 ? p[0]![0]! + p[p.length - 1]![0]! : name.slice(0, 2)).toUpperCase()
}

// ── Shared ──────────────────────────────────────────────────────────────────────

function Kpi({ label, value, icon: Icon, tint, trend, sub, href, live }: {
  label: string; value: React.ReactNode; icon: React.ElementType; tint: string
  trend?: { value: number }; sub?: string; href?: string; live?: boolean
}) {
  const positive = (trend?.value ?? 0) >= 0
  const card = (
    <div className={cn('rounded-2xl border bg-card ring-1 p-5 transition-shadow hover:shadow-[0_4px_16px_oklch(0_0_0/0.05)]',
      live ? 'ring-red-500/30' : 'ring-border/50')}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          {live && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>}
          {label}
        </span>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tint)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="mt-3 flex items-end gap-2.5">
        <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</span>
        {trend && (
          <span className={cn('mb-0.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold',
            positive ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/12 text-red-600 dark:text-red-400')}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] text-muted-foreground">{sub ?? (trend ? 'vs last week' : ' ')}</p>
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

function Panel({ title, badge, action, children, className }: {
  title: string; badge?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col rounded-2xl border bg-card ring-1 ring-border/50', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {badge}
        </div>
        {action}
      </div>
      <div className="p-5 flex-1">{children}</div>
    </div>
  )
}

function ViewAll({ href }: { href: string }) {
  return <Link href={href} className="flex items-center gap-0.5 text-[12.5px] font-medium text-primary hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
}

function Thumb({ url, className }: { url: string | null; className?: string }) {
  if (url) return <img src={url} alt="" className={cn('shrink-0 rounded-lg object-cover bg-muted', className)} />
  return <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/50', className)}><ImageIcon className="h-4 w-4" /></div>
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-36 gap-2 text-center">
      <Icon className="h-7 w-7 text-muted-foreground/30" />
      <p className="text-[13px] text-muted-foreground">{text}</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props { user: User; stats: DashboardStats | null }

export function DashboardClient({ user, stats }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  if (!stats) return <Empty icon={Activity} text="Unable to load dashboard data." />

  const { content, contributors, users, ads, notifications,
          live, publishingActivity, reviewQueue, pendingApprovals, topStories, topReporters } = stats
  const canCreate = can(user, Permission.CONTENT_CREATE)
  const canReview = can(user, Permission.CONTENT_REVIEW)

  function approve(id: string) {
    start(async () => {
      const r = await transitionContent({ contentId: id, toStatus: 'PUBLISHED' })
      if (r.ok) { toast.success('Story published'); router.refresh() }
      else toast.error(r.error.message)
    })
  }

  const chartMax = Math.max(1, ...(publishingActivity ?? []).map(d => Math.max(d.submitted, d.published)))
  const hasApprovals = (reviewQueue?.length ?? 0) > 0 || (pendingApprovals?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{greeting(user.name)}</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{todayLabel()} · Here's what's happening on PuraLocal.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-[12px] font-medium text-muted-foreground">{roleLabel(user.role)}</span>
          {canCreate && (
            <Link href="/dashboard/content" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Add Content
            </Link>
          )}
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {live && (
          <Kpi label="Live Now" value={live.now} icon={Radio} tint="bg-red-500/12 text-red-600 dark:text-red-400" live
            sub={live.upcoming > 0 ? `${live.upcoming} upcoming` : 'streams on air'} href="/dashboard/content/live" />
        )}
        {content && (
          <Kpi label="Total Content" value={content.total} icon={FileText} tint="bg-primary/10 text-primary"
            trend={{ value: content.createdDelta }} sub={`${content.createdThisWeek} added this week`} href="/dashboard/content" />
        )}
        {content && (
          <Kpi label="Published" value={content.published} icon={CheckCircle2} tint="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
            sub={`${content.publishedThisWeek} this week`} href="/dashboard/content" />
        )}
        {content && (
          <Kpi label="Pending Reviews" value={content.underReview} icon={Clock} tint="bg-amber-500/12 text-amber-600 dark:text-amber-400"
            sub={content.needsClarification > 0 ? `${content.needsClarification} need clarification` : 'All reviewed'} href="/dashboard/content" />
        )}
        {contributors && (
          <Kpi label="Contributors" value={contributors.total} icon={Users2} tint="bg-violet-500/12 text-violet-600 dark:text-violet-400"
            sub={`${contributors.pending} pending approval`} href="/dashboard/contributors" />
        )}
        {ads && (
          <Kpi label="Ad Revenue" value={fmtINR(ads.totalRevenue)} icon={Wallet} tint="bg-teal-500/12 text-teal-600 dark:text-teal-400"
            sub={`${ads.active} active campaigns`} href="/dashboard/ads" />
        )}
        {users && !ads && (
          <Kpi label="App Users" value={fmtNum(users.total)} icon={Users} tint="bg-orange-500/12 text-orange-600 dark:text-orange-400"
            sub="Registered readers" href="/dashboard/users" />
        )}
      </div>

      {/* ── Publishing activity + Live now ──────────────────────────────────── */}
      {content && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Panel className="lg:col-span-2" title="Publishing Activity" action={<span className="text-[12px] text-muted-foreground">Last 7 days</span>}>
            <div className="flex items-center gap-4 mb-4 text-[12px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Submitted</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Published</span>
            </div>
            <div className="flex items-end justify-between gap-3 h-44 pt-2">
              {(publishingActivity ?? []).map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2 min-w-0">
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div className="w-3.5 rounded-t bg-primary/80" style={{ height: `${(d.submitted / chartMax) * 100}%`, minHeight: d.submitted ? 4 : 0 }} title={`${d.submitted} submitted`} />
                    <div className="w-3.5 rounded-t bg-emerald-500" style={{ height: `${(d.published / chartMax) * 100}%`, minHeight: d.published ? 4 : 0 }} title={`${d.published} published`} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Live now */}
          <Panel title="Live Now"
            badge={live && live.now > 0
              ? <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />On air</span>
              : undefined}
            action={<ViewAll href="/dashboard/content/live" />}>
            {live && live.streams.length > 0 ? (
              <div className="flex flex-col gap-3">
                {live.streams.map(s => <LiveRow key={s.id} stream={s} />)}
                {live.upcoming > 0 && (
                  <Link href="/dashboard/content/live" className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-[12.5px] text-muted-foreground hover:text-foreground hover:border-solid transition-colors">
                    <Clock className="h-3.5 w-3.5" /> {live.upcoming} stream{live.upcoming > 1 ? 's' : ''} scheduled next
                  </Link>
                )}
              </div>
            ) : <Empty icon={Radio} text="No live streams on air." />}
          </Panel>
        </div>
      )}

      {/* ── Approvals center + Top reporters ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2" title="Approvals Center" action={<ViewAll href="/dashboard/content" />}>
          {hasApprovals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Stories awaiting review */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Stories to review</span>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{reviewQueue?.length ?? 0}</span>
                </div>
                <div className="flex flex-col divide-y -my-1">
                  {(reviewQueue ?? []).slice(0, 4).map(item => (
                    <ReviewRow key={item.id} item={item} canReview={canReview} pending={pending}
                      onApprove={() => approve(item.id)} onReject={() => router.push('/dashboard/content')} />
                  ))}
                  {(reviewQueue?.length ?? 0) === 0 && <p className="text-[12.5px] text-muted-foreground py-3">No stories awaiting review.</p>}
                </div>
              </div>
              {/* Reporter applications */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Reporter applications</span>
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{pendingApprovals?.length ?? 0}</span>
                </div>
                <div className="flex flex-col divide-y -my-1">
                  {(pendingApprovals ?? []).slice(0, 4).map(a => <ApprovalRow key={a.id} a={a} />)}
                  {(pendingApprovals?.length ?? 0) === 0 && <p className="text-[12.5px] text-muted-foreground py-3">No pending applications.</p>}
                </div>
              </div>
            </div>
          ) : <Empty icon={CheckCircle2} text="Nothing needs approval right now." />}
        </Panel>

        {/* Top reporters */}
        <Panel title="Top Reporters" action={<ViewAll href="/dashboard/contributors" />}>
          <div className="flex flex-col gap-1">
            {(topReporters ?? []).map((r, i) => <ReporterRow key={r.name} reporter={r} rank={i + 1} />)}
            {(!topReporters || topReporters.length === 0) && <Empty icon={Users2} text="No reporters yet" />}
          </div>
        </Panel>
      </div>

      {/* ── Top performing stories ──────────────────────────────────────────── */}
      {content && (
        <Panel title="Top Performing Stories" action={<ViewAll href="/dashboard/content" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {(topStories ?? []).map(s => <TopStoryRow key={s.id} story={s} />)}
            {(!topStories || topStories.length === 0) && <Empty icon={FileText} text="No stories yet" />}
          </div>
        </Panel>
      )}

      {!content && !contributors && !ads && (
        <Empty icon={Zap} text="Your dashboard is being configured for your role." />
      )}
    </div>
  )
}

// ── Rows ──────────────────────────────────────────────────────────────────────

function LiveRow({ stream }: { stream: LiveStream }) {
  return (
    <Link href="/dashboard/content/live" className="flex items-center gap-3 group">
      <div className="relative shrink-0">
        <Thumb url={stream.thumbnailUrl} className="h-11 w-16" />
        <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded bg-red-600 px-1 py-px text-[8px] font-bold uppercase text-white">
          <span className="h-1 w-1 rounded-full bg-white animate-pulse" />Live
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight truncate group-hover:text-primary transition-colors">{stream.title}</p>
        <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
          {stream.reporterName ?? 'Newsroom'}{stream.locationName ? ` · ${stream.locationName}` : ''}
        </p>
      </div>
    </Link>
  )
}

function ReviewRow({ item, canReview, pending, onApprove, onReject }: {
  item: ReviewQueueItem; canReview: boolean; pending: boolean; onApprove: () => void; onReject: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 py-2.5">
      <Thumb url={item.thumbnailUrl} className="h-10 w-14" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold leading-tight truncate">{item.title}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {item.reporterName ?? 'Unknown'}{item.locationName ? ` · ${item.locationName}` : ''} · {timeAgo(item.createdAt)}
        </p>
      </div>
      {canReview && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onApprove} disabled={pending} title="Approve & publish"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"><Check className="h-3.5 w-3.5" /></button>
          <button onClick={onReject} disabled={pending} title="Review & send back"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/12 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  )
}

function ApprovalRow({ a }: { a: PendingApproval }) {
  return (
    <Link href="/dashboard/contributors/approvals" className="flex items-center gap-2.5 py-2.5 group">
      {a.photoUrl
        ? <img src={a.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover bg-muted shrink-0" />
        : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-400 text-[12px] font-semibold shrink-0">{initials(a.name)}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold leading-tight truncate group-hover:text-primary transition-colors">{a.name}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {[a.designation, a.district].filter(Boolean).join(' · ') || 'Applicant'} · {timeAgo(a.appliedOn)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  )
}

function TopStoryRow({ story }: { story: TopStory }) {
  return (
    <Link href="/dashboard/content" className="flex items-center gap-3 group">
      <Thumb url={story.thumbnailUrl} className="h-11 w-16" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight truncate group-hover:text-primary transition-colors">{story.title}</p>
        <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">{[story.locationName, story.categoryName].filter(Boolean).join(' · ') || '—'}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {story.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
        {story.isTrending && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
        {story.isBreakingNews && <Flame className="h-3.5 w-3.5 text-red-500" />}
      </div>
    </Link>
  )
}

function ReporterRow({ reporter, rank }: { reporter: TopReporter; rank: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-4 text-[13px] font-bold text-muted-foreground/60 tabular-nums text-center shrink-0">{rank}</span>
      {reporter.photoUrl
        ? <img src={reporter.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover bg-muted shrink-0" />
        : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary text-[12px] font-semibold shrink-0">{initials(reporter.name)}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight truncate">{reporter.name}</p>
        <p className="text-[11.5px] text-muted-foreground">{reporter.stories} {reporter.stories === 1 ? 'story' : 'stories'}</p>
      </div>
    </div>
  )
}
