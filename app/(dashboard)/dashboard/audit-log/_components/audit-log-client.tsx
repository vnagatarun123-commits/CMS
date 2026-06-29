'use client'

import { useState, useTransition } from 'react'
import {
  Search, ChevronDown, ChevronRight, Download,
  LogIn, LogOut, KeyRound,
  UserPlus, UserMinus, UserCog,
  Settings, Shield,
  FileText, FilePlus, FilePen, FileX, CheckCircle, Calendar,
  Bell, BellOff, BellRing, Trash2,
  UserCheck, UserX, Wallet, Percent,
  Tag, MapPin, Languages,
  RefreshCw,
} from 'lucide-react'
import type { AuditEntry, AuditAction } from '@/types/domain'
import type { AuditCategory } from '@/lib/data/repositories'
import { Input } from '@/components/ui/input'
import { getAuditLogPage } from '@/app/actions/audit-log'
import { AUDIT_PAGE_SIZE } from '@/lib/audit-log-constants'

// ── Action config ─────────────────────────────────────────────────────────────

interface ActionConf {
  label: string
  icon: React.ComponentType<{ className?: string }>
  category: AuditCategory
  color: string       // Tailwind text color
  bgColor: string     // Tailwind bg color (light)
  dotColor: string    // hex for dot
}

const ACTION_CONF: Partial<Record<AuditAction, ActionConf>> = {
  'auth.login':                { label: 'Signed in',              icon: LogIn,      category: 'auth',         color: 'text-sky-600',    bgColor: 'bg-sky-50',    dotColor: '#0EA5E9' },
  'auth.logout':               { label: 'Signed out',             icon: LogOut,     category: 'auth',         color: 'text-slate-500',  bgColor: 'bg-slate-100', dotColor: '#94A3B8' },
  'auth.password_changed':     { label: 'Password changed',       icon: KeyRound,   category: 'auth',         color: 'text-amber-600',  bgColor: 'bg-amber-50',  dotColor: '#F59E0B' },
  'user.invited':              { label: 'User invited',           icon: UserPlus,   category: 'user',         color: 'text-indigo-600', bgColor: 'bg-indigo-50', dotColor: '#6366F1' },
  'user.role_assigned':        { label: 'Role assigned',          icon: UserCog,    category: 'user',         color: 'text-indigo-600', bgColor: 'bg-indigo-50', dotColor: '#6366F1' },
  'user.role_removed':         { label: 'Role removed',           icon: UserMinus,  category: 'user',         color: 'text-orange-600', bgColor: 'bg-orange-50', dotColor: '#F97316' },
  'user.removed':              { label: 'User removed',           icon: UserX,      category: 'user',         color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'org.settings_updated':      { label: 'Settings updated',       icon: Settings,   category: 'org',          color: 'text-violet-600', bgColor: 'bg-violet-50', dotColor: '#7C3AED' },
  'org.role_created':          { label: 'Role created',           icon: Shield,     category: 'org',          color: 'text-violet-600', bgColor: 'bg-violet-50', dotColor: '#7C3AED' },
  'org.role_updated':          { label: 'Role updated',           icon: Shield,     category: 'org',          color: 'text-violet-600', bgColor: 'bg-violet-50', dotColor: '#7C3AED' },
  'org.role_deleted':          { label: 'Role deleted',           icon: Shield,     category: 'org',          color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'content.created':           { label: 'Content created',        icon: FilePlus,   category: 'content',      color: 'text-emerald-600',bgColor: 'bg-emerald-50',dotColor: '#10B981' },
  'content.updated':           { label: 'Content updated',        icon: FilePen,    category: 'content',      color: 'text-emerald-600',bgColor: 'bg-emerald-50',dotColor: '#10B981' },
  'content.transitioned':      { label: 'Status changed',         icon: RefreshCw,  category: 'content',      color: 'text-blue-600',   bgColor: 'bg-blue-50',   dotColor: '#3B82F6' },
  'content.published':         { label: 'Content published',      icon: CheckCircle,category: 'content',      color: 'text-emerald-600',bgColor: 'bg-emerald-50',dotColor: '#10B981' },
  'content.scheduled':         { label: 'Content scheduled',      icon: Calendar,   category: 'content',      color: 'text-blue-600',   bgColor: 'bg-blue-50',   dotColor: '#3B82F6' },
  'content.deleted':           { label: 'Content deleted',        icon: FileX,      category: 'content',      color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'notification.sent':         { label: 'Notification sent',      icon: Bell,       category: 'notification', color: 'text-purple-600', bgColor: 'bg-purple-50', dotColor: '#9333EA' },
  'notification.scheduled':    { label: 'Notification scheduled', icon: BellRing,   category: 'notification', color: 'text-purple-600', bgColor: 'bg-purple-50', dotColor: '#9333EA' },
  'notification.cancelled':    { label: 'Notification cancelled', icon: BellOff,    category: 'notification', color: 'text-orange-600', bgColor: 'bg-orange-50', dotColor: '#F97316' },
  'notification.deleted':      { label: 'Notification deleted',   icon: Trash2,     category: 'notification', color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'reporter.approved':         { label: 'Reporter approved',      icon: UserCheck,  category: 'reporter',     color: 'text-emerald-600',bgColor: 'bg-emerald-50',dotColor: '#10B981' },
  'reporter.rejected':         { label: 'Reporter rejected',      icon: UserX,      category: 'reporter',     color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'reporter.earnings_released':{ label: 'Earnings released',      icon: Wallet,     category: 'reporter',     color: 'text-emerald-600',bgColor: 'bg-emerald-50',dotColor: '#10B981' },
  'reporter.commission_updated':{ label: 'Commission updated',    icon: Percent,    category: 'reporter',     color: 'text-amber-600',  bgColor: 'bg-amber-50',  dotColor: '#F59E0B' },
  'category.created':          { label: 'Category created',       icon: Tag,        category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'category.updated':          { label: 'Category updated',       icon: Tag,        category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'category.toggled':          { label: 'Category toggled',       icon: Tag,        category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'category.deleted':          { label: 'Category deleted',       icon: Tag,        category: 'data',         color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'category.restored':         { label: 'Category restored',      icon: Tag,        category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'location.created':          { label: 'Location created',       icon: MapPin,     category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'location.updated':          { label: 'Location updated',       icon: MapPin,     category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'location.toggled':          { label: 'Location toggled',       icon: MapPin,     category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'location.deleted':          { label: 'Location deleted',       icon: MapPin,     category: 'data',         color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'location.restored':         { label: 'Location restored',      icon: MapPin,     category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'language.created':          { label: 'Language added',         icon: Languages,  category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'language.updated':          { label: 'Language updated',       icon: Languages,  category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'language.toggled':          { label: 'Language toggled',       icon: Languages,  category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
  'language.deleted':          { label: 'Language deleted',       icon: Languages,  category: 'data',         color: 'text-red-600',    bgColor: 'bg-red-50',    dotColor: '#EF4444' },
  'language.restored':         { label: 'Language restored',      icon: Languages,  category: 'data',         color: 'text-teal-600',   bgColor: 'bg-teal-50',   dotColor: '#0D9488' },
}

function getConf(action: AuditAction): ActionConf {
  return ACTION_CONF[action] ?? {
    label: action.replace('.', ': ').replace(/_/g, ' '),
    icon: FileText,
    category: 'org',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    dotColor: '#94A3B8',
  }
}

// ── Category filter config ────────────────────────────────────────────────────

const CATEGORIES: { value: AuditCategory | 'all'; label: string; dotColor: string }[] = [
  { value: 'all',          label: 'All',           dotColor: '#94A3B8' },
  { value: 'auth',         label: 'Auth',          dotColor: '#0EA5E9' },
  { value: 'user',         label: 'Users',         dotColor: '#6366F1' },
  { value: 'content',      label: 'Content',       dotColor: '#10B981' },
  { value: 'notification', label: 'Notifications', dotColor: '#9333EA' },
  { value: 'reporter',     label: 'Reporters',     dotColor: '#F59E0B' },
  { value: 'data',         label: 'Master Data',   dotColor: '#0D9488' },
  { value: 'org',          label: 'Org',           dotColor: '#7C3AED' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function fmtTime(d: Date): string {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtDateGroup(d: Date): string {
  const dt = new Date(d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  dt.setHours(0, 0, 0, 0)
  if (dt.getTime() === today.getTime()) return 'Today'
  if (dt.getTime() === yesterday.getTime()) return 'Yesterday'
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDay(entries: AuditEntry[]): { label: string; entries: AuditEntry[] }[] {
  const map = new Map<string, AuditEntry[]>()
  for (const e of entries) {
    const dt = new Date(e.createdAt)
    dt.setHours(0, 0, 0, 0)
    const key = dt.toISOString()
    const grp = map.get(key) ?? []
    grp.push(e)
    map.set(key, grp)
  }
  return [...map.entries()].map(([key, entries]) => ({
    label: fmtDateGroup(new Date(key)),
    entries,
  }))
}

function MetaValue({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="text-slate-400">—</span>
  if (typeof v === 'boolean') return <span className={v ? 'text-emerald-600' : 'text-red-500'}>{v ? 'true' : 'false'}</span>
  if (typeof v === 'object') return <pre className="text-[10px] text-slate-600 bg-slate-50 rounded px-2 py-1 overflow-x-auto max-w-xs">{JSON.stringify(v, null, 2)}</pre>
  return <span className="text-slate-700">{String(v)}</span>
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false)
  const conf = getConf(entry.action)
  const Icon = conf.icon
  const hasMetadata = Object.keys(entry.metadata).length > 0

  return (
    <div className="group">
      <div
        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${hasMetadata ? 'cursor-pointer' : ''}`}
        onClick={() => hasMetadata && setOpen(o => !o)}
      >
        {/* Icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${conf.bgColor}`}>
          <Icon className={`w-4 h-4 ${conf.color}`} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              {/* Action label + target */}
              <p className="text-sm text-slate-800">
                <span className="font-medium">{conf.label}</span>
                {entry.targetLabel && (
                  <span className="text-slate-500"> — <span className="text-slate-700">{entry.targetLabel}</span></span>
                )}
              </p>

              {/* Actor */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-[8px] font-bold text-slate-600 shrink-0">
                  {initials(entry.actorName)}
                </span>
                <span className="text-xs text-slate-400">{entry.actorName}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-400">{fmtTime(entry.createdAt)}</span>
              </div>
            </div>

            {/* Right: category badge + expand */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${conf.bgColor} ${conf.color}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conf.dotColor }} />
                {conf.category}
              </span>
              {hasMetadata && (
                <span className="text-slate-300 group-hover:text-slate-400 transition-colors">
                  {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              )}
            </div>
          </div>

          {/* Expandable metadata */}
          {open && hasMetadata && (
            <div className="mt-2 rounded-lg border border-slate-100 bg-white overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(entry.metadata).map(([k, v]) => (
                    <tr key={k} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 text-slate-400 font-mono w-36 align-top">{k}</td>
                      <td className="px-3 py-2 align-top"><MetaValue v={v} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialEntries: AuditEntry[]
  initialTotal: number
  initialHasMore: boolean
}

export function AuditLogClient({ initialEntries, initialTotal, initialHasMore }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(0)
  const [category, setCategory] = useState<AuditCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  function fetch(opts: { category?: AuditCategory | 'all'; search?: string; page?: number }) {
    startTransition(async () => {
      const result = await getAuditLogPage({
        category: (opts.category ?? category) === 'all' ? undefined : (opts.category ?? category) as AuditCategory,
        search: opts.search ?? search,
        page: opts.page ?? 0,
      })
      if (!result.ok) return
      if ((opts.page ?? 0) === 0) {
        setEntries(result.data.entries)
      } else {
        setEntries(prev => [...prev, ...result.data.entries])
      }
      setTotal(result.data.total)
      setHasMore(result.data.hasMore)
      setPage(result.data.page)
    })
  }

  function handleCategory(cat: AuditCategory | 'all') {
    setCategory(cat)
    setPage(0)
    fetch({ category: cat, page: 0 })
  }

  function handleSearch(q: string) {
    setSearch(q)
    setPage(0)
    fetch({ search: q, page: 0 })
  }

  function handleLoadMore() {
    fetch({ page: page + 1 })
  }

  const groups = groupByDay(entries)

  return (
    <div className="space-y-4">
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Category pills */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                category === cat.value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {cat.value !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.dotColor }} />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search + total + export */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search actor, target, action…"
              className="pl-8 h-8 text-xs w-52 border-slate-200"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums">{total.toLocaleString()} events</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isPending && entries.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-600">No audit events found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div>
            {groups.map((group, gi) => (
              <div key={gi}>
                {/* Day separator */}
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">{group.label}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">{group.entries.length} event{group.entries.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {group.entries.map(e => (
                    <EntryRow key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing {entries.length} of {total} events
                </span>
                <button
                  onClick={handleLoadMore}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Load more
                </button>
              </div>
            )}

            {!hasMore && entries.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-300">All {total} events loaded</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
