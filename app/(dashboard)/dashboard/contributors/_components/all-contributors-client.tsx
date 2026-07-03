'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, Phone, Mail, Download, X, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, Smartphone, Monitor, ShieldCheck, UserX, UsersRound,
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

const PAGE_SIZE = 10

export function AllContributorsClient() {
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'APP' | 'CMS'>('all')
  const [district, setDistrict]         = useState('all')
  const [type, setType]                 = useState<ReporterType | 'all'>('all')
  const [page, setPage]                 = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contributors</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Manage approved reporters, stringers, and network contributors</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg cursor-pointer">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-9 rounded-lg cursor-pointer bg-foreground text-background hover:bg-foreground/90 font-medium"
            onClick={() => router.push('/dashboard/contributors/add')}>
            <Plus className="h-3.5 w-3.5" /> Add Contributor
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total active roster',  value: counts.total,    icon: UsersRound,   color: 'text-foreground',        iconColor: 'text-muted-foreground' },
          { label: 'Verified active',      value: counts.active,   icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Temporarily inactive', value: counts.inactive, icon: UserX,        color: 'text-muted-foreground',  iconColor: 'text-muted-foreground' },
          { label: 'App installations',    value: counts.fromApp,  icon: Smartphone,   color: 'text-foreground',        iconColor: 'text-muted-foreground' },
          { label: 'CMS creations',        value: counts.fromCms,  icon: Monitor,      color: 'text-foreground',        iconColor: 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="rounded-2xl border bg-card ring-1 ring-border/50 px-4 py-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground uppercase font-medium tracking-wide">{label}</p>
              <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
            </div>
            <p className={cn('text-2xl font-semibold tracking-tight tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            aria-label="Search contributors"
            placeholder="Search name, email, ID…" className="pl-9 h-9 text-[13px] rounded-lg" />
        </div>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter((v || 'all') as any); setPage(1) }}>
          <SelectTrigger aria-label="Filter by status" className="h-9 min-w-[130px] rounded-lg text-[13px] bg-background text-foreground border-input">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={v => { setSourceFilter((v || 'all') as any); setPage(1) }}>
          <SelectTrigger aria-label="Filter by source" className="h-9 min-w-[130px] rounded-lg text-[13px] bg-background text-foreground border-input">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="APP">App Converted</SelectItem>
            <SelectItem value="CMS">CMS Added</SelectItem>
          </SelectContent>
        </Select>

        <Select value={district} onValueChange={v => { setDistrict(v || 'all'); setPage(1) }}>
          <SelectTrigger aria-label="Filter by district" className="h-9 min-w-[130px] rounded-lg text-[13px] bg-background text-foreground border-input">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={v => { setType((v || 'all') as ReporterType | 'all'); setPage(1) }}>
          <SelectTrigger aria-label="Filter by type" className="h-9 min-w-[130px] rounded-lg text-[13px] bg-background text-foreground border-input">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(['Full Time','Part Time','Freelancer','Intern'] as ReporterType[]).map(t =>
              <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm"
            className="h-9 gap-1.5 text-[13px] rounded-lg cursor-pointer text-muted-foreground"
            onClick={() => { setSearch(''); setStatusFilter('all'); setSourceFilter('all'); setDistrict('all'); setType('all'); setPage(1) }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <span className="ml-auto text-[13px] text-muted-foreground tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'contributor' : 'contributors'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border ring-1 ring-border/50 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] whitespace-nowrap">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-border bg-muted/60 backdrop-blur-sm text-left text-[13px] font-medium text-muted-foreground supports-[backdrop-filter]:bg-muted/50">
                {/* S.No */}
                <th className="px-5 h-12 font-medium w-12 text-left">#</th>
                {/* Contributor */}
                <th className="px-5 h-12 font-medium">Contributor</th>
                {/* Contact */}
                <th className="px-5 h-12 font-medium hidden md:table-cell">Contact</th>
                {/* Location */}
                <th className="px-5 h-12 font-medium hidden lg:table-cell">Location</th>
                {/* Type */}
                <th className="px-5 h-12 font-medium hidden sm:table-cell">Type</th>
                {/* Primary Coverage Area — recruited only */}
                <th className="px-5 h-12 font-medium hidden xl:table-cell">Coverage Area</th>
                {/* Device / ISP */}
                <th className="px-5 h-12 font-medium hidden xl:table-cell">Device &amp; Network</th>
                {/* Status */}
                <th className="px-5 h-12 font-medium">Status</th>
                {/* Joined Date */}
                <th className="px-5 h-12 font-medium hidden lg:table-cell">Joined</th>
                {/* Content */}
                <th className="px-5 h-12 font-medium hidden 2xl:table-cell text-center">Content (Sub/Pub)</th>
                {/* Last Active */}
                <th className="px-5 h-12 font-medium hidden sm:table-cell">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16">
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
                        <Button variant="outline" size="sm" className="mt-1 gap-1.5 text-xs h-9 rounded-lg cursor-pointer"
                          onClick={() => { setSearch(''); setStatusFilter('all'); setSourceFilter('all'); setDistrict('all'); setType('all'); setPage(1) }}>
                          <X className="h-3.5 w-3.5" /> Clear filters
                        </Button>
                      ) : (
                        <Button size="sm" className="mt-1 gap-1.5 text-xs h-9 rounded-lg cursor-pointer bg-foreground text-background hover:bg-foreground/90 font-medium"
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
                  <td className="px-5 py-3.5 align-middle text-muted-foreground text-left font-mono tabular-nums">
                    {((page - 1) * PAGE_SIZE + idx + 1).toString().padStart(2, '0')}
                  </td>

                  {/* Contributor: avatar + name + ID + source badge + KYC dot */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.name} className="h-9 w-9 rounded-xl object-cover border border-border" />
                        ) : (
                          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center text-white text-[13px] font-semibold bg-gradient-to-br', avatarGradient(c.id))}>
                            {initials(c.name)}
                          </div>
                        )}
                        {c.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-foreground leading-tight">{c.name}</p>
                          <VerifiedDot status={c.verificationStatus} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[11px] font-mono text-muted-foreground">{c.contributorId}</span>
                          <SourceBadge source={c.contributorSource} />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-5 py-3.5 align-middle hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0 opacity-55" />
                        <span className="font-mono tabular-nums">{c.mobile}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0 opacity-55" />
                        <span className="truncate max-w-[150px]">{c.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-3.5 align-middle hidden lg:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground opacity-60" />
                        <span>{c.district}</span>
                      </div>
                      {c.mandal && <p className="text-[12px] text-muted-foreground pl-4.5">{c.mandal}</p>}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-3.5 align-middle hidden sm:table-cell">
                    <TypeBadge type={c.reporterType} />
                  </td>

                  {/* Primary Coverage Area — only for recruited reporters */}
                  <td className="px-5 py-3.5 align-middle hidden xl:table-cell">
                    {c.contributorType === 'team_recruited' ? (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{c.assignedMandal ?? c.district}</p>
                        {c.assignedVillage && <p className="text-[12px] text-muted-foreground">{c.assignedVillage}</p>}
                        {c.coveragePriorityLevel && (
                          <span className="inline-block">
                            {c.coveragePriorityLevel === 'high' ? <StatusChip label="High Priority" tone="warn" /> :
                             c.coveragePriorityLevel === 'medium' ? <StatusChip label="Medium Priority" tone="warn" /> :
                             <StatusChip label="Low Priority" tone="neutral" />}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Device / ISP */}
                  <td className="px-5 py-3.5 align-middle hidden xl:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <PlatformPill platform={c.devicePlatform} />
                        <span className="text-[13px] text-muted-foreground truncate max-w-[100px]">
                          {c.deviceModel ? c.deviceModel.split(' ').slice(0, 2).join(' ') : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConnectionBadge type={c.connectionType} />
                        <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                          {c.isp ? c.isp.split(' ')[0] : '—'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status — Active/Inactive only */}
                  <td className="px-5 py-3.5 align-middle">
                    {c.status === 'approved' ? (
                      <StatusChip label="Active" tone="success" />
                    ) : (
                      <StatusChip label="Inactive" tone="neutral" />
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-5 py-3.5 align-middle hidden lg:table-cell text-[13px] text-muted-foreground tabular-nums">
                    {fmtDate(c.approvedOn)}
                  </td>

                  {/* Content sub/pub */}
                  <td className="px-5 py-3.5 align-middle hidden 2xl:table-cell text-center">
                    <p className="font-semibold text-foreground tabular-nums">{c.totalContentSubmitted ?? 0} / {c.contentPublished ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide mt-0.5">sub / pub</p>
                  </td>

                  {/* Last Active */}
                  <td className="px-5 py-3.5 align-middle hidden sm:table-cell text-[13px] text-muted-foreground tabular-nums">
                    {timeAgo(c.lastActive)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border ring-1 ring-border/50 bg-muted/20 px-5 py-3 text-[13px] text-muted-foreground">
          <span className="tabular-nums">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" aria-label="Previous page" title="Previous page"
              className="h-8 w-8 rounded-lg cursor-pointer" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-foreground tabular-nums">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" aria-label="Next page" title="Next page"
              className="h-8 w-8 rounded-lg cursor-pointer" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
