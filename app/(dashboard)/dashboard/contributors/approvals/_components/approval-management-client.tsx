'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, Plus, Eye, Check, X, ChevronLeft, ChevronRight, ChevronDown,
  RotateCcw, Calendar, Phone, Mail, MapPin, User, Briefcase, FileText,
  Clock, AlertTriangle, Download, CheckSquare, Square, MessageSquare,
  Activity, Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredContributors, saveStoredContributors } from '@/lib/mock/contributors-store'
import { downloadCsv } from '@/lib/utils'
import type { Contributor, ReporterType, ContributorStatus } from '@/lib/mock/contributors-store'

// ── Helpers ───────────────────────────────────────────────────────────────────

const DESIGNATIONS  = ['Reporter', 'Stringer', 'Video Reporter', 'Contributor', 'Photographer', 'Anchor', 'Editor']
const REPORTER_TYPES: ReporterType[] = ['Full Time', 'Part Time', 'Freelancer', 'Intern']
const DISTRICTS     = ['Hyderabad', 'Karimnagar', 'Warangal', 'Nizamabad', 'Khammam', 'Medak', 'Adilabad', 'Nalgonda', 'Rangareddy']

const STATUS_TABS: { label: string; value: 'pending' | 'rejected' }[] = [
  { label: 'Requests',  value: 'pending'  },
  { label: 'Rejected',  value: 'rejected' },
]

function daysSince(d: Date) { return Math.floor((Date.now() - d.getTime()) / 86400000) }
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: Date) {
  return fmtDate(d) + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
]

function Avatar({ name, photoUrl, size = 'sm' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }[size]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  const color = AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${sz} rounded-full object-cover border border-border shrink-0`} />
  return (
    <div className={`${sz} rounded-full ${color} flex items-center justify-center font-semibold shrink-0`}>
      {initials(name)}
    </div>
  )
}

function StatusBadge({ status }: { status: ContributorStatus }) {
  const cfg: Record<ContributorStatus, string> = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
    deleted:  'bg-muted text-muted-foreground border-border',
    inactive: 'bg-muted text-muted-foreground border-border',
  }
  const labels: Record<ContributorStatus, string> = {
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected', deleted: 'Deleted', inactive: 'Inactive',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg[status]}`}>
      {labels[status]}
    </span>
  )
}

function TypeBadge({ type }: { type: ReporterType }) {
  const cfg: Record<ReporterType, string> = {
    'Full Time': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    'Part Time': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    'Freelancer': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20',
    'Intern': 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg[type]}`}>
      {type}
    </span>
  )
}

function DaysPendingBadge({ days }: { days: number }) {
  if (days <= 1) return <span className="text-[11px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400">Today</span>
  if (days <= 3) return <span className="text-[11px] font-medium tabular-nums text-blue-600 dark:text-blue-400">{days}d ago</span>
  if (days <= 7) return <span className="text-[11px] font-medium tabular-nums text-amber-600 dark:text-amber-400">{days}d ago</span>
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-red-600 dark:text-red-400"><AlertTriangle className="h-3 w-3" />{days}d ago</span>
}

function DocCount({ docs }: { docs?: { submitted: boolean }[] }) {
  if (!docs?.length) return <span className="text-muted-foreground text-[11px]">—</span>
  const submitted = docs.filter(d => d.submitted).length
  const color = submitted === docs.length
    ? 'text-emerald-600 dark:text-emerald-400'
    : submitted === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
  return <span className={`text-[12px] font-semibold tabular-nums ${color}`}>{submitted}/{docs.length}</span>
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: (remarks: string) => void; onCancel: () => void }) {
  const [remarks, setRemarks] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border ring-1 ring-border/50 shadow-2xl w-full max-w-[400px] p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Reject Application</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Rejecting <span className="font-medium text-foreground">{name}</span>. Provide a reason (shown to the reporter).</p>
          </div>
        </div>
        <label htmlFor="reject-remarks" className="sr-only">Rejection reason</label>
        <textarea
          id="reject-remarks"
          value={remarks} onChange={e => setRemarks(e.target.value)}
          placeholder="e.g. Documents incomplete — Aadhaar copy missing."
          className="w-full h-24 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] resize-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40 placeholder:text-muted-foreground"
        />
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onConfirm(remarks)}>
            Confirm Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

type DetailTab = 'overview' | 'documents' | 'activity'

function DetailPanel({ contributor, onClose, onApprove, onRejectClick }: {
  contributor: Contributor
  onClose: () => void
  onApprove: (id: string, designation: string) => void
  onRejectClick: (id: string) => void
}) {
  const [tab, setTab]   = useState<DetailTab>('overview')
  const [desg, setDesg] = useState(contributor.designation ?? '')

  const isPending  = contributor.status === 'pending'
  const docCount   = contributor.documents?.filter(d => d.submitted).length ?? 0
  const docTotal   = contributor.documents?.length ?? 0
  const allDocsOk  = docCount === docTotal

  // Simulated activity log
  const activityLog = [
    { ts: contributor.appliedOn, actor: 'Applicant', text: 'Application submitted via Reporter App' },
    ...(contributor.status !== 'pending' ? [
      { ts: contributor.approvedOn ?? contributor.rejectedOn ?? new Date(), actor: 'Admin', text: contributor.status === 'approved' ? `Application approved — assigned as ${contributor.designation}` : `Application rejected. Reason: ${contributor.remarks || 'Not specified'}` },
    ] : []),
  ]

  return (
    <div className="flex flex-col h-full border-l border-border bg-card w-[380px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Contributor Details</h3>
        <button onClick={onClose} title="Close" aria-label="Close details"
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Identity */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-start gap-3">
          <Avatar name={contributor.name} photoUrl={contributor.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-[15px] tracking-tight">{contributor.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{contributor.contributorId}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <StatusBadge status={contributor.status} />
              <TypeBadge type={contributor.reporterType} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Applied {fmtDate(contributor.appliedOn)} · {daysSince(contributor.appliedOn)} days ago
            </p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Docs</p>
            <div className="mt-0.5"><DocCount docs={contributor.documents} /></div>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Experience</p>
            <p className="text-[12px] font-semibold text-foreground mt-0.5 truncate">{contributor.experience}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Source</p>
            <p className="text-[12px] font-semibold text-foreground mt-0.5 truncate">{contributor.source?.includes('iOS') ? 'iOS' : 'Android'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        {(['overview', 'documents', 'activity'] as DetailTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors capitalize
              ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'activity' ? 'Activity' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'documents' && !allDocsOk && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {tab === 'overview' && (
          <>
            <Section title="Personal">
              <Row icon={Phone}    label="Mobile"    value={contributor.mobile} />
              <Row icon={Mail}     label="Email"     value={contributor.email} />
              <Row icon={Calendar} label="Date of Birth" value={contributor.dob ?? '—'} />
              <Row icon={User}     label="Gender"    value={contributor.gender ?? '—'} />
              <Row icon={MapPin}   label="Address"   value={contributor.address ?? '—'} />
            </Section>

            <Section title="Application">
              <Row icon={Briefcase} label="Designation"  value={contributor.designation} />
              <Row icon={User}      label="Reporter Type" value={contributor.reporterType} />
              <Row icon={Clock}     label="Experience"    value={contributor.experience} />
              <Row icon={FileText}  label="Language"      value={contributor.language ?? '—'} />
              <Row icon={MapPin}    label="District"      value={contributor.district} />
            </Section>

            {contributor.coverageAreas?.length ? (
              <Section title="Coverage">
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {contributor.coverageAreas.map(a => (
                    <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{a}</span>
                  ))}
                </div>
              </Section>
            ) : null}

            {contributor.bio && (
              <Section title="Bio">
                <p className="text-xs text-foreground leading-relaxed">{contributor.bio}</p>
              </Section>
            )}

            {/* Assign designation (pending only) */}
            {isPending && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/10">
                <label htmlFor="assign-designation" className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                  <Briefcase className="h-3.5 w-3.5" />Assign Designation <span className="text-red-500">*</span>
                </label>
                <Select
                  value={desg || 'none'}
                  onValueChange={v => setDesg(v === 'none' ? '' : (v || ''))}
                >
                  <SelectTrigger id="assign-designation" className="w-full h-9 bg-background border-amber-200 text-foreground text-sm rounded-lg dark:border-amber-500/25">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select designation</SelectItem>
                    {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {desg && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" />Will be approved as: {desg}
                  </p>
                )}
              </div>
            )}

            {contributor.remarks && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-[11px] font-semibold text-red-700 dark:text-red-300 mb-0.5">Rejection Reason</p>
                <p className="text-[13px] text-red-600 dark:text-red-400 leading-relaxed">{contributor.remarks}</p>
              </div>
            )}
          </>
        )}

        {tab === 'documents' && (
          <div className="space-y-2">
            {contributor.documents ? (
              <>
                <div className={`rounded-xl border px-3 py-2.5 mb-3 ${allDocsOk ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'}`}>
                  <p className={`text-[13px] font-semibold ${allDocsOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {allDocsOk ? `All ${docTotal} documents submitted` : `${docCount} of ${docTotal} documents submitted — ${docTotal - docCount} missing`}
                  </p>
                </div>
                {contributor.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[13px] font-medium text-foreground">{doc.label}</span>
                    </div>
                    {doc.submitted
                      ? <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" />Submitted</span>
                      : <span className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><X className="h-3 w-3" />Missing</span>
                    }
                  </div>
                ))}
                {!allDocsOk && (
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-2 gap-1.5 rounded-lg"
                    onClick={() => toast.info('Reminder sent to applicant')}>
                    <MessageSquare className="h-3.5 w-3.5" />Send Document Reminder
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">No documents on record</p>
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-3">
            {activityLog.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {i < activityLog.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-[11px] font-semibold text-foreground">{entry.actor}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{entry.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{fmtDateTime(entry.ts)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {isPending && (
        <div className="flex flex-col gap-2 px-5 py-4 border-t border-border bg-muted/10">
          {!desg && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 shrink-0" />Select a designation above to enable approval
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!desg}
              className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 disabled:opacity-50"
              onClick={() => onApprove(contributor.id, desg)}>
              <Check className="h-3.5 w-3.5" />Approve
            </Button>
            <Button size="sm" variant="outline"
              className="flex-1 rounded-lg text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/25 hover:bg-red-50 dark:hover:bg-red-500/10 gap-1.5"
              onClick={() => onRejectClick(contributor.id)}>
              <X className="h-3.5 w-3.5" />Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      <div className="rounded-xl border border-border divide-y divide-border">{children}</div>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-[11px] text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-[11px] text-foreground flex-1 leading-relaxed">{value}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function ApprovalManagementClient() {
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [activeTab, setActiveTab]       = useState<'pending' | 'rejected'>('pending')
  const [search, setSearch]             = useState('')
  const [designationFilter, setDesignationFilter] = useState('all')
  const [districtFilter, setDistrictFilter]       = useState('all')
  const [typeFilter, setTypeFilter]               = useState('all')
  const [page, setPage]                           = useState(1)
  const [pageSize, setPageSize]                   = useState(10)
  const [selected, setSelected]                   = useState<Contributor | null>(null)
  const [rejectTarget, setRejectTarget]           = useState<string | null>(null)
  const [bulkSelected, setBulkSelected]           = useState<Set<string>>(new Set())

  useEffect(() => {
    setContributors(getStoredContributors())
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contributors.filter(c => {
      if (c.status !== activeTab) return false
      if (designationFilter && designationFilter !== 'all' && c.designation !== designationFilter) return false
      if (districtFilter    && districtFilter !== 'all'    && c.district    !== districtFilter)    return false
      if (typeFilter        && typeFilter !== 'all'        && c.reporterType !== typeFilter)        return false
      if (q && !c.name.toLowerCase().includes(q) && !c.mobile.includes(q) && !c.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [contributors, activeTab, search, designationFilter, districtFilter, typeFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage  = Math.min(page, pageCount)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const counts = useMemo(() => {
    const m: Record<string, number> = { pending: 0, approved: 0, rejected: 0 }
    for (const c of contributors) {
      m[c.status] = (m[c.status] ?? 0) + 1
    }
    return m
  }, [contributors])

  const thisMonth = useMemo(() => {
    const now = new Date()
    return contributors.filter(c => c.appliedOn.getFullYear() === now.getFullYear() && c.appliedOn.getMonth() === now.getMonth()).length
  }, [contributors])

  function handleApprove(id: string, designation: string) {
    const list = getStoredContributors()
    const updated = list.map(c =>
      c.id === id ? { ...c, status: 'approved' as const, designation, approvedOn: new Date() } : c
    )
    saveStoredContributors(updated)
    setContributors(updated)

    if (selected?.id === id) {
      setSelected(null) // Hide details panel once approved since they move off this list
    }
    toast.success(`Approved as ${designation}`)
  }

  function handleReject(id: string, remarks: string) {
    const list = getStoredContributors()
    const updated = list.map(c =>
      c.id === id ? { ...c, status: 'rejected' as const, remarks, rejectedOn: new Date() } : c
    )
    saveStoredContributors(updated)
    setContributors(updated)

    if (selected?.id === id) {
      const match = updated.find(x => x.id === id) ?? null
      setSelected(match)
    }
    setRejectTarget(null)
    toast.error('Application rejected')
  }

  function handleBulkApprove() {
    const ids = Array.from(bulkSelected)
    const list = getStoredContributors()
    const updated = list.map(c =>
      ids.includes(c.id) ? { ...c, status: 'approved' as const, approvedOn: new Date(), designation: c.designation || 'Reporter' } : c
    )
    saveStoredContributors(updated)
    setContributors(updated)
    toast.success(`${ids.length} contributor(s) approved`)
    setBulkSelected(new Set())
    setSelected(null)
  }

  function toggleBulk(id: string) {
    setBulkSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetFilters() { setSearch(''); setDesignationFilter('all'); setDistrictFilter('all'); setTypeFilter('all'); setPage(1) }

  function exportCsv() {
    const rows = filtered.map(c => ({
      'Contributor ID': c.contributorId,
      'Name':           c.name,
      'Status':         c.status,
      'Mobile':         c.mobile,
      'Email':          c.email,
      'Designation':    c.designation ?? '',
      'District':       c.district,
      'State':          c.state ?? '',
      'Type':           c.reporterType,
      'Applied On':     c.appliedOn.toISOString(),
      'Approved On':    c.approvedOn ? c.approvedOn.toISOString() : '',
      'Rejected On':    c.rejectedOn ? c.rejectedOn.toISOString() : '',
      'Remarks':        c.remarks ?? '',
    }))
    downloadCsv(`contributor-requests-${activeTab}.csv`, rows)
  }

  const allPageSelected = paginated.length > 0 && paginated.every(c => bulkSelected.has(c.id))

  function toggleAllPage() {
    if (allPageSelected) setBulkSelected(prev => { const n = new Set(prev); paginated.forEach(c => n.delete(c.id)); return n })
    else setBulkSelected(prev => { const n = new Set(prev); paginated.forEach(c => n.add(c.id)); return n })
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contributor Requests</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Review, approve and manage contributor applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg bg-background cursor-pointer"
            onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pending Review',     value: counts['pending'] ?? 0,  color: 'text-amber-600 dark:text-amber-400',     icon: Clock,         bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Rejected Requests',  value: counts['rejected'] ?? 0, color: 'text-red-600 dark:text-red-400',         icon: X,             bg: 'bg-red-50 dark:bg-red-500/10' },
          { label: 'Total Approved',     value: counts['approved'] ?? 0, color: 'text-emerald-600 dark:text-emerald-400', icon: Check,         bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Applied This Month', value: thisMonth,               color: 'text-blue-600 dark:text-blue-400',       icon: Calendar,      bg: 'bg-blue-50 dark:bg-blue-500/10' },
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

      <div className="flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search name, mobile, email…"
                className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>

            <Select value={designationFilter} onValueChange={v => { setDesignationFilter(v || 'all'); setPage(1) }}>
              <SelectTrigger aria-label="Filter by designation" className="h-8 w-40 rounded-lg text-xs bg-background text-foreground border-border px-2.5">
                <SelectValue placeholder="All designations" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All designations</SelectItem>
                {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={districtFilter} onValueChange={v => { setDistrictFilter(v || 'all'); setPage(1) }}>
              <SelectTrigger aria-label="Filter by district" className="h-8 w-36 rounded-lg text-xs bg-background text-foreground border-border px-2.5">
                <SelectValue placeholder="All districts" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All districts</SelectItem>
                {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v || 'all'); setPage(1) }}>
              <SelectTrigger aria-label="Filter by reporter type" className="h-8 w-32 rounded-lg text-xs bg-background text-foreground border-border px-2.5">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="all">All types</SelectItem>
                {REPORTER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={resetFilters} title="Reset filters"
              className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5 cursor-pointer">
              <RotateCcw className="h-3.5 w-3.5" />Reset
            </button>
          </div>

          {/* Status tabs */}
          <div className="flex border-b border-border px-4">
            {STATUS_TABS.map(tab => {
              const active = activeTab === tab.value
              const count  = counts[tab.value] ?? 0
              return (
                <button key={tab.value} onClick={() => { setActiveTab(tab.value); setPage(1); setBulkSelected(new Set()) }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors
                    ${active ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none
                      ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Bulk action bar */}
          {bulkSelected.size > 0 && activeTab === 'pending' && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20">
              <span className="text-xs font-medium text-primary">{bulkSelected.size} selected</span>
              <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleBulkApprove}>
                <Check className="h-3 w-3" />Approve All
              </Button>
              <button className="text-xs text-primary underline" onClick={() => setBulkSelected(new Set())}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border">
                  {activeTab === 'pending' && (
                    <th className="py-3 px-3 w-8 text-center bg-muted/30 backdrop-blur-sm rounded-tl-xl">
                      <button onClick={toggleAllPage} title={allPageSelected ? 'Deselect all on page' : 'Select all on page'}
                        aria-label={allPageSelected ? 'Deselect all on page' : 'Select all on page'}
                        className="flex items-center justify-center">
                        {allPageSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </th>
                  )}
                  {['Contributor', 'ID', 'Contact', 'Designation', 'District', 'Type', 'Docs', 'Applied', ''].map((h, i) => {
                    const isFirst = activeTab !== 'pending' && i === 0
                    const isLast = i === 8
                    return (
                      <th key={h || `col-${i}`}
                        className={`py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap bg-muted/30 backdrop-blur-sm
                          ${h === 'Docs' ? 'text-center' : 'text-left'}
                          ${isFirst ? 'rounded-tl-xl' : ''}
                          ${isLast ? 'rounded-tr-xl' : ''}
                        `}>
                        {h}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'pending' ? 10 : 9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-foreground">No applications found</p>
                          <p className="text-[13px] text-muted-foreground mt-1">
                            {search || designationFilter || districtFilter || typeFilter
                              ? 'Try adjusting your filters or search.'
                              : activeTab === 'pending' ? 'New contributor requests will appear here.' : 'No rejected applications yet.'}
                          </p>
                        </div>
                        {(search || designationFilter || districtFilter || typeFilter) && (
                          <Button size="sm" variant="outline" className="rounded-lg gap-1.5 mt-1" onClick={resetFilters}>
                            <RotateCcw className="h-3.5 w-3.5" />Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : paginated.map(c => (
                  <tr key={c.id}
                    className={`transition-colors hover:bg-muted/20 cursor-pointer ${selected?.id === c.id ? 'bg-muted/30' : ''}`}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}>

                    {activeTab === 'pending' && (
                      <td className="py-3 px-3 align-middle text-center w-8" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleBulk(c.id)}>
                          {bulkSelected.has(c.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                    )}

                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} photoUrl={c.photoUrl} size="sm" />
                        <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">{c.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <span className="text-[10px] font-mono text-muted-foreground">{c.contributorId}</span>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="min-w-0">
                        <p className="text-xs text-foreground font-mono tabular-nums">{c.mobile}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[140px] mt-0.5">{c.email}</p>
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle text-xs text-foreground">
                      {c.designation || '—'}
                    </td>

                    <td className="py-3 px-3 align-middle text-xs text-foreground">
                      {c.district}
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <TypeBadge type={c.reporterType} />
                    </td>

                    <td className="py-3 px-3 align-middle text-center">
                      <DocCount docs={c.documents} />
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <DaysPendingBadge days={daysSince(c.appliedOn)} />
                    </td>

                    <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => setSelected(selected?.id === c.id ? null : c)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(c); toast.info('Assign a designation in the side panel, then approve') }}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setRejectTarget(c.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {c.status !== 'pending' && <StatusBadge status={c.status} />}
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

        {/* Side panel */}
        {selected && (
          <DetailPanel
            contributor={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onRejectClick={id => setRejectTarget(id)}
          />
        )}
      </div>

      {/* Reject dialog */}
      {rejectTarget && (
        <RejectDialog
          name={contributors.find(c => c.id === rejectTarget)?.name ?? ''}
          onConfirm={remarks => handleReject(rejectTarget, remarks)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}
