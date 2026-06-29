'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, MapPin, Phone, Mail, Filter,
  Users2, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ContributorStatus = 'pending' | 'approved' | 'rejected' | 'deleted'
type ReporterType = 'Full Time' | 'Part Time' | 'Freelancer' | 'Intern'

interface Contributor {
  id: string
  contributorId: string
  name: string
  mobile: string
  email: string
  designation: string
  reporterType: ReporterType
  district: string
  experience: string
  appliedOn: Date
  status: ContributorStatus
  approvedOn?: Date | null
  rejectedOn?: Date | null
  language?: string
  coverageAreas?: string[]
}

const ALL_CONTRIBUTORS: Contributor[] = [
  { id: 'c1', contributorId: 'CON250601', name: 'Ramesh Kumar',  mobile: '9876543210', email: 'ramesh.kumar@gmail.com',  designation: 'Reporter',        reporterType: 'Full Time',  district: 'Karimnagar', experience: '2 Years',   appliedOn: new Date('2025-06-01T10:30:00'), status: 'pending',  language: 'Telugu', coverageAreas: ['Politics', 'Crime'] },
  { id: 'c2', contributorId: 'CON250602', name: 'Shilpa P',      mobile: '9123456780', email: 'shilpa.p@gmail.com',       designation: 'Stringer',        reporterType: 'Part Time',  district: 'Warangal',   experience: '1 Year',    appliedOn: new Date('2025-06-01T09:45:00'), status: 'pending',  language: 'Telugu', coverageAreas: ['Education', 'Health'] },
  { id: 'c3', contributorId: 'CON250603', name: 'Venkatesh B',   mobile: '9988776655', email: 'venkatesh.b@gmail.com',    designation: 'Reporter',        reporterType: 'Full Time',  district: 'Hyderabad',  experience: '5 Years',   appliedOn: new Date('2025-05-31T16:20:00'), status: 'pending',  language: 'Telugu', coverageAreas: ['Politics', 'Crime'] },
  { id: 'c4', contributorId: 'CON250604', name: 'Lavanya R',     mobile: '9345678901', email: 'lavanya.r@gmail.com',      designation: 'Video Reporter',  reporterType: 'Freelancer', district: 'Warangal',   experience: '6 Months',  appliedOn: new Date('2025-05-30T14:15:00'), status: 'pending',  language: 'Telugu', coverageAreas: ['Sports', 'Entertainment'] },
  { id: 'c5', contributorId: 'CON250605', name: 'Kiran N',       mobile: '9000098765', email: 'kiran.n@gmail.com',        designation: 'Reporter',        reporterType: 'Full Time',  district: 'Nizamabad',  experience: '3 Years',   appliedOn: new Date('2025-05-29T11:10:00'), status: 'pending',  language: 'Telugu', coverageAreas: ['Agriculture', 'Health'] },
  { id: 'c6', contributorId: 'CON250606', name: 'Anjali Devi',   mobile: '9394949494', email: 'anjali.devi@gmail.com',    designation: 'Contributor',     reporterType: 'Freelancer', district: 'Khammam',    experience: '1.5 Years', appliedOn: new Date('2025-05-28T15:30:00'), status: 'approved', approvedOn: new Date('2025-05-30'), language: 'Telugu', coverageAreas: ['Health', 'Agriculture'] },
  { id: 'c7', contributorId: 'CON250607', name: 'Mahesh Y',      mobile: '9512345678', email: 'mahesh.y@gmail.com',       designation: 'Reporter',        reporterType: 'Part Time',  district: 'Medak',      experience: '4 Years',   appliedOn: new Date('2025-05-27T10:05:00'), status: 'rejected', rejectedOn: new Date('2025-05-30'), language: 'Telugu', coverageAreas: ['Sports', 'Entertainment'] },
  { id: 'c8', contributorId: 'CON250608', name: 'Priya Kumari',  mobile: '9601234567', email: 'priya.k@gmail.com',        designation: 'Photographer',    reporterType: 'Freelancer', district: 'Adilabad',   experience: '1 Year',    appliedOn: new Date('2025-05-26T09:00:00'), status: 'pending',  language: 'Telugu', coverageAreas: ['Entertainment', 'Sports'] },
]

const STATUS_TABS: { label: string; value: ContributorStatus | '' }[] = [
  { label: 'All',      value: '' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500',
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

function avatarColor(id: string) {
  const n = id.replace(/\D/g, '')
  return AVATAR_COLORS[parseInt(n || '0') % AVATAR_COLORS.length]!
}

function daysSince(d: Date) { return Math.floor((Date.now() - d.getTime()) / 86400000) }

function StatusBadge({ status }: { status: ContributorStatus }) {
  const map: Record<ContributorStatus, { label: string; className: string }> = {
    pending:  { label: 'Pending',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
    deleted:  { label: 'Deleted',  className: 'bg-muted text-muted-foreground border-border' },
  }
  const { label, className } = map[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', className)}>
      {label}
    </span>
  )
}

function TypeBadge({ type }: { type: ReporterType }) {
  const map: Record<ReporterType, string> = {
    'Full Time':  'bg-blue-50 text-blue-700 border-blue-200',
    'Part Time':  'bg-purple-50 text-purple-700 border-purple-200',
    'Freelancer': 'bg-teal-50 text-teal-700 border-teal-200',
    'Intern':     'bg-orange-50 text-orange-700 border-orange-200',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', map[type])}>
      {type}
    </span>
  )
}

const PAGE_SIZE = 10

export function AllContributorsClient() {
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState<ContributorStatus | ''>('')
  const [district, setDistrict] = useState('')
  const [type, setType]         = useState<ReporterType | ''>('')
  const [page, setPage]         = useState(1)

  const districts = [...new Set(ALL_CONTRIBUTORS.map(c => c.district))].sort()

  const filtered = useMemo(() => {
    return ALL_CONTRIBUTORS.filter(c => {
      if (tab && c.status !== tab) return false
      if (district && c.district !== district) return false
      if (type && c.reporterType !== type) return false
      if (search) {
        const q = search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) &&
            !c.email.toLowerCase().includes(q) &&
            !c.mobile.includes(q) &&
            !c.contributorId.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tab, district, type, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    '':         ALL_CONTRIBUTORS.length,
    pending:    ALL_CONTRIBUTORS.filter(c => c.status === 'pending').length,
    approved:   ALL_CONTRIBUTORS.filter(c => c.status === 'approved').length,
    rejected:   ALL_CONTRIBUTORS.filter(c => c.status === 'rejected').length,
  }

  function switchTab(v: ContributorStatus | '') { setTab(v); setPage(1) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">All Contributors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage reporters, stringers, and contributors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Filter className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => router.push('/dashboard/contributors/add')}>
            <Plus className="h-3.5 w-3.5" /> Add Contributor
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total',    value: ALL_CONTRIBUTORS.length, icon: Users2,       color: 'text-foreground' },
          { label: 'Pending',  value: counts.pending,           icon: Clock,        color: 'text-amber-600' },
          { label: 'Approved', value: counts.approved,          icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Rejected', value: counts.rejected,          icon: XCircle,      color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, email, ID..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <select
          value={district}
          onChange={e => { setDistrict(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={type}
          onChange={e => { setType(e.target.value as ReporterType | ''); setPage(1) }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Types</option>
          {(['Full Time', 'Part Time', 'Freelancer', 'Intern'] as ReporterType[]).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => switchTab(t.value)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              tab === t.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {(counts as Record<string, number>)[t.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Contributor</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">ID</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Contact</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">District</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">Applied</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                  No contributors found
                </td>
              </tr>
            ) : pageItems.map(c => (
              <tr
                key={c.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => router.push('/dashboard/contributors/approvals')}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold', avatarColor(c.id))}>
                      {initials(c.name)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground leading-tight">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.designation}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs font-mono text-muted-foreground">{c.contributorId}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Phone className="h-3 w-3" />{c.mobile}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Mail className="h-3 w-3" />{c.email}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />{c.district}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={c.reporterType} />
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className="text-[11px] text-muted-foreground">{daysSince(c.appliedOn)}d ago</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} contributors</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
