'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  Send,
  Clock,
  FileText,
  Users,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type {
  NotificationRecord,
  NotificationTemplate,
  NotificationStats,
  NotificationChannel,
  NotificationAudience,
  NotificationPriority,
} from '@/types/domain'
import {
  listNotifications,
  getNotificationStats,
  createAndSendNotification,
  createScheduledNotification,
  saveDraftNotification,
  cancelNotification,
  deleteNotification,
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
  title: '',
  body: '',
  deepLink: '',
  channels: ['IN_APP', 'PUSH'] as NotificationChannel[],
  audience: 'APP_USERS' as NotificationAudience,
  audienceValue: '',
  priority: 'NORMAL' as NotificationPriority,
  scheduleMode: 'now',
  scheduledAt: '',
}

// ── Audience labels & estimates ───────────────────────────────────────────────

const AUDIENCE_OPTS: { value: NotificationAudience; label: string; count: number }[] = [
  { value: 'APP_USERS',     label: 'All App Users',   count: 24500 },
  { value: 'REPORTERS',     label: 'Reporters',        count: 42 },
  { value: 'ALL_CMS_USERS', label: 'All CMS Staff',   count: 11 },
  { value: 'BY_ROLE',       label: 'By Role',          count: 0 },
  { value: 'ALL',           label: 'Everyone',         count: 24553 },
]

function audienceLabel(audience: NotificationAudience, audienceValue?: string | null): string {
  const opt = AUDIENCE_OPTS.find(o => o.value === audience)
  if (audience === 'BY_ROLE' && audienceValue) return `Role: ${audienceValue}`
  return opt?.label ?? audience
}

function audienceEstimate(audience: NotificationAudience): number {
  return AUDIENCE_OPTS.find(o => o.value === audience)?.count ?? 0
}

// ── Channel config ─────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: {
  value: NotificationChannel
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'IN_APP',  label: 'In-App',  description: 'CMS + App',          icon: Bell },
  { value: 'PUSH',    label: 'Push',    description: 'Mobile app users',   icon: Smartphone },
  { value: 'EMAIL',   label: 'Email',   description: 'Email delivery',      icon: Mail },
  { value: 'SMS',     label: 'SMS',     description: 'SMS delivery',        icon: MessageSquare },
]

function ChannelIcon({ channel, className }: { channel: NotificationChannel; className?: string }) {
  const conf = CHANNEL_CONFIG.find(c => c.value === channel)
  if (!conf) return null
  const Icon = conf.icon
  return <Icon className={className} />
}

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: { value: NotificationPriority; label: string; dotClass: string; labelClass: string }[] = [
  { value: 'LOW',    label: 'Low',    dotClass: 'bg-zinc-400',   labelClass: 'text-zinc-400' },
  { value: 'NORMAL', label: 'Normal', dotClass: 'bg-blue-500',   labelClass: 'text-blue-500' },
  { value: 'HIGH',   label: 'High',   dotClass: 'bg-amber-500',  labelClass: 'text-amber-500' },
  { value: 'URGENT', label: 'Urgent', dotClass: 'bg-red-500',    labelClass: 'text-red-500' },
]

function PriorityDot({ priority, className }: { priority: NotificationPriority; className?: string }) {
  const conf = PRIORITY_CONFIG.find(p => p.value === priority)
  return <span className={`inline-block w-2 h-2 rounded-full ${conf?.dotClass ?? 'bg-zinc-400'} ${className ?? ''}`} />
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  SENT:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SCHEDULED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SENDING:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DRAFT:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  FAILED:    'bg-red-500/10 text-red-400 border-red-500/20',
  CANCELLED: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  )
}

// ── Category color config ─────────────────────────────────────────────────────

const CATEGORY_STYLE_DEFAULT = { bar: 'bg-zinc-500', dot: 'bg-zinc-500', badge: 'text-zinc-400 bg-zinc-500/10' }

const CATEGORY_STYLES: Record<string, { bar: string; dot: string; badge: string }> = {
  content:   { bar: 'bg-red-500',    dot: 'bg-red-500',    badge: 'text-red-400 bg-red-500/10' },
  reporter:  { bar: 'bg-blue-500',   dot: 'bg-blue-500',   badge: 'text-blue-400 bg-blue-500/10' },
  system:    { bar: 'bg-amber-500',  dot: 'bg-amber-500',  badge: 'text-amber-400 bg-amber-500/10' },
  marketing: { bar: 'bg-purple-500', dot: 'bg-purple-500', badge: 'text-purple-400 bg-purple-500/10' },
}

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLE_DEFAULT
}

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialNotifications: NotificationRecord[]
  initialStats: NotificationStats | null
  initialTemplates: NotificationTemplate[]
}

// ── Main client component ─────────────────────────────────────────────────────

export function NotificationsClient({ initialNotifications, initialStats, initialTemplates }: Props) {
  const [tab, setTab] = useState<'compose' | 'history' | 'templates'>('compose')
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications)
  const [stats, setStats] = useState<NotificationStats | null>(initialStats)
  const [templates] = useState<NotificationTemplate[]>(initialTemplates)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // ── Refresh helper ──────────────────────────────────────────────────────────

  function refreshData(opts?: { status?: string; search?: string }) {
    startTransition(async () => {
      const [nr, sr] = await Promise.all([listNotifications(opts ?? {}), getNotificationStats()])
      if (nr.ok) setNotifications(nr.data)
      if (sr.ok) setStats(sr.data)
    })
  }

  // ── Form helpers ────────────────────────────────────────────────────────────

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
    setForm(f => ({
      ...f,
      title: tpl.title,
      body: tpl.body,
      channels: tpl.channels,
      audience: tpl.audience,
      priority: tpl.priority,
    }))
    setTab('compose')
  }

  function buildPayload() {
    return {
      title: form.title,
      body: form.body,
      deepLink: form.deepLink || null,
      channels: form.channels,
      audience: form.audience,
      audienceValue: form.audienceValue || null,
      priority: form.priority,
      scheduledAt: form.scheduleMode === 'schedule' && form.scheduledAt ? form.scheduledAt : null,
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleSend() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.body.trim()) { toast.error('Body is required'); return }
    if (form.channels.length === 0) { toast.error('Select at least one channel'); return }

    startTransition(async () => {
      const payload = buildPayload()
      const result = form.scheduleMode === 'schedule'
        ? await createScheduledNotification(payload)
        : await createAndSendNotification(payload)

      if (!result.ok) {
        toast.error(result.error.message)
        return
      }
      toast.success(form.scheduleMode === 'schedule' ? 'Notification scheduled' : 'Notification sent')
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

  // ── Filtered history ────────────────────────────────────────────────────────

  const filteredNotifications = notifications.filter(n => {
    const matchStatus = statusFilter === 'all' || n.status === statusFilter.toUpperCase()
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // ── Preview data ────────────────────────────────────────────────────────────

  const previewAudienceOpt = AUDIENCE_OPTS.find(o => o.value === form.audience)
  const previewRecipients = form.audience === 'BY_ROLE' ? '~5' : `~${fmtNum(previewAudienceOpt?.count ?? 0)}`

  // ── Tabs ────────────────────────────────────────────────────────────────────

  const TABS = [
    { value: 'compose' as const, label: 'Compose', icon: Send },
    { value: 'history' as const, label: 'History', icon: Clock },
    { value: 'templates' as const, label: 'Templates', icon: FileText },
  ]

  const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'sent', label: 'Sent' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'draft', label: 'Draft' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  // ── Template groups ─────────────────────────────────────────────────────────

  const templatesByCategory = templates.reduce<Record<string, NotificationTemplate[]>>((acc, t) => {
    const cat = t.category ?? 'system'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  const CATEGORY_ORDER = ['content', 'reporter', 'system', 'marketing']
  const CATEGORY_LABELS: Record<string, string> = {
    content: 'Content', reporter: 'Reporter', system: 'System', marketing: 'Marketing',
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send in-app, push, email and SMS notifications to your users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border mb-6 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.value
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                active
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB: COMPOSE ─────────────────────────────────────────────────────── */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Template quick-pick */}
            {templates.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Quick templates</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {templates.map(tpl => {
                    const cat = tpl.category ?? 'system'
                    const style = getCategoryStyle(tpl.category ?? 'system')
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => fillFromTemplate(tpl)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/50 text-xs font-medium text-foreground whitespace-nowrap transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                        {tpl.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Title</label>
                <span className={`text-xs ${form.title.length > 90 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {form.title.length}/100
                </span>
              </div>
              <Input
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                maxLength={100}
                placeholder="e.g. Breaking: New metro line approved"
                className="bg-card border-border"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Body</label>
                <span className={`text-xs ${form.body.length > 450 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {form.body.length}/500
                </span>
              </div>
              <textarea
                value={form.body}
                onChange={e => setField('body', e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Notification message body…"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Deep link */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Deep Link <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                value={form.deepLink}
                onChange={e => setField('deepLink', e.target.value)}
                placeholder="puralocal://article/{slug}"
                className="bg-card border-border"
              />
            </div>

            {/* Channels */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Channels</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHANNEL_CONFIG.map(ch => {
                  const Icon = ch.icon
                  const checked = form.channels.includes(ch.value)
                  return (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => toggleChannel(ch.value)}
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                        checked
                          ? 'border-indigo-500/60 bg-indigo-500/10'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="mt-0.5">
                        {checked
                          ? <span className="flex items-center justify-center w-4 h-4 rounded bg-indigo-500"><Check className="w-3 h-3 text-white" /></span>
                          : <span className="flex items-center justify-center w-4 h-4 rounded border border-border" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Icon className="w-3.5 h-3.5" />
                          {ch.label}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Audience</label>
              <select
                value={form.audience}
                onChange={e => setField('audience', e.target.value as NotificationAudience)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {AUDIENCE_OPTS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}{o.count > 0 ? ` (~${fmtNum(o.count)} users)` : ''}
                  </option>
                ))}
              </select>
              {form.audience === 'BY_ROLE' && (
                <Input
                  value={form.audienceValue}
                  onChange={e => setField('audienceValue', e.target.value)}
                  placeholder="e.g. EDITOR, CONTENT_REVIEWER"
                  className="mt-2 bg-card border-border"
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.priority === p.value
                        ? `border-current ${p.labelClass} bg-current/10`
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.dotClass}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">When to send</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setField('scheduleMode', 'now')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.scheduleMode === 'now'
                      ? 'border-indigo-500/60 text-indigo-400 bg-indigo-500/10'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setField('scheduleMode', 'schedule')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.scheduleMode === 'schedule'
                      ? 'border-indigo-500/60 text-indigo-400 bg-indigo-500/10'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Schedule
                </button>
              </div>
              {form.scheduleMode === 'schedule' && (
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setField('scheduledAt', e.target.value)}
                  className="bg-card border-border"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isPending}
                className="gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Save Draft
              </Button>
              <Button
                onClick={handleSend}
                disabled={isPending}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : form.scheduleMode === 'schedule' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {form.scheduleMode === 'schedule' ? 'Schedule' : 'Send Now'}
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="xl:sticky xl:top-6 self-start">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</p>

            {/* Phone frame */}
            <div className="bg-zinc-900 rounded-2xl p-4 shadow-xl border border-zinc-700">
              {/* Status bar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] text-zinc-400 font-medium">9:41</span>
                <div className="flex gap-1">
                  <span className="text-[10px] text-zinc-400">●●●</span>
                </div>
              </div>

              {/* Notification card */}
              <div className="bg-zinc-800 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white">PuraLocal</span>
                  <span className="text-xs text-zinc-500 ml-auto">now</span>
                </div>
                <p className="text-sm font-semibold text-white leading-snug mb-1">
                  {form.title || <span className="text-zinc-600 font-normal italic">Notification title…</span>}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {form.body || <span className="italic">Message body will appear here…</span>}
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    {audienceLabel(form.audience, form.audienceValue)}
                  </span>
                  {form.channels.map(ch => (
                    <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 flex items-center gap-1">
                      <ChannelIcon channel={ch} className="w-2.5 h-2.5" />
                      {ch.replace('_', '-')}
                    </span>
                  ))}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300 flex items-center gap-1">
                    <PriorityDot priority={form.priority} />
                    {form.priority}
                  </span>
                </div>
              </div>

              {/* Recipient estimate */}
              <div className="mt-3 px-1">
                <p className="text-xs text-zinc-500 text-center">{previewRecipients} recipients</p>
              </div>
            </div>

            {/* Channel delivery summary */}
            <div className="mt-4 rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Channel delivery</p>
              {CHANNEL_CONFIG.map(ch => {
                const Icon = ch.icon
                const active = form.channels.includes(ch.value)
                return (
                  <div key={ch.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      {ch.label}
                    </div>
                    {active
                      ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                      : <X className="w-3.5 h-3.5 text-zinc-600" />
                    }
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORY ─────────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total Sent',  value: stats.totalSent.toLocaleString() },
                { label: 'Scheduled',   value: stats.totalScheduled.toLocaleString() },
                { label: 'Delivered',   value: fmtNum(stats.totalDelivered) },
                { label: 'Opened',      value: fmtNum(stats.totalOpened) },
                { label: 'Open Rate',   value: `${stats.openRate}%` },
              ].map(card => (
                <div key={card.label} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); refreshData({ status: f.value === 'all' ? undefined : f.value.toUpperCase(), search: search || undefined }) }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === f.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="sm:ml-auto">
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); refreshData({ status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(), search: e.target.value || undefined }) }}
                placeholder="Search notifications…"
                className="bg-card border-border w-full sm:w-64"
              />
            </div>
          </div>

          {/* Table */}
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border bg-card">
              <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">No notifications found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or send your first notification</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setTab('compose')}>
                Compose Notification
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Notification</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Audience</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Channels</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Priority</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Sent / Scheduled</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Recipients</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Opened</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredNotifications.map(n => (
                      <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                        {/* Title + body */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-medium text-foreground text-sm truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        </td>

                        {/* Audience */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {audienceLabel(n.audience, n.audienceValue)}
                          </div>
                        </td>

                        {/* Channels */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {n.channels.map(ch => (
                              <ChannelIcon key={ch} channel={ch} className="w-3.5 h-3.5 text-muted-foreground" />
                            ))}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <PriorityDot priority={n.priority} />
                            <span className="text-xs text-muted-foreground capitalize">{n.priority.toLowerCase()}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={n.status} />
                        </td>

                        {/* Sent / Scheduled at */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {n.status === 'SCHEDULED' ? fmtDate(n.scheduledAt) : fmtDate(n.sentAt)}
                        </td>

                        {/* Recipients */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-muted-foreground">
                          {fmtNum(n.estimatedRecipients)}
                        </td>

                        {/* Opened */}
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-muted-foreground">
                          {n.status === 'SENT' && n.deliveredCount > 0
                            ? `${Math.round((n.openedCount / n.deliveredCount) * 100)}%`
                            : '—'
                          }
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {n.status === 'SCHEDULED' && (
                              <button
                                onClick={() => handleCancel(n.id)}
                                disabled={isPending}
                                className="p-1.5 rounded hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(n.status === 'DRAFT' || n.status === 'CANCELLED') && (
                              <button
                                onClick={() => handleDelete(n.id)}
                                disabled={isPending}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                              title="View details"
                            >
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

      {/* ── TAB: TEMPLATES ───────────────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-8">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-border bg-card">
              <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">No templates yet</p>
              <p className="text-xs text-muted-foreground mt-1">Templates help you send consistent notifications faster</p>
            </div>
          ) : (
            CATEGORY_ORDER.filter(cat => templatesByCategory[cat]?.length).map(cat => {
              const style = getCategoryStyle(cat)
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <h2 className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[cat] ?? cat} Templates</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
                      {templatesByCategory[cat]?.length ?? 0}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {(templatesByCategory[cat] ?? []).map(tpl => (
                      <div key={tpl.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-colors">
                        {/* Category color bar */}
                        <div className={`h-1 w-full ${style.bar}`} />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground leading-snug">{tpl.name}</h3>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${style.badge}`}>
                              {CATEGORY_LABELS[cat]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{tpl.description}</p>

                          {/* Preview */}
                          <div className="rounded-md bg-muted/30 border border-border/60 p-2.5 mb-3">
                            <p className="text-xs font-medium text-foreground leading-snug mb-0.5 line-clamp-1">{tpl.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tpl.body}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />
                              {audienceLabel(tpl.audience)}
                            </span>
                            {tpl.channels.map(ch => (
                              <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                                <ChannelIcon channel={ch} className="w-2.5 h-2.5" />
                                {ch.replace('_', '-')}
                              </span>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 text-xs"
                            onClick={() => fillFromTemplate(tpl)}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                            Use Template
                          </Button>
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
