'use client'

import Link from 'next/link'
import { useTransition, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, TrendingUp, Zap, Users2, Users,
  ArrowRight, ArrowUpRight, ArrowDownRight, Plus, Clock, Wallet,
  Check, X, Star, Flame, Activity, Image as ImageIcon, Radio, UserCheck,
  Video, LineChart, BarChart3, Film
} from 'lucide-react'
import type { User } from '@/types/auth'
import type { DashboardStats, ReviewQueueItem, TopStory, TopReporter, LiveStream, PendingApproval, RecentContentItem, PublishingDay } from '@/app/actions/dashboard'
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

// Format the current date localized to Indian English format
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

// Convert DB roles to readable labels
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

// ── Shared UI Components ──────────────────────────────────────────────────────────

function Kpi({ label, value, icon: Icon, tint, trend, sub, href, live, index = 0 }: {
  label: string; value: React.ReactNode; icon: React.ElementType; tint: string
  trend?: { value: number }; sub?: string; href?: string; live?: boolean; index?: number
}) {
  const positive = (trend?.value ?? 0) >= 0
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        'glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group',
        live ? 'border-red-500/40 ring-1 ring-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.06)]' : ''
      )}
    >
      {/* Background radial gradient overlay on hover */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors duration-300 pointer-events-none" />
      
      <div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            {live && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
            {label}
          </span>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-sm', tint)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-foreground">{value}</span>
          {trend && (
            <span className={cn('mb-0.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold',
              positive ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/12 text-red-600 dark:text-red-400')}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground font-medium">{sub ?? (trend ? 'vs last week' : ' ')}</p>
    </motion.div>
  )
  return href ? <Link href={href} className="cursor-pointer">{card}</Link> : card
}

function Panel({ title, badge, action, children, className }: {
  title: string; badge?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col rounded-2xl border bg-card ring-1 ring-border/50 shadow-sm overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/10">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold tracking-tight text-foreground">{title}</h3>
          {badge}
        </div>
        {action}
      </div>
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </div>
  )
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-0.5 text-[12.5px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer">
      View all <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
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

// ── Interactive Chart Component ──────────────────────────────────────────────────

function InteractiveChart({ data }: { data: PublishingDay[] }) {
  const [chartType, setChartType] = useState<'trend' | 'bar'>('trend')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  if (!data || data.length === 0) return null

  const submittedValues = data.map(d => d.submitted)
  const publishedValues = data.map(d => d.published)
  const maxValue = Math.max(1, ...submittedValues, ...publishedValues)
  const yTicks = [maxValue, Math.round(maxValue / 2), 0]

  const width = 560
  const height = 180
  const paddingLeft = 30
  const paddingRight = 15
  const paddingTop = 15
  const paddingBottom = 25

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth
  }
  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxValue) * chartHeight
  }

  let submittedPath = ''
  let publishedPath = ''
  let submittedAreaPath = ''
  let publishedAreaPath = ''

  if (chartType === 'trend' && data.length > 0) {
    const subPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.submitted) }))
    const pubPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.published) }))

    submittedPath = subPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')
    publishedPath = pubPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')

    const baselineY = paddingTop + chartHeight
    submittedAreaPath = `${submittedPath} L ${getX(data.length - 1)} ${baselineY} L ${getX(0)} ${baselineY} Z`
    publishedAreaPath = `${publishedPath} L ${getX(data.length - 1)} ${baselineY} L ${getX(0)} ${baselineY} Z`
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    
    const relativeX = x - (rect.width * (paddingLeft / width))
    const graphWidthRatio = rect.width * (chartWidth / width)
    const percentX = relativeX / graphWidthRatio
    const rawIndex = percentX * (data.length - 1)
    const index = Math.max(0, Math.min(data.length - 1, Math.round(rawIndex)))

    setHoveredIndex(index)

    const tooltipX = getX(index) * (rect.width / width)
    const yVal = Math.min(getY(data[index]!.submitted), getY(data[index]!.published))
    const tooltipY = yVal * (rect.height / height) - 45

    setTooltipPos({ x: tooltipX, y: tooltipY })
  }

  return (
    <div ref={containerRef} className="relative flex flex-col h-full w-full justify-between">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary shadow-sm shadow-primary/20" />
            Submitted
          </span>
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            Published
          </span>
        </div>
        
        {/* Toggle Option */}
        <div className="inline-flex rounded-lg bg-muted/60 p-0.5 border shadow-sm">
          <button
            onClick={() => setChartType('trend')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer",
              chartType === 'trend'
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LineChart className="h-3.5 w-3.5" />
            Trend
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer",
              chartType === 'bar'
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Bars
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <div className="flex-1 w-full min-h-[160px] relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="submittedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="publishedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick)
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.75"
                  strokeDasharray={tick === 0 ? "0" : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground font-mono text-[9.5px] font-semibold"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* X Category labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-bold"
            >
              {d.label}
            </text>
          ))}

          {/* Render Area/Line Chart */}
          {chartType === 'trend' && (
            <>
              <motion.path d={submittedAreaPath} fill="url(#submittedGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
              <motion.path d={publishedAreaPath} fill="url(#publishedGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

              <motion.path
                d={submittedPath}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
              <motion.path
                d={publishedPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />

              {data.map((d, i) => (
                <g key={i}>
                  <circle cx={getX(i)} cy={getY(d.submitted)} r="3.5" className="fill-card stroke-primary stroke-[2]" />
                  <circle cx={getX(i)} cy={getY(d.published)} r="3.5" className="fill-card stroke-emerald-500 stroke-[2]" />
                </g>
              ))}

              {hoveredIndex !== null && (
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingTop}
                  x2={getX(hoveredIndex)}
                  y2={height - paddingBottom}
                  stroke="var(--primary)"
                  strokeWidth="1.25"
                  strokeDasharray="3 3"
                  className="opacity-60 pointer-events-none"
                />
              )}
            </>
          )}

          {/* Render Bar Chart */}
          {chartType === 'bar' && (
            <g>
              {data.map((d, i) => {
                const groupX = getX(i)
                const barWidth = 8
                const gap = 3
                const xSub = groupX - barWidth - gap/2
                const xPub = groupX + gap/2
                const yBaseline = paddingTop + chartHeight
                const heightSub = yBaseline - getY(d.submitted)
                const heightPub = yBaseline - getY(d.published)

                return (
                  <g key={i}>
                    {/* Submitted Rect */}
                    <motion.rect
                      x={xSub}
                      width={barWidth}
                      rx="2"
                      className="fill-primary/90 hover:fill-primary transition-colors cursor-pointer"
                      initial={{ y: yBaseline, height: 0 }}
                      animate={{ y: getY(d.submitted), height: Math.max(2, heightSub) }}
                      transition={{ duration: 0.35, delay: i * 0.03 }}
                    />
                    {/* Published Rect */}
                    <motion.rect
                      x={xPub}
                      width={barWidth}
                      rx="2"
                      className="fill-emerald-500/90 hover:fill-emerald-500 transition-colors cursor-pointer"
                      initial={{ y: yBaseline, height: 0 }}
                      animate={{ y: getY(d.published), height: Math.max(2, heightPub) }}
                      transition={{ duration: 0.35, delay: i * 0.03 }}
                    />
                  </g>
                )
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: tooltipPos.y + 4 }}
              animate={{ opacity: 1, scale: 1, y: tooltipPos.y }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                transform: 'translateX(-50%)',
              }}
              className="z-50 pointer-events-none rounded-xl border bg-card/95 backdrop-blur-md p-2.5 shadow-glass ring-1 ring-border/30 text-[11.5px] min-w-[120px] flex flex-col gap-1"
            >
              <div className="font-bold text-foreground border-b pb-1 text-center mb-0.5">
                {data[hoveredIndex]!.label}
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Submitted
                </span>
                <span className="font-bold text-foreground tabular-nums">{data[hoveredIndex]!.submitted}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Published
                </span>
                <span className="font-bold text-foreground tabular-nums">{data[hoveredIndex]!.published}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main Dashboard Client ────────────────────────────────────────────────────────

interface Props { user: User; stats: DashboardStats | null }

export function DashboardClient({ user, stats }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  if (!stats) return <Empty icon={Activity} text="Unable to load dashboard data." />

  const { content, contributors, users, ads, notifications,
          live, publishingActivity, reviewQueue, pendingApprovals, topStories, topReporters, recentContent } = stats
  const canCreate = can(user, Permission.CONTENT_CREATE)
  const canReview = can(user, Permission.CONTENT_REVIEW)

  function approve(id: string) {
    start(async () => {
      const r = await transitionContent({ contentId: id, toStatus: 'PUBLISHED' })
      if (r.ok) { toast.success('Story published'); router.refresh() }
      else toast.error(r.error.message)
    })
  }

  const hasApprovals = (reviewQueue?.length ?? 0) > 0 || (pendingApprovals?.length ?? 0) > 0

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting(user.name)}</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{todayLabel()} · Here's what's happening on PuraLocal.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full bg-muted border px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">{roleLabel(user.role)}</span>
          {canCreate && (
            <Link href="/dashboard/content" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[13.5px] font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors cursor-pointer">
              <Plus className="h-4 w-4" /> Add Content
            </Link>
          )}
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {live && (
          <Kpi label="Live Now" value={live.now} icon={Radio} tint="icon-red" live
            sub={live.upcoming > 0 ? `${live.upcoming} upcoming` : 'streams on air'} href="/dashboard/content/live" index={0} />
        )}
        {content && (
          <Kpi label="Total Content" value={content.total} icon={FileText} tint="icon-indigo"
            trend={{ value: content.createdDelta }} sub={`${content.createdThisWeek} added this week`} href="/dashboard/content" index={1} />
        )}
        {content && (
          <Kpi label="Published" value={content.published} icon={CheckCircle2} tint="icon-emerald"
            sub={`${content.publishedThisWeek} this week`} href="/dashboard/content" index={2} />
        )}
        {content && (
          <Kpi label="Pending Reviews" value={content.underReview} icon={Clock} tint="icon-amber"
            sub={content.needsClarification > 0 ? `${content.needsClarification} need clarification` : 'All reviewed'} href="/dashboard/content" index={3} />
        )}
        {contributors && (
          <Kpi label="Contributors" value={contributors.total} icon={Users2} tint="icon-violet"
            sub={`${contributors.pending} pending approval`} href="/dashboard/contributors" index={4} />
        )}
        {ads && (
          <Kpi label="Ad Revenue" value={fmtINR(ads.totalRevenue)} icon={Wallet} tint="icon-teal"
            sub={`${ads.active} active campaigns`} href="/dashboard/ads" index={5} />
        )}
        {users && !ads && (
          <Kpi label="App Users" value={fmtNum(users.total)} icon={Users} tint="icon-orange"
            sub="Registered readers" href="/dashboard/users" index={5} />
        )}
      </div>

      {/* ── Row 1: Publishing activity + Live now ──────────────────────────────────── */}
      {content && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Panel className="lg:col-span-2" title="Publishing Activity" action={<span className="text-[12px] text-muted-foreground font-semibold">Last 7 days</span>}>
            <InteractiveChart data={publishingActivity ?? []} />
          </Panel>

          {/* Live now */}
          <Panel title="Live Now"
            badge={live && live.now > 0
              ? <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />On air</span>
              : undefined}
            action={<ViewAll href="/dashboard/content/live" />}>
            {live && live.streams.length > 0 ? (
              <div className="flex flex-col gap-2">
                {live.streams.map(s => <LiveRow key={s.id} stream={s} />)}
                {live.upcoming > 0 && (
                  <Link href="/dashboard/content/live" className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground hover:border-solid transition-all cursor-pointer">
                    <Clock className="h-4 w-4" /> {live.upcoming} stream{live.upcoming > 1 ? 's' : ''} scheduled next
                  </Link>
                )}
              </div>
            ) : <Empty icon={Radio} text="No live streams on air." />}
          </Panel>
        </div>
      )}

      {/* ── Row 2: Approvals center + Top reporters ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2" title="Approvals Center" action={<ViewAll href="/dashboard/content" />}>
          {hasApprovals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Stories awaiting review */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">Stories to review</span>
                  <span className="text-[11px] font-bold text-muted-foreground/80 bg-muted/80 px-1.5 py-0.5 rounded-md tabular-nums">{reviewQueue?.length ?? 0}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(reviewQueue ?? []).slice(0, 4).map(item => (
                    <ReviewRow key={item.id} item={item} canReview={canReview} pending={pending}
                      onApprove={() => approve(item.id)} onReject={() => router.push('/dashboard/content')} />
                  ))}
                  {(reviewQueue?.length ?? 0) === 0 && <p className="text-[12.5px] text-muted-foreground py-3">No stories awaiting review.</p>}
                </div>
              </div>
              {/* Reporter applications */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">Reporter applications</span>
                  <span className="text-[11px] font-bold text-muted-foreground/80 bg-muted/80 px-1.5 py-0.5 rounded-md tabular-nums">{pendingApprovals?.length ?? 0}</span>
                </div>
                <div className="flex flex-col gap-1.5">
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

      {/* ── Row 3: Recent Activity + Top performing stories ────────────────────── */}
      {content && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Content Feed */}
          <Panel className="lg:col-span-2" title="Recent Content Activity" action={<ViewAll href="/dashboard/content" />}>
            {recentContent && recentContent.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                {recentContent.slice(0, 8).map(item => (
                  <RecentContentRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Empty icon={FileText} text="No recent content activity." />
            )}
          </Panel>

          {/* Top performing stories */}
          <Panel title="Top Performing Stories" action={<ViewAll href="/dashboard/content" />}>
            <div className="flex flex-col gap-1">
              {(topStories ?? []).slice(0, 5).map(s => <TopStoryRow key={s.id} story={s} />)}
              {(!topStories || topStories.length === 0) && <Empty icon={FileText} text="No stories yet" />}
            </div>
          </Panel>
        </div>
      )}

      {!content && !contributors && !ads && (
        <Empty icon={Zap} text="Your dashboard is being configured for your role." />
      )}
    </motion.div>
  )
}

// ── Rows & Item Card Components ──────────────────────────────────────────────────

function LiveRow({ stream }: { stream: LiveStream }) {
  return (
    <Link href="/dashboard/content/live" className="flex items-center gap-3 group p-1.5 rounded-xl hover:bg-muted/40 transition-all duration-200 cursor-pointer">
      <div className="relative shrink-0 overflow-hidden rounded-lg">
        <Thumb url={stream.thumbnailUrl} className="h-11 w-16 group-hover:scale-105 transition-transform duration-300" />
        <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded bg-red-600 px-1 py-0.5 text-[8px] font-bold uppercase text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Live
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug truncate group-hover:text-primary transition-colors duration-200 text-foreground">{stream.title}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {stream.reporterName ?? 'Newsroom'}{stream.locationName ? ` · ${stream.locationName}` : ''}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
    </Link>
  )
}

function ReviewRow({ item, canReview, pending, onApprove, onReject }: {
  item: ReviewQueueItem; canReview: boolean; pending: boolean; onApprove: () => void; onReject: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-2 hover:bg-muted/30 rounded-xl transition-all duration-200 group">
      <Thumb url={item.thumbnailUrl} className="h-10 w-14 rounded-lg group-hover:scale-[1.02] transition-transform duration-200" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold leading-snug truncate group-hover:text-primary transition-colors duration-200 text-foreground">{item.title}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {item.reporterName ?? 'Unknown'}{item.locationName ? ` · ${item.locationName}` : ''} · {timeAgo(item.createdAt)}
        </p>
      </div>
      {canReview && (
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={onApprove} 
            disabled={pending} 
            title="Approve & publish"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-4 w-4" />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={onReject} 
            disabled={pending} 
            title="Review & send back"
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-red-500/12 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      )}
    </div>
  )
}

function ApprovalRow({ a }: { a: PendingApproval }) {
  return (
    <Link href="/dashboard/contributors/approvals" className="flex items-center gap-2.5 py-2 px-2 hover:bg-muted/30 rounded-xl transition-all duration-200 group cursor-pointer">
      {a.photoUrl
        ? <img src={a.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover bg-muted shrink-0 shadow-sm border border-border/40" />
        : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-400 text-[12px] font-semibold shrink-0 shadow-sm">{initials(a.name)}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold leading-tight truncate group-hover:text-primary transition-colors duration-200 text-foreground">{a.name}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {[a.designation, a.district].filter(Boolean).join(' · ') || 'Applicant'} · {timeAgo(a.appliedOn)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
    </Link>
  )
}

function TopStoryRow({ story }: { story: TopStory }) {
  return (
    <Link href="/dashboard/content" className="flex items-center gap-3 p-1.5 hover:bg-muted/30 rounded-xl transition-all duration-200 group cursor-pointer">
      <Thumb url={story.thumbnailUrl} className="h-11 w-16 rounded-lg group-hover:scale-[1.02] transition-transform duration-200" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug truncate group-hover:text-primary transition-colors duration-200 text-foreground">{story.title}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-semibold">
          {[story.locationName, story.categoryName].filter(Boolean).join(' · ') || 'General'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 bg-muted/60 p-1.5 rounded-lg shadow-sm border border-border/40">
        {story.isFeatured && <span title="Featured"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /></span>}
        {story.isTrending && <span title="Trending"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /></span>}
        {story.isBreakingNews && <span title="Breaking News"><Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" /></span>}
      </div>
    </Link>
  )
}

function ReporterRow({ reporter, rank }: { reporter: TopReporter; rank: number }) {
  const medalColor = 
    rank === 1 ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30' :
    rank === 2 ? 'bg-slate-400/12 text-slate-600 dark:text-slate-300 border-slate-400/30' :
    rank === 3 ? 'bg-amber-700/12 text-amber-700 dark:text-amber-500 border-amber-700/30' :
    'bg-muted/50 text-muted-foreground border-transparent'

  return (
    <div className="flex items-center gap-3 py-2 px-1.5 rounded-xl hover:bg-muted/30 transition-all duration-200 group">
      <span className={cn(
        "w-6 h-6 rounded-full border text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums shadow-sm",
        medalColor
      )}>
        {rank}
      </span>
      {reporter.photoUrl
        ? <img src={reporter.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover bg-muted shrink-0 shadow-sm border border-border/40" />
        : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary text-[12px] font-semibold shrink-0 shadow-sm">{initials(reporter.name)}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight text-foreground group-hover:text-primary transition-colors duration-200">{reporter.name}</p>
        <p className="text-[11.5px] text-muted-foreground mt-0.5 font-semibold">{reporter.stories} {reporter.stories === 1 ? 'story' : 'stories'}</p>
      </div>
    </div>
  )
}

function RecentContentRow({ item }: { item: RecentContentItem }) {
  const Icon = 
    item.type === 'IMAGE' ? ImageIcon :
    item.type === 'VIDEO' ? Video :
    item.type === 'SHORT' ? Zap :
    item.type === 'LIVE' ? Radio :
    item.type === 'YOUTUBE' ? Film :
    FileText

  const statusClass = 
    item.status === 'DRAFT' ? 'bg-[var(--status-draft-bg)] text-[var(--status-draft-text)]' :
    item.status === 'UNDER_REVIEW' ? 'bg-[var(--status-under-review-bg)] text-[var(--status-under-review-text)]' :
    item.status === 'NEEDS_CLARIFICATION' ? 'bg-[var(--status-needs-clarification-bg)] text-[var(--status-needs-clarification-text)]' :
    item.status === 'SCHEDULED' ? 'bg-[var(--status-scheduled-bg)] text-[var(--status-scheduled-text)]' :
    item.status === 'PUBLISHED' ? 'bg-[var(--status-published-bg)] text-[var(--status-published-text)]' :
    'bg-muted text-muted-foreground'

  return (
    <Link href="/dashboard/content" className="flex items-center justify-between gap-3 py-2 px-2 hover:bg-muted/30 rounded-xl transition-all duration-200 group cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-muted text-muted-foreground/70 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold leading-snug truncate text-foreground group-hover:text-primary transition-colors duration-200">
            {item.title}
          </p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            By {item.reporterName ?? 'Newsroom'} · {timeAgo(item.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm", statusClass)}>
          {item.status.toLowerCase().replace(/_/g, ' ')}
        </span>
      </div>
    </Link>
  )
}
