'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, Phone, Mail, Download, X, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, Smartphone, Monitor, ShieldCheck, UserX, UsersRound, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredContributors } from '@/lib/mock/contributors-store'
import type { Contributor, ReporterType, ConnectionType } from '@/lib/mock/contributors-store'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-teal-400 to-cyan-600',
  'from-indigo-500 to-blue-600',
  'from-orange-400 to-amber-500',
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
function avatarGradient(id: string) {
  const n = id.replace(/\D/g, '')
  return AVATAR_COLORS[parseInt(n || '0') % AVATAR_COLORS.length]!
}
function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function timeAgo(d: Date | null | undefined) {
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

// ── Status Chips ──────────────────────────────────────────────────────────────

function StatusChip({ label, tone }: { label: string; tone: 'success' | 'warn' | 'neutral' }) {
  const colors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    warn:    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', colors[tone])}>
      {label}
    </span>
  )
}

function TypeBadge({ type }: { type: ReporterType }) {
  const tone: Record<ReporterType, 'success' | 'warn' | 'neutral'> = {
    'Full Time':  'success',
    'Part Time':  'warn',
    'Freelancer': 'neutral',
    'Intern':     'neutral',
  }
  return <StatusChip label={type} tone={tone[type]} />
}

function SourceBadge({ source }: { source: 'APP' | 'CMS' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px] font-medium">
      {source === 'APP' ? <Smartphone className="h-2.5 w-2.5 opacity-60" /> : <Monitor className="h-2.5 w-2.5 opacity-60" />}
      {source}
    </span>
  )
}

function PlatformPill({ platform }: { platform?: 'android' | 'ios' }) {
  if (!platform) return <span className="text-[10px] text-muted-foreground">—</span>
  return platform === 'android'
    ? <span className="text-[10px] font-medium text-muted-foreground">Android</span>
    : <span className="text-[10px] font-medium text-muted-foreground">iOS</span>
}

function ConnectionBadge({ type }: { type?: ConnectionType }) {
  if (!type) return null
  return (
    <span className="rounded bg-muted text-muted-foreground px-1 py-0.5 text-[9px] font-medium uppercase">
      {type === 'wifi' ? 'WiFi' : type}
    </span>
  )
}

function VerifiedDot({ status }: { status?: string }) {
  if (status === 'verified') return (
    <span title="Identity Verified" aria-label="Identity Verified" className="text-emerald-600 dark:text-emerald-400">
      <ShieldCheck className="h-3.5 w-3.5 fill-emerald-500/10" />
    </span>
  )
  return (
    <span title="Pending Verification" aria-label="Pending Verification" className="text-muted-foreground/40">
      <ShieldCheck className="h-3.5 w-3.5" />
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function AllContributorsClient() {
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'APP' | 'CMS'>('all')
  const [district, setDistrict]         = useState('all')
  const [type, setType]                 = useState<ReporterType | 'all'>('all')
  const [page, setPage]                 = useState(1)
  const [pageSize, setPageSize]         = useState(10)

  useEffect(() => { setContributors(getStoredContributors()) }, [])

  const districts = useMemo(() => {
    return [...new Set(contributors
      .filter(c => c.status === 'approved' || c.status === 'inactive')
      .map(c => c.district)
    )].sort()
  }, [contributors])

  const filtered = useMemo(() => {
    return contributors.filter(c => {
      if (c.status !== 'approved' && c.status !== 'inactive') return false
      if (statusFilter !== 'all') {
        if ((statusFilter === 'active' ? 'approved' : 'inactive') !== c.status) return false
      }
      if (sourceFilter !== 'all' && c.contributorSource !== sourceFilter) return false
      if (district && district !== 'all' && c.district !== district) return false
      if (type     && type !== 'all'     && c.reporterType !== type) return false
      if (search) {
        const q = search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) &&
            !c.mobile.includes(q) && !c.contributorId.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [contributors, statusFilter, sourceFilter, district, type, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || sourceFilter !== 'all' || district !== 'all' || type !== 'all'

  const counts = useMemo(() => {
    const list = contributors.filter(c => c.status === 'approved' || c.status === 'inactive')
    return {
      total:    list.length,
      active:   list.filter(c => c.status === 'approved').length,
      inactive: list.filter(c => c.status === 'inactive').length,
      fromApp:  list.filter(c => c.contributorSource === 'APP').length,
      fromCms:  list.filter(c => c.contributorSource === 'CMS').length,
    }
  }, [contributors])

  return (
    <div className="flex flex-col space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contributors</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Manage approved reporters, stringers, and network contributors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg bg-background cursor-pointer">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg cursor-pointer bg-foreground text-background hover:bg-foreground/90"
            onClick={() => router.push('/dashboard/contributors/add')}>
            <Plus className="h-3.5 w-3.5" /> Add Contributor
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
        {[
          { label: 'Total roster',      value: counts.total,    icon: UsersRound,   color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Verified active',   value: counts.active,   icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Inactive roster',   value: counts.inactive, icon: UserX,        color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'App installs',      value: counts.fromApp,  icon: Smartphone,   color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-50 dark:bg-purple-500/10' },
          { label: 'CMS creations',     value: counts.fromCms,  icon: Monitor,      color: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-500/10' },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, email, ID…"
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>

        {/* Status quick filter */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 h-8">
          {(['all', 'active', 'inactive'] as const).map(t => (
            <button key={t} onClick={() => { setStatusFilter(t); setPage(1) }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize h-7
                ${statusFilter === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'all' ? 'All Statuses' : t === 'active' ? `Active (${counts.active})` : `Inactive (${counts.inactive})`}
            </button>
          ))}
        </div>

        <Select value={sourceFilter} onValueChange={v => { setSourceFilter((v || 'all') as any); setPage(1) }}>
          <SelectTrigger aria-label="Filter by source" className="h-8 min-w-[130px] rounded-lg text-xs bg-background text-foreground border-border px-2.5">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="APP">App Converted</SelectItem>
            <SelectItem value="CMS">CMS Added</SelectItem>
          </SelectContent>
        </Select>

        <Select value={district} onValueChange={v => { setDistrict(v || 'all'); setPage(1) }}>
          <SelectTrigger aria-label="Filter by district" className="h-8 min-w-[130px] rounded-lg text-xs bg-background text-foreground border-border px-2.5">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={v => { setType((v || 'all') as ReporterType | 'all'); setPage(1) }}>
          <SelectTrigger aria-label="Filter by type" className="h-8 min-w-[130px] rounded-lg text-xs bg-background text-foreground border-border px-2.5">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="all">All Types</SelectItem>
            {(['Full Time','Part Time','Freelancer','Intern'] as ReporterType[]).map(t =>
              <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm"
            className="h-8 gap-1.5 text-xs rounded-lg cursor-pointer text-muted-foreground hover:bg-muted"
            onClick={() => { setSearch(''); setStatusFilter('all'); setSourceFilter('all'); setDistrict('all'); setType('all'); setPage(1) }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'contributor' : 'contributors'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-center w-12">#</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">Contributor</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden md:table-cell">Contact</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden lg:table-cell">Location</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden sm:table-cell">Type</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden xl:table-cell">Coverage Area</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden xl:table-cell">Device &amp; Network</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left">Status</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden lg:table-cell">Joined</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-center hidden 2xl:table-cell">Content (Sub/Pub)</th>
                <th className="py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap text-left hidden sm:table-cell">Last Active</th>
                <th className="py-3 px-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <UsersRound className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[14px] font-medium text-foreground">No contributors found</p>
                        <p className="text-[13px] text-muted-foreground">
                          {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Add your first contributor to get started.'}
                        </p>
                      </div>
                      {hasActiveFilters ? (
                        <Button variant="outline" size="sm" className="mt-1 gap-1.5 text-xs h-8 rounded-lg cursor-pointer bg-background"
                          onClick={() => { setSearch(''); setStatusFilter('all'); setSourceFilter('all'); setDistrict('all'); setType('all'); setPage(1) }}>
                          <X className="h-3.5 w-3.5" /> Clear filters
                        </Button>
                      ) : (
                        <Button size="sm" className="mt-1 gap-1.5 text-xs h-8 rounded-lg cursor-pointer bg-foreground text-background hover:bg-foreground/90 font-medium"
                          onClick={() => router.push('/dashboard/contributors/add')}>
                          <Plus className="h-3.5 w-3.5" /> Add Contributor
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : pageItems.map((c, idx) => (
                <tr key={c.id}
                  className="hover:bg-muted/20 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/dashboard/contributors/${c.id}`)}>

                  {/* S.No */}
                  <td className="py-3 px-3 text-center text-xs text-muted-foreground tabular-nums w-12">
                    {((page - 1) * pageSize + idx + 1).toString().padStart(2, '0')}
                  </td>

                  {/* Contributor: avatar + name + ID + source badge + KYC dot */}
                  <td className="py-3 px-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.name} className="h-8 w-8 rounded-full object-cover border border-border" />
                        ) : (
                          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold bg-gradient-to-br', avatarGradient(c.id))}>
                            {initials(c.name)}
                          </div>
                        )}
                        {c.isOnline && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{c.name}</p>
                          <VerifiedDot status={c.verificationStatus} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-mono text-muted-foreground">{c.contributorId}</span>
                          <SourceBadge source={c.contributorSource} />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-3 align-middle hidden md:table-cell">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-mono tabular-nums">{c.mobile}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px] mt-0.5">{c.email}</p>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-3 align-middle hidden lg:table-cell">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-medium">{c.district}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{c.mandal ?? '—'}</p>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3 align-middle hidden sm:table-cell">
                    <TypeBadge type={c.reporterType} />
                  </td>

                  {/* Primary Coverage Area — only for recruited reporters */}
                  <td className="py-3 px-3 align-middle hidden xl:table-cell">
                    {c.contributorType === 'team_recruited' ? (
                      <div className="min-w-0">
                        <p className="text-xs text-foreground font-medium">{c.assignedMandal ?? c.district}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {c.assignedVillage && <span className="text-[10px] text-muted-foreground">{c.assignedVillage}</span>}
                          {c.coveragePriorityLevel && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase
                              ${c.coveragePriorityLevel === 'high' ? 'bg-red-50 text-red-600 border border-red-200' :
                                c.coveragePriorityLevel === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                              {c.coveragePriorityLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* Device / ISP */}
                  <td className="py-3 px-3 align-middle hidden xl:table-cell">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-medium">
                        {c.devicePlatform === 'android' ? (
                          <span className="text-[10px] font-bold text-emerald-600">AND</span>
                        ) : c.devicePlatform === 'ios' ? (
                          <span className="text-[10px] font-bold text-gray-600">iOS</span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">N/A</span>
                        )}{' '}
                        <span className="text-muted-foreground truncate max-w-[90px]">{c.deviceModel ? c.deviceModel.split(' ').slice(0, 2).join(' ') : '—'}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {c.connectionType ? (
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${c.connectionType === 'wifi' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 bg-gray-100'}`}>{c.connectionType}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}{' '}
                        <span className="text-muted-foreground truncate max-w-[70px]">{c.isp ? c.isp.split(' ')[0] : '—'}</span>
                      </p>
                    </div>
                  </td>

                  {/* Status — Active/Inactive only */}
                  <td className="py-3 px-3 align-middle">
                    {c.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                        <span className="h-1 w-1 rounded-full bg-gray-400" /> Inactive
                      </span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="py-3 px-3 align-middle hidden lg:table-cell text-xs text-muted-foreground tabular-nums">
                    {fmtDate(c.approvedOn)}
                  </td>

                  {/* Content sub/pub */}
                  <td className="py-3 px-3 align-middle hidden 2xl:table-cell text-center">
                    <p className="font-semibold text-foreground text-xs tabular-nums">{c.totalContentSubmitted ?? 0} / {c.contentPublished ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide mt-0.5">sub / pub</p>
                  </td>

                  {/* Last Active */}
                  <td className="py-3 px-3 align-middle hidden sm:table-cell text-xs text-muted-foreground tabular-nums">
                    {timeAgo(c.lastActive)}
                  </td>

                  <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <button title="Details" onClick={() => router.push(`/dashboard/contributors/${c.id}`)}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
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
                {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Previous"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(p); return acc
              }, [])
              .map((p, i) => p === '…'
                ? <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                : <button key={p} onClick={() => setPage(p as number)}
                    className={`h-7 w-7 rounded-md text-xs font-medium transition-colors
                      ${page === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    {p}
                  </button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} title="Next"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
