'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Bell, Smartphone, Mail, MessageSquare, Send, Clock, FileText,
  Users, ChevronRight, X, Check, Loader2, Zap, TrendingUp,
  BarChart2, Radio, Sparkles, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  NotificationRecord, NotificationTemplate, NotificationStats,
  NotificationChannel, NotificationAudience, NotificationPriority,
} from '@/types/domain'
import {
  listNotifications, getNotificationStats,
  createAndSendNotification, createScheduledNotification,
  saveDraftNotification, cancelNotification, deleteNotification,
} from '@/app/actions/notifications'

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  title: string
  body: string
  deepLink: string
  channels: NotificationChannel[]
  audience: NotificationAudience
  audienceValue: string
  priority: NotificationPriority
  scheduleMode: 'now' | 'schedule'
  scheduledAt: string
}

const EMPTY_FORM: FormState = {
  title: '', body: '', deepLink: '',
  channels: ['IN_APP', 'PUSH'] as NotificationChannel[],
  audience: 'APP_USERS' as NotificationAudience,
  audienceValue: '',
  priority: 'NORMAL' as NotificationPriority,
  scheduleMode: 'now', scheduledAt: '',
}

// ── Audience ──────────────────────────────────────────────────────────────────

const AUDIENCE_OPTS: { value: NotificationAudience; label: string; count: number }[] = [
  { value: 'APP_USERS',     label: 'All App Users',  count: 24500 },
  { value: 'REPORTERS',     label: 'Reporters',       count: 42 },
  { value: 'ALL_CMS_USERS', label: 'All CMS Staff',  count: 11 },
  { value: 'BY_ROLE',       label: 'By Role',         count: 0 },
  { value: 'ALL',           label: 'Everyone',        count: 24553 },
]

function audienceLabel(audience: NotificationAudience, audienceValue?: string | null) {
  if (audience === 'BY_ROLE' && audienceValue) return `Role: ${audienceValue}`
  return AUDIENCE_OPTS.find(o => o.value === audience)?.label ?? audience
}

function fmtNum(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }

function audienceEstimate(audience: NotificationAudience) {
  return AUDIENCE_OPTS.find(o => o.value === audience)?.count ?? 0
}

// ── Channel ───────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: {
  value: NotificationChannel
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  activeBg: string
  activeBorder: string
}[] = [
  { value: 'IN_APP',  label: 'In-App',  description: 'CMS + App banner',  icon: Bell,          color: 'text-violet-400', activeBg: 'bg-violet-500/10', activeBorder: 'border-violet-500/40' },
  { value: 'PUSH',    label: 'Push',    description: 'Mobile push alerts', icon: Smartphone,    color: 'text-blue-400',   activeBg: 'bg-blue-500/10',   activeBorder: 'border-blue-500/40' },
  { value: 'EMAIL',   label: 'Email',   description: 'Email delivery',     icon: Mail,          color: 'text-emerald-400',activeBg: 'bg-emerald-500/10',activeBorder: 'border-emerald-500/40' },
  { value: 'SMS',     label: 'SMS',     description: 'Text message',       icon: MessageSquare, color: 'text-amber-400',  activeBg: 'bg-amber-500/10',  activeBorder: 'border-amber-500/40' },
]

function ChannelIcon({ channel, className }: { channel: NotificationChannel; className?: string }) {
  const conf = CHANNEL_CONFIG.find(c => c.value === channel)
  if (!conf) return null
  const Icon = conf.icon
  return <Icon className={className} />
}

// ── Priority ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: {
  value: NotificationPriority
  label: string
  dot: string
  activeBg: string
  activeBorder: string
  activeText: string
  ring: string
}[] = [
  { value: 'LOW',    label: 'Low',    dot: 'bg-slate-400', activeBg: 'bg-slate-400/10',  activeBorder: 'border-slate-400/40', activeText: 'text-slate-300',  ring: 'ring-slate-400/20' },
  { value: 'NORMAL', label: 'Normal', dot: 'bg-blue-500',  activeBg: 'bg-blue-500/10',   activeBorder: 'border-blue-500/40',  activeText: 'text-blue-300',   ring: 'ring-blue-500/20' },
  { value: 'HIGH',   label: 'High',   dot: 'bg-amber-500', activeBg: 'bg-amber-500/10',  activeBorder: 'border-amber-500/40', activeText: 'text-amber-300',  ring: 'ring-amber-500/20' },
  { value: 'URGENT', label: 'Urgent', dot: 'bg-red-500',   activeBg: 'bg-red-500/10',    activeBorder: 'border-red-500/40',   activeText: 'text-red-300',    ring: 'ring-red-500/20' },
]

function PriorityDot({ priority }: { priority: NotificationPriority }) {
  const conf = PRIORITY_CONFIG.find(p => p.value === priority)
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${conf?.dot ?? 'bg-slate-400'}`} />
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  SENT:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  SCHEDULED: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  SENDING:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  DRAFT:     { bg: 'bg-slate-500/10',   text: 'text-slate-400',   dot: 'bg-slate-400' },
  FAILED:    { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400' },
  CANCELLED: { bg: 'bg-slate-500/10',   text: 'text-slate-500',   dot: 'bg-slate-500' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['DRAFT']!
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  )
}

// ── Category ──────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bar: string; dot: string; badge: string; gradientFrom: string }> = {
  content:   { bar: 'bg-red-500',    dot: 'bg-red-500',    badge: 'text-red-400 bg-red-500/10 border-red-500/20',       gradientFrom: 'from-red-500/10' },
  reporter:  { bar: 'bg-blue-500',   dot: 'bg-blue-500',   badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     gradientFrom: 'from-blue-500/10' },
  system:    { bar: 'bg-amber-500',  dot: 'bg-amber-500',  badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',  gradientFrom: 'from-amber-500/10' },
  marketing: { bar: 'bg-purple-500', dot: 'bg-purple-500', badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',gradientFrom: 'from-purple-500/10' },
}
const CATEGORY_DEFAULT = { bar: 'bg-slate-500', dot: 'bg-slate-500', badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20', gradientFrom: 'from-slate-500/10' }
function getCategoryStyle(cat: string) { return CATEGORY_STYLES[cat] ?? CATEGORY_DEFAULT }

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialNotifications: NotificationRecord[]
  initialStats: NotificationStats | null
  initialTemplates: NotificationTemplate[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationsClient({ initialNotifications, initialStats, initialTemplates }: Props) {
  const [tab, setTab] = useState<'compose' | 'history' | 'templates'>('compose')
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications)
  const [stats, setStats] = useState<NotificationStats | null>(initialStats)
  const [templates] = useState<NotificationTemplate[]>(initialTemplates)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  function refreshData(opts?: { status?: string; search?: string }) {
    startTransition(async () => {
      const [nr, sr] = await Promise.all([listNotifications(opts ?? {}), getNotificationStats()])
      if (nr.ok) setNotifications(nr.data)
      if (sr.ok) setStats(sr.data)
    })
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleChannel(ch: NotificationChannel) {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }))
  }

  function fillFromTemplate(tpl: NotificationTemplate) {
    setForm(f => ({ ...f, title: tpl.title, body: tpl.body, channels: tpl.channels, audience: tpl.audience, priority: tpl.priority }))
    setTab('compose')
  }

  function buildPayload() {
    return {
      title: form.title, body: form.body, deepLink: form.deepLink || null,
      channels: form.channels, audience: form.audience,
      audienceValue: form.audienceValue || null, priority: form.priority,
      scheduledAt: form.scheduleMode === 'schedule' && form.scheduledAt ? form.scheduledAt : null,
    }
  }

  function handleSend() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.body.trim()) { toast.error('Body is required'); return }
    if (form.channels.length === 0) { toast.error('Select at least one channel'); return }
    startTransition(async () => {
      const payload = buildPayload()
      const result = form.scheduleMode === 'schedule'
        ? await createScheduledNotification(payload)
        : await createAndSendNotification(payload)
      if (!result.ok) { toast.error(result.error.message); return }
      toast.success(form.scheduleMode === 'schedule' ? 'Notification scheduled!' : 'Notification sent!')
      setForm(EMPTY_FORM)
      refreshData()
    })
  }

  function handleSaveDraft() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.body.trim()) { toast.error('Body is required'); return }
    startTransition(async () => {
      const result = await saveDraftNotification(buildPayload())
      if (!result.ok) { toast.error(result.error.message); return }
      toast.success('Draft saved')
      setForm(EMPTY_FORM)
      refreshData()
    })
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      const result = await cancelNotification(id)
      if (!result.ok) { toast.error(result.error.message); return }
      toast.success('Notification cancelled')
      setNotifications(prev => prev.map(n => n.id === id ? result.data : n))
      const sr = await getNotificationStats()
      if (sr.ok) setStats(sr.data)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (!result.ok) { toast.error(result.error.message); return }
      toast.success('Notification deleted')
      setNotifications(prev => prev.filter(n => n.id !== id))
      const sr = await getNotificationStats()
      if (sr.ok) setStats(sr.data)
    })
  }

  const filteredNotifications = notifications.filter(n => {
    const matchStatus = statusFilter === 'all' || n.status === statusFilter.toUpperCase()
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const previewAudienceOpt = AUDIENCE_OPTS.find(o => o.value === form.audience)
  const previewRecipients = form.audience === 'BY_ROLE' ? '~5' : `~${fmtNum(previewAudienceOpt?.count ?? 0)}`

  const TABS = [
    { value: 'compose'   as const, label: 'Compose',   icon: Send,     count: null },
    { value: 'history'   as const, label: 'History',   icon: Clock,    count: notifications.length },
    { value: 'templates' as const, label: 'Templates', icon: FileText, count: templates.length },
  ]

  const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'sent', label: 'Sent' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'draft', label: 'Draft' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const templatesByCategory = templates.reduce<Record<string, NotificationTemplate[]>>((acc, t) => {
    const cat = t.category ?? 'system'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  const CATEGORY_ORDER = ['content', 'reporter', 'system', 'marketing']
  const CATEGORY_LABELS: Record<string, string> = { content: 'Content', reporter: 'Reporter', system: 'System', marketing: 'Marketing' }

  return (
    <div className="space-y-0">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex-shrink-0">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Notifications</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Send in-app, push, email &amp; SMS to your audience</p>
          </div>
        </div>
        {stats && (
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-foreground">{stats.openRate}%</span>&nbsp;open rate
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-foreground">{fmtNum(stats.totalDelivered)}</span>&nbsp;delivered
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 border-b border-border mb-5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.value
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200 whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  active ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: COMPOSE
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

          {/* ── Left: Form ─────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Quick templates */}
            {templates.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Quick Templates
                </p>
                <div className="flex gap-2 flex-wrap">
                  {templates.slice(0, 6).map(tpl => {
                    const style = getCategoryStyle(tpl.category ?? 'system')
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => fillFromTemplate(tpl)}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:border-indigo-500/40 hover:bg-indigo-500/5 text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-all duration-200 cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                        {tpl.name}
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity duration-150" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Message</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Title <span className="text-red-400 text-xs">*</span>
                    </label>
                    <span className={`text-xs tabular-nums ${form.title.length > 90 ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                      {form.title.length}/100
                    </span>
                  </div>
                  <Input
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Breaking: New metro line approved"
                    className="bg-background border-border"
                  />
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Body <span className="text-red-400 text-xs">*</span>
                    </label>
                    <span className={`text-xs tabular-nums ${form.body.length > 450 ? 'text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                      {form.body.length}/500
                    </span>
                  </div>
                  <textarea
                    value={form.body}
                    onChange={e => setField('body', e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="Notification message body…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
                  />
                </div>

                {/* Deep link */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Deep Link <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </label>
                  <Input
                    value={form.deepLink}
                    onChange={e => setField('deepLink', e.target.value)}
                    placeholder="puralocal://article/{slug}"
                    className="bg-background border-border font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Delivery Channels</h2>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CHANNEL_CONFIG.map(ch => {
                  const Icon = ch.icon
                  const checked = form.channels.includes(ch.value)
                  return (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => toggleChannel(ch.value)}
                      className={`flex flex-col items-start gap-2.5 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        checked
                          ? `${ch.activeBg} ${ch.activeBorder} shadow-sm`
                          : 'border-border bg-background hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 transition-colors ${checked ? ch.color : 'text-muted-foreground'}`} />
                        <span className={`flex items-center justify-center w-4 h-4 rounded transition-all duration-150 ${
                          checked ? 'bg-indigo-500' : 'border border-border bg-background'
                        }`}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{ch.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{ch.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Audience + Priority + Schedule */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Targeting &amp; Schedule</h2>
              </div>
              <div className="p-5 space-y-4">

                {/* Audience */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Audience</label>
                  <Select
                    value={form.audience}
                    onValueChange={v => setField('audience', v as NotificationAudience)}
                  >
                    <SelectTrigger className="w-full h-9 bg-background border-border text-foreground text-sm rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTS.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}{o.count > 0 ? ` (~${fmtNum(o.count)} users)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.audience === 'BY_ROLE' && (
                    <Input
                      value={form.audienceValue}
                      onChange={e => setField('audienceValue', e.target.value)}
                      placeholder="e.g. EDITOR, CONTENT_REVIEWER"
                      className="mt-2 bg-background border-border"
                    />
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITY_CONFIG.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setField('priority', p.value as NotificationPriority)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer ${
                          form.priority === p.value
                            ? `${p.activeBg} ${p.activeBorder} ${p.activeText} ring-1 ${p.ring}`
                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        <PriorityDot priority={p.value} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">When to Send</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setField('scheduleMode', 'now')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                        form.scheduleMode === 'now'
                          ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" /> Send Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setField('scheduleMode', 'schedule')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${
                        form.scheduleMode === 'schedule'
                          ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Schedule
                    </button>
                  </div>
                  {form.scheduleMode === 'schedule' && (
                    <Input
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e => setField('scheduledAt', e.target.value)}
                      className="bg-background border-border"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <Button variant="outline" onClick={handleSaveDraft} disabled={isPending} className="gap-2 cursor-pointer">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Save Draft
              </Button>
              <Button onClick={handleSend} disabled={isPending} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer">
                {isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : form.scheduleMode === 'schedule'
                    ? <Clock className="w-4 h-4" />
                    : <Send className="w-4 h-4" />
                }
                {form.scheduleMode === 'schedule' ? 'Schedule' : 'Send Now'}
              </Button>
            </div>
          </div>

          {/* ── Right: Preview ──────────────────────────────────────────────── */}
          <div className="xl:sticky xl:top-6 self-start space-y-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3 h-3" /> Live Preview
            </p>

            {/* Phone mockup */}
            <div className="relative bg-zinc-950 rounded-[28px] p-3.5 shadow-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-violet-500/5 pointer-events-none rounded-[28px]" />

              {/* Notch */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-[18px] bg-black rounded-full" />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-2 mb-4">
                <span className="text-[10px] text-white/40 font-semibold tabular-nums">9:41</span>
                <div className="flex items-center gap-0.5">
                  {['▪', '▪', '▪'].map((_, i) => (
                    <span key={i} className={`text-[8px] ${i < 2 ? 'text-white/40' : 'text-white/20'}`}>▪</span>
                  ))}
                </div>
              </div>

              {/* Notification toast */}
              <div className="mx-1 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-3.5 shadow-xl">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-white/90">PuraLocal</span>
                  </div>
                  <span className="text-[10px] text-white/35">now</span>
                  <X className="w-3 h-3 text-white/25" />
                </div>

                <p className="text-sm font-semibold text-white/90 leading-snug mb-1">
                  {form.title || <span className="text-white/25 font-normal italic text-xs">Notification title…</span>}
                </p>
                <p className="text-xs text-white/55 leading-relaxed line-clamp-3">
                  {form.body || <span className="italic text-white/25">Message body will appear here…</span>}
                </p>

                <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-white/10">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/45 flex items-center gap-1">
                    <Users className="w-2 h-2" />{previewRecipients}
                  </span>
                  {form.channels.map(ch => (
                    <span key={ch} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/45 flex items-center gap-1">
                      <ChannelIcon channel={ch} className="w-2 h-2" />{ch.replace('_', '-')}
                    </span>
                  ))}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/45 flex items-center gap-1">
                    <PriorityDot priority={form.priority} />{form.priority.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Home bar */}
              <div className="flex justify-center mt-4 pb-1">
                <div className="w-24 h-1 rounded-full bg-white/15" />
              </div>
            </div>

            {/* Channel delivery summary */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Channel Delivery</p>
              </div>
              <div className="p-3 space-y-1">
                {CHANNEL_CONFIG.map(ch => {
                  const Icon = ch.icon
                  const active = form.channels.includes(ch.value)
                  return (
                    <div key={ch.value} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${active ? 'bg-muted/40' : ''}`}>
                      <div className={`flex items-center gap-2 text-xs ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        <Icon className={`w-3.5 h-3.5 ${active ? ch.color : ''}`} />
                        <span className="font-medium">{ch.label}</span>
                        <span className="text-muted-foreground font-normal text-[10px]">{ch.description}</span>
                      </div>
                      {active
                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                        : <X className="w-3.5 h-3.5 text-muted-foreground/25" />
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: HISTORY
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="space-y-5">

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Sent',  value: stats.totalSent.toLocaleString(),        icon: Send,      iconColor: 'text-blue-400',    gradFrom: 'from-blue-500/10' },
                { label: 'Scheduled',   value: stats.totalScheduled.toLocaleString(),    icon: Clock,     iconColor: 'text-violet-400',  gradFrom: 'from-violet-500/10' },
                { label: 'Delivered',   value: fmtNum(stats.totalDelivered),             icon: Check,     iconColor: 'text-emerald-400', gradFrom: 'from-emerald-500/10' },
                { label: 'Opened',      value: fmtNum(stats.totalOpened),                icon: Bell,      iconColor: 'text-amber-400',   gradFrom: 'from-amber-500/10' },
                { label: 'Open Rate',   value: `${stats.openRate}%`,                     icon: BarChart2, iconColor: 'text-indigo-400',  gradFrom: 'from-indigo-500/10' },
              ].map(card => {
                const Icon = card.icon
                return (
                  <div key={card.label} className={`rounded-xl border border-border bg-gradient-to-br ${card.gradFrom} to-transparent p-4 relative overflow-hidden`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{card.label}</p>
                      <div className="w-7 h-7 rounded-lg bg-card/60 border border-border/50 flex items-center justify-center">
                        <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{card.value}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); refreshData({ status: f.value === 'all' ? undefined : f.value.toUpperCase(), search: search || undefined }) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    statusFilter === f.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="sm:ml-auto">
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); refreshData({ status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(), search: e.target.value || undefined }) }}
                placeholder="Search notifications…"
                className="bg-card border-border w-full sm:w-64"
              />
            </div>
          </div>

          {/* Table / empty */}
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground">No notifications found</p>
              <p className="text-xs text-muted-foreground mt-1.5">Try adjusting filters or send your first notification</p>
              <Button variant="outline" size="sm" className="mt-5 gap-2 cursor-pointer" onClick={() => setTab('compose')}>
                <Send className="w-3.5 h-3.5" /> Compose
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto rounded-t-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Notification', 'Audience', 'Channels', 'Priority', 'Status', 'Sent / Scheduled', 'Recipients', 'Opened', ''].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${h === 'Recipients' || h === 'Opened' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredNotifications.map(n => (
                      <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="font-semibold text-foreground text-sm truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            {audienceLabel(n.audience, n.audienceValue)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            {n.channels.map(ch => {
                              const conf = CHANNEL_CONFIG.find(c => c.value === ch)
                              return <ChannelIcon key={ch} channel={ch} className={`w-3.5 h-3.5 ${conf?.color ?? 'text-muted-foreground'}`} />
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <PriorityDot priority={n.priority} />
                            <span className="text-xs text-muted-foreground capitalize">{n.priority.toLowerCase()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={n.status} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                          {n.status === 'SCHEDULED' ? fmtDate(n.scheduledAt) : fmtDate(n.sentAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-semibold text-foreground tabular-nums">
                          {fmtNum(n.estimatedRecipients)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs tabular-nums">
                          {n.status === 'SENT' && n.deliveredCount > 0
                            ? <span className="font-semibold text-emerald-400">{Math.round((n.openedCount / n.deliveredCount) * 100)}%</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {n.status === 'SCHEDULED' && (
                              <button onClick={() => handleCancel(n.id)} disabled={isPending} title="Cancel"
                                className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(n.status === 'DRAFT' || n.status === 'CANCELLED') && (
                              <button onClick={() => handleDelete(n.id)} disabled={isPending} title="Delete"
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button title="View details"
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: TEMPLATES
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'templates' && (
        <div className="space-y-8">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-card">
              <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground">No templates yet</p>
              <p className="text-xs text-muted-foreground mt-1.5">Templates help you send consistent notifications faster</p>
            </div>
          ) : (
            CATEGORY_ORDER.filter(cat => templatesByCategory[cat]?.length).map(cat => {
              const style = getCategoryStyle(cat)
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <h2 className="text-sm font-bold text-foreground">{CATEGORY_LABELS[cat] ?? cat} Templates</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>
                      {templatesByCategory[cat]?.length ?? 0}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(templatesByCategory[cat] ?? []).map(tpl => (
                      <div key={tpl.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-indigo-500/30 hover:shadow-md transition-all duration-200">
                        <div className={`h-1 w-full ${style.bar}`} />
                        <div className={`px-4 pt-4 pb-3 bg-gradient-to-br ${style.gradientFrom} to-transparent`}>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-foreground leading-snug">{tpl.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap flex-shrink-0 ${style.badge}`}>
                              {CATEGORY_LABELS[cat]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{tpl.description}</p>
                        </div>
                        <div className="px-4 pb-4">
                          <div className="rounded-lg bg-muted/30 border border-border/60 p-3 mb-3">
                            <p className="text-xs font-semibold text-foreground leading-snug mb-1 line-clamp-1">{tpl.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tpl.body}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />{audienceLabel(tpl.audience)}
                            </span>
                            {tpl.channels.map(ch => (
                              <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground flex items-center gap-1">
                                <ChannelIcon channel={ch} className="w-2.5 h-2.5" />{ch.replace('_', '-')}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => fillFromTemplate(tpl)}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border hover:border-indigo-500/40 hover:bg-indigo-500/5 text-xs font-semibold text-muted-foreground hover:text-indigo-400 transition-all duration-200 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" /> Use Template
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
