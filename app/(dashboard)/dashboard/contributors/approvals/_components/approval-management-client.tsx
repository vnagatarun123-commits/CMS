'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, Plus, Eye, Check, X, ChevronLeft, ChevronRight, ChevronDown,
  RotateCcw, Calendar, Phone, Mail, MapPin, User, Briefcase, FileText,
  Clock, AlertTriangle, Download, CheckSquare, Square, MessageSquare,
  Activity, IndianRupee,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Types ─────────────────────────────────────────────────────────────────────

type ContributorStatus = 'pending' | 'approved' | 'rejected' | 'deleted'
type ReporterType = 'Full Time' | 'Part Time' | 'Freelancer' | 'Intern'

interface Contributor {
  id: string
  contributorId: string
  name: string
  photoUrl?: string | null
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
  dob?: string
  gender?: string
  address?: string
  source?: string
  bio?: string
  remarks?: string
  language?: string
  coverageAreas?: string[]
  newsGenres?: string[]
  documents?: { label: string; submitted: boolean }[]
}

// ── Mock seed ─────────────────────────────────────────────────────────────────

const DOCS_FULL = [
  { label: 'Aadhaar Card', submitted: true },
  { label: 'PAN Card', submitted: true },
  { label: 'Press Card', submitted: false },
  { label: 'Profile Photo', submitted: true },
  { label: 'Address Proof', submitted: true },
]

const SEED: Contributor[] = [
  {
    id: 'c1', contributorId: 'CON250601', name: 'Ramesh Kumar', photoUrl: null,
    mobile: '9876543210', email: 'ramesh.kumar@gmail.com', designation: 'Reporter', reporterType: 'Full Time',
    district: 'Karimnagar', experience: '2 Years', appliedOn: new Date('2025-06-01T10:30:00'), status: 'pending',
    dob: '12 Apr 1995 (30 Yrs)', gender: 'Male',
    address: 'H No: 12-3-45, Street No. 4, New Colony, Karimnagar, Telangana - 505001',
    source: 'Reporter App (Android)', bio: 'Passionate about local news and community stories.', language: 'Telugu',
    coverageAreas: ['Politics', 'Crime'], newsGenres: ['Breaking News', 'Investigative'],
    documents: DOCS_FULL, remarks: '',
  },
  {
    id: 'c2', contributorId: 'CON250602', name: 'Shilpa P', photoUrl: null,
    mobile: '9123456780', email: 'shilpa.p@gmail.com', designation: 'Stringer', reporterType: 'Part Time',
    district: 'Warangal', experience: '1 Year', appliedOn: new Date('2025-06-01T09:45:00'), status: 'pending',
    dob: '05 Aug 1998 (26 Yrs)', gender: 'Female',
    address: 'Flat 204, Sai Towers, Hanamkonda, Warangal, Telangana - 506001',
    source: 'Reporter App (Android)', bio: 'Freelance writer covering politics and culture.', language: 'Telugu',
    coverageAreas: ['Education', 'Health'], newsGenres: ['Feature Stories', 'Analysis'],
    documents: [
      { label: 'Aadhaar Card', submitted: true }, { label: 'PAN Card', submitted: false },
      { label: 'Press Card', submitted: false }, { label: 'Profile Photo', submitted: true },
      { label: 'Address Proof', submitted: false },
    ], remarks: '',
  },
  {
    id: 'c3', contributorId: 'CON250603', name: 'Venkatesh B', photoUrl: null,
    mobile: '9988776655', email: 'venkatesh.b@gmail.com', designation: 'Reporter', reporterType: 'Full Time',
    district: 'Hyderabad', experience: '5 Years', appliedOn: new Date('2025-05-31T16:20:00'), status: 'pending',
    dob: '22 Mar 1990 (35 Yrs)', gender: 'Male',
    address: 'Plot 8, Jubilee Hills, Hyderabad, Telangana - 500033',
    source: 'Reporter App (iOS)', bio: 'Covering crime and political beats in Hyderabad.', language: 'Telugu',
    coverageAreas: ['Politics', 'Crime'], newsGenres: ['Breaking News', 'Investigative'],
    documents: DOCS_FULL, remarks: '',
  },
  {
    id: 'c4', contributorId: 'CON250604', name: 'Lavanya R', photoUrl: null,
    mobile: '9345678901', email: 'lavanya.r@gmail.com', designation: 'Video Reporter', reporterType: 'Freelancer',
    district: 'Warangal', experience: '6 Months', appliedOn: new Date('2025-05-30T14:15:00'), status: 'pending',
    dob: '18 Nov 2000 (24 Yrs)', gender: 'Female',
    address: 'Door No. 3-5-89, Kazipet, Warangal, Telangana - 506003',
    source: 'Reporter App (Android)', bio: 'Video journalist with a passion for ground-level reporting.', language: 'Telugu',
    coverageAreas: ['Sports', 'Entertainment'], newsGenres: ['Live Updates', 'Feature Stories'],
    documents: [
      { label: 'Aadhaar Card', submitted: true }, { label: 'PAN Card', submitted: true },
      { label: 'Press Card', submitted: false }, { label: 'Profile Photo', submitted: true },
      { label: 'Address Proof', submitted: true },
    ], remarks: '',
  },
  {
    id: 'c5', contributorId: 'CON250605', name: 'Kiran N', photoUrl: null,
    mobile: '9000098765', email: 'kiran.n@gmail.com', designation: 'Reporter', reporterType: 'Full Time',
    district: 'Nizamabad', experience: '3 Years', appliedOn: new Date('2025-05-29T11:10:00'), status: 'pending',
    dob: '08 Jul 1993 (31 Yrs)', gender: 'Male',
    address: 'H No: 7-1-22, Armoor Road, Nizamabad, Telangana - 503001',
    source: 'Reporter App (Android)', bio: 'Agricultural and rural affairs correspondent.', language: 'Telugu',
    coverageAreas: ['Agriculture', 'Health'], newsGenres: ['Feature Stories', 'Interviews'],
    documents: DOCS_FULL, remarks: '',
  },
  {
    id: 'c6', contributorId: 'CON250606', name: 'Anjali Devi', photoUrl: null,
    mobile: '9394949494', email: 'anjali.devi@gmail.com', designation: 'Contributor', reporterType: 'Freelancer',
    district: 'Khammam', experience: '1.5 Years', appliedOn: new Date('2025-05-28T15:30:00'), status: 'approved',
    approvedOn: new Date('2025-05-30'), dob: '14 Feb 1997 (28 Yrs)', gender: 'Female',
    address: '5-4-100, Mukthinagar, Khammam, Telangana - 507001',
    source: 'Reporter App (iOS)', bio: 'Health and lifestyle contributor.', language: 'Telugu',
    coverageAreas: ['Health', 'Agriculture'], newsGenres: ['Feature Stories', 'Analysis'],
    documents: DOCS_FULL, remarks: 'Approved after document verification.',
  },
  {
    id: 'c7', contributorId: 'CON250607', name: 'Mahesh Y', photoUrl: null,
    mobile: '9512345678', email: 'mahesh.y@gmail.com', designation: 'Reporter', reporterType: 'Part Time',
    district: 'Medak', experience: '4 Years', appliedOn: new Date('2025-05-27T10:05:00'), status: 'rejected',
    rejectedOn: new Date('2025-05-30'), dob: '30 Sep 1992 (32 Yrs)', gender: 'Male',
    address: 'Plot 12-A, Siddipet Road, Medak, Telangana - 502110',
    source: 'Reporter App (Android)', bio: 'Sports and entertainment reporter.', language: 'Telugu',
    coverageAreas: ['Sports', 'Entertainment'], newsGenres: ['Breaking News'],
    documents: [
      { label: 'Aadhaar Card', submitted: false }, { label: 'PAN Card', submitted: true },
      { label: 'Press Card', submitted: false }, { label: 'Profile Photo', submitted: true },
      { label: 'Address Proof', submitted: false },
    ], remarks: 'Documents incomplete — Aadhaar copy missing.',
  },
  {
    id: 'c8', contributorId: 'CON250608', name: 'Priya Kumari', photoUrl: null,
    mobile: '9601234567', email: 'priya.k@gmail.com', designation: 'Photographer', reporterType: 'Freelancer',
    district: 'Adilabad', experience: '1 Year', appliedOn: new Date('2025-05-26T09:00:00'), status: 'pending',
    dob: '25 Jan 2001 (24 Yrs)', gender: 'Female',
    address: '2-9-67, Bazaar Street, Adilabad, Telangana - 504001',
    source: 'Reporter App (Android)', bio: 'Visual storyteller covering local events.', language: 'Telugu',
    coverageAreas: ['Entertainment', 'Sports'], newsGenres: ['Feature Stories'],
    documents: [
      { label: 'Aadhaar Card', submitted: true }, { label: 'PAN Card', submitted: false },
      { label: 'Press Card', submitted: false }, { label: 'Profile Photo', submitted: true },
      { label: 'Address Proof', submitted: true },
    ], remarks: '',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const DESIGNATIONS  = ['Reporter', 'Stringer', 'Video Reporter', 'Contributor', 'Photographer', 'Anchor', 'Editor']
const REPORTER_TYPES: ReporterType[] = ['Full Time', 'Part Time', 'Freelancer', 'Intern']
const DISTRICTS     = ['Hyderabad', 'Karimnagar', 'Warangal', 'Nizamabad', 'Khammam', 'Medak', 'Adilabad', 'Nalgonda', 'Rangareddy']

const STATUS_TABS: { label: string; value: ContributorStatus | 'all' }[] = [
  { label: 'Requests',  value: 'pending'  },
  { label: 'Approved',  value: 'approved' },
  { label: 'Rejected',  value: 'rejected' },
  { label: 'Deleted',   value: 'deleted'  },
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
  'bg-violet-200 text-violet-800', 'bg-emerald-200 text-emerald-800',
  'bg-sky-200 text-sky-800', 'bg-rose-200 text-rose-800', 'bg-amber-200 text-amber-800',
]

function Avatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }[size]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  const color = AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!
  if (photoUrl) return <img src={photoUrl} alt={name} className={`${sz} rounded-full object-cover border border-border shrink-0`} />
  return (
    <div className={`${sz} rounded-full ${color} flex items-center justify-center font-bold shrink-0`}>
      {initials(name)}
    </div>
  )
}

function StatusBadge({ status }: { status: ContributorStatus }) {
  const cfg: Record<ContributorStatus, string> = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    deleted:  'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<ContributorStatus, string> = {
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected', deleted: 'Deleted',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg[status]}`}>
      {labels[status]}
    </span>
  )
}

function TypeBadge({ type }: { type: ReporterType }) {
  const cfg: Record<ReporterType, string> = {
    'Full Time': 'bg-blue-50 text-blue-700 border-blue-200',
    'Part Time': 'bg-purple-50 text-purple-700 border-purple-200',
    'Freelancer': 'bg-orange-50 text-orange-700 border-orange-200',
    'Intern': 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg[type]}`}>
      {type}
    </span>
  )
}

function DaysPendingBadge({ days }: { days: number }) {
  if (days <= 1) return <span className="text-[10px] font-semibold text-emerald-600">Today</span>
  if (days <= 3) return <span className="text-[10px] font-semibold text-blue-600">{days}d ago</span>
  if (days <= 7) return <span className="text-[10px] font-semibold text-amber-600">{days}d ago</span>
  return <span className="text-[10px] font-semibold text-red-600">{days}d ago !</span>
}

function DocCount({ docs }: { docs?: { submitted: boolean }[] }) {
  if (!docs?.length) return <span className="text-muted-foreground text-[10px]">—</span>
  const submitted = docs.filter(d => d.submitted).length
  const color = submitted === docs.length ? 'text-emerald-600' : submitted === 0 ? 'text-red-600' : 'text-amber-600'
  return <span className={`text-[11px] font-semibold ${color}`}>{submitted}/{docs.length}</span>
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: (remarks: string) => void; onCancel: () => void }) {
  const [remarks, setRemarks] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-2xl w-[380px] p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Reject Application</h3>
        <p className="text-xs text-muted-foreground mb-4">Rejecting <span className="font-medium text-foreground">{name}</span>. Provide a reason (shown to the reporter).</p>
        <textarea
          value={remarks} onChange={e => setRemarks(e.target.value)}
          placeholder="e.g. Documents incomplete — Aadhaar copy missing."
          className="w-full h-24 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs resize-none outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    <div className="flex flex-col h-full border-l border-border bg-background w-[380px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Contributor Details</h3>
        <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Identity */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-start gap-3">
          <Avatar name={contributor.name} photoUrl={contributor.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-sm">{contributor.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{contributor.contributorId}</p>
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
            <p className="text-[10px] text-muted-foreground">Docs</p>
            <DocCount docs={contributor.documents} />
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">Experience</p>
            <p className="text-[11px] font-semibold text-foreground">{contributor.experience}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-center">
            <p className="text-[10px] text-muted-foreground">Source</p>
            <p className="text-[11px] font-semibold text-foreground truncate">{contributor.source?.includes('iOS') ? 'iOS' : 'Android'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        {(['overview', 'documents', 'activity'] as DetailTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors capitalize
              ${tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
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
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                  <Briefcase className="h-3.5 w-3.5" />Assign Designation <span className="text-red-500">*</span>
                </p>
                <div className="relative">
                  <select value={desg} onChange={e => setDesg(e.target.value)}
                    className="w-full h-9 appearance-none rounded-lg border border-amber-200 bg-white px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="" disabled>Select designation</option>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {desg && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" />Will be approved as: {desg}
                  </p>
                )}
              </div>
            )}

            {contributor.remarks && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-red-700 mb-0.5">Rejection Reason</p>
                <p className="text-xs text-red-600">{contributor.remarks}</p>
              </div>
            )}
          </>
        )}

        {tab === 'documents' && (
          <div className="space-y-2">
            {contributor.documents ? (
              <>
                <div className={`rounded-xl border px-3 py-2.5 mb-3 ${allDocsOk ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <p className={`text-xs font-semibold ${allDocsOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {allDocsOk ? `All ${docTotal} documents submitted` : `${docCount} of ${docTotal} documents submitted — ${docTotal - docCount} missing`}
                  </p>
                </div>
                {contributor.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{doc.label}</span>
                    </div>
                    {doc.submitted
                      ? <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" />Submitted</span>
                      : <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1"><X className="h-3 w-3" />Missing</span>
                    }
                  </div>
                ))}
                {!allDocsOk && (
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-2 gap-1.5"
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
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 shrink-0" />Select a designation above to enable approval
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!desg}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 disabled:opacity-50"
              onClick={() => onApprove(contributor.id, desg)}>
              <Check className="h-3.5 w-3.5" />Approve
            </Button>
            <Button size="sm" variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
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

const PAGE_SIZE = 10

export function ApprovalManagementClient() {
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>(SEED)
  const [activeTab, setActiveTab]       = useState<ContributorStatus>('pending')
  const [search, setSearch]             = useState('')
  const [designationFilter, setDesignationFilter] = useState('')
  const [districtFilter, setDistrictFilter]       = useState('')
  const [typeFilter, setTypeFilter]               = useState('')
  const [page, setPage]                           = useState(1)
  const [selected, setSelected]                   = useState<Contributor | null>(null)
  const [rejectTarget, setRejectTarget]           = useState<string | null>(null)
  const [bulkSelected, setBulkSelected]           = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contributors.filter(c => {
      if (c.status !== activeTab) return false
      if (designationFilter && c.designation !== designationFilter) return false
      if (districtFilter    && c.district    !== districtFilter)    return false
      if (typeFilter        && c.reporterType !== typeFilter)        return false
      if (q && !c.name.toLowerCase().includes(q) && !c.mobile.includes(q) && !c.email.toLowerCase().includes(q)) return false
      return true
    })
  }, [contributors, activeTab, search, designationFilter, districtFilter, typeFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage  = Math.min(page, pageCount)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of contributors) m[c.status] = (m[c.status] ?? 0) + 1
    return m
  }, [contributors])

  const thisMonth = useMemo(() => {
    const now = new Date()
    return contributors.filter(c => c.appliedOn.getFullYear() === now.getFullYear() && c.appliedOn.getMonth() === now.getMonth()).length
  }, [contributors])

  const avgReviewDays = useMemo(() => {
    const reviewed = contributors.filter(c => c.status !== 'pending' && (c.approvedOn ?? c.rejectedOn))
    if (!reviewed.length) return 0
    const sum = reviewed.reduce((s, c) => s + daysSince(c.appliedOn), 0)
    return Math.round(sum / reviewed.length)
  }, [contributors])

  function handleApprove(id: string, designation: string) {
    setContributors(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'approved' as const, designation, approvedOn: new Date() } : c
    ))
    setSelected(prev => prev?.id === id ? { ...prev, status: 'approved' as const, designation, approvedOn: new Date() } : prev)
    toast.success(`Approved as ${designation}`)
  }

  function handleReject(id: string, remarks: string) {
    setContributors(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'rejected' as const, remarks, rejectedOn: new Date() } : c
    ))
    setSelected(prev => prev?.id === id ? { ...prev, status: 'rejected' as const, remarks } : prev)
    setRejectTarget(null)
    toast.error('Application rejected')
  }

  function handleBulkApprove() {
    const ids = Array.from(bulkSelected)
    setContributors(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'approved' as const, approvedOn: new Date() } : c))
    toast.success(`${ids.length} contributor(s) approved`)
    setBulkSelected(new Set())
  }

  function toggleBulk(id: string) {
    setBulkSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function resetFilters() { setSearch(''); setDesignationFilter(''); setDistrictFilter(''); setTypeFilter(''); setPage(1) }

  const allPageSelected = paginated.length > 0 && paginated.every(c => bulkSelected.has(c.id))

  function toggleAllPage() {
    if (allPageSelected) setBulkSelected(prev => { const n = new Set(prev); paginated.forEach(c => n.delete(c.id)); return n })
    else setBulkSelected(prev => { const n = new Set(prev); paginated.forEach(c => n.add(c.id)); return n })
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Approval Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review, approve and manage contributor applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"
            onClick={() => toast.info('Export coming soon')}>
            <Download className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push('/dashboard/contributors/add')}>
            <Plus className="h-3.5 w-3.5" />Add Contributor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Applications', value: contributors.length,              color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Pending Review',     value: counts['pending'] ?? 0,           color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'Approved',           value: counts['approved'] ?? 0,          color: 'text-emerald-600',bg: 'bg-emerald-50' },
          { label: 'Rejected',           value: counts['rejected'] ?? 0,          color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Applied This Month', value: thisMonth,                        color: 'text-blue-600',   bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search name, mobile, email…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-8 text-xs" />
            </div>
            <select value={designationFilter} onChange={e => { setDesignationFilter(e.target.value); setPage(1) }}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none w-36">
              <option value="">All designations</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setPage(1) }}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none w-32">
              <option value="">All districts</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none w-28">
              <option value="">All types</option>
              {REPORTER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={resetFilters} className="h-8 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <RotateCcw className="h-3 w-3" />Reset
            </button>
          </div>

          {/* Status tabs */}
          <div className="flex border-b border-border px-4">
            {STATUS_TABS.map(tab => {
              const active = activeTab === tab.value
              const count  = counts[tab.value] ?? 0
              return (
                <button key={tab.value} onClick={() => { setActiveTab(tab.value as ContributorStatus); setPage(1); setBulkSelected(new Set()) }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors
                    ${active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
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
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/8 border-b border-primary/20">
              <span className="text-xs font-medium text-primary">{bulkSelected.size} selected</span>
              <Button size="sm" className="h-7 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleBulkApprove}>
                <Check className="h-3 w-3" />Approve All
              </Button>
              <button className="text-xs text-primary underline" onClick={() => setBulkSelected(new Set())}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {activeTab === 'pending' && (
                    <th className="py-3 px-4 w-8">
                      <button onClick={toggleAllPage}>
                        {allPageSelected ? <CheckSquare className="h-4 w-4 text-foreground" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </th>
                  )}
                  {['Contributor', 'ID', 'Contact', 'Designation', 'District', 'Type', 'Docs', 'Applied', ''].map(h => (
                    <th key={h} className="py-3 px-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} className="py-14 text-center text-sm text-muted-foreground">No applications found</td></tr>
                ) : paginated.map(c => (
                  <tr key={c.id}
                    className={`transition-colors hover:bg-muted/20 cursor-pointer ${selected?.id === c.id ? 'bg-muted/30' : ''}`}
                    onClick={() => setSelected(selected?.id === c.id ? null : c)}>

                    {activeTab === 'pending' && (
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggleBulk(c.id)}>
                          {bulkSelected.has(c.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                    )}

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} photoUrl={c.photoUrl} size="sm" />
                        <span className="text-xs font-semibold text-foreground">{c.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-mono text-foreground">{c.contributorId}</span>
                    </td>

                    <td className="py-3 px-3">
                      <p className="text-[11px] text-foreground">{c.mobile}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{c.email}</p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs text-foreground">{c.designation}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-foreground">{c.district}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <TypeBadge type={c.reporterType} />
                    </td>

                    <td className="py-3 px-3">
                      <DocCount docs={c.documents} />
                    </td>

                    <td className="py-3 px-3">
                      <DaysPendingBadge days={daysSince(c.appliedOn)} />
                    </td>

                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(selected?.id === c.id ? null : c)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(c); toast.info('Assign a designation in the side panel, then approve') }}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setRejectTarget(c.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {filtered.length === 0 ? 'No results' : `${Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`h-7 w-7 rounded-md text-xs font-medium ${safePage === p ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
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
