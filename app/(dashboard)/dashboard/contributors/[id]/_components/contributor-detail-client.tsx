'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, ShieldCheck, Clock, AlertCircle,
  Smartphone, Monitor, FileText, Bell, Camera, Mic,
  HardDrive, Wifi, Signal, MapPin, User, UserX,
  DollarSign, CreditCard, Activity, Cpu, ChevronRight,
  Eye, Heart, Share2, MessageCircle, Users,
  Award, Calendar, BookOpen, Video,
  Radio, Target, CheckCircle2, XCircle,
  Fingerprint, Building2, Phone, Mail, GraduationCap,
  Briefcase, Globe, RefreshCw, Power, PowerOff, Check, X,
  Image as ImageIcon, TrendingUp, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getStoredContributors, saveStoredContributors } from '@/lib/mock/contributors-store'
import type { Contributor, ReporterType } from '@/lib/mock/contributors-store'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
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
  return AVATAR_GRADIENTS[parseInt(n || '0') % AVATAR_GRADIENTS.length]!
}
function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: Date | null | undefined) {
  if (!d) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function timeAgo(d: Date | null | undefined) {
  if (!d) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

/** A single label → value row, used throughout detail sections */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-3 border-b border-border/50 last:border-0">
      <span className="text-[13px] text-muted-foreground shrink-0 w-36 leading-relaxed">{label}</span>
      <span className="text-[13px] font-medium text-foreground text-right flex-1 leading-relaxed">{value ?? '—'}</span>
    </div>
  )
}

/** Thin progress bar */
function Bar({ pct, accent = 'bg-foreground' }: { pct: number; accent?: string }) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', accent)}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

/** Status chip — minimal, single colour system (dark-mode safe) */
function StatusChip({ label, tone }: { label: string; tone: 'success' | 'warn' | 'error' | 'neutral' }) {
  const colors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    warn:    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    error:   'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', colors[tone])}>
      {label}
    </span>
  )
}

function TypeBadge({ type }: { type: ReporterType }) {
  const tone: Record<ReporterType, Parameters<typeof StatusChip>[0]['tone']> = {
    'Full Time':  'success',
    'Part Time':  'warn',
    'Freelancer': 'neutral',
    'Intern':     'neutral',
  }
  return <StatusChip label={type} tone={tone[type]} />
}

function VerifyBadge({ status }: { status?: string }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
      <ShieldCheck className="h-3 w-3" /> Verified
    </span>
  )
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20">
      <Clock className="h-3 w-3" /> KYC Pending
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-0.5 text-[11px] font-medium">
      <AlertCircle className="h-3 w-3" /> Unverified
    </span>
  )
}

/** Section heading — restrained eyebrow */
function Section({ label }: { label: string }) {
  return <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mt-8 mb-3 first:mt-0">{label}</p>
}

/** Polished empty state — muted icon circle + title + subtext */
function EmptyState({ icon: Icon, title, subtext }: { icon: React.ComponentType<{ className?: string }>; title: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      {subtext && <p className="text-[13px] text-muted-foreground max-w-xs">{subtext}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Timeline builder
// ─────────────────────────────────────────────────────────────

function buildTimeline(c: Contributor) {
  type TLEvent = { date: Date; label: string; note?: string }
  const events: TLEvent[] = []
  if (c.registrationDate)   events.push({ date: c.registrationDate,   label: 'Registered on platform',           note: c.registrationSource ? `Source: ${c.registrationSource}` : undefined })
  if (c.appliedOn)          events.push({ date: c.appliedOn,          label: 'Submitted contributor application', note: `via ${c.source ?? 'App'}` })
  if (c.verificationDate)   events.push({ date: c.verificationDate,   label: 'Identity verified',                 note: c.verifiedBy ? `By ${c.verifiedBy}` : undefined })
  if (c.approvedOn)         events.push({ date: c.approvedOn,         label: 'Profile approved',                  note: c.approvedBy ? `By ${c.approvedBy}` : undefined })
  if (c.lastStoryPublished) events.push({ date: c.lastStoryPublished, label: 'Last story published',              note: c.mostActiveCategory ? `Category: ${c.mostActiveCategory}` : undefined })
  if (c.lastPaymentDate)    events.push({ date: c.lastPaymentDate,    label: 'Last payout processed',             note: c.lastPaymentAmount ? `₹${c.lastPaymentAmount.toLocaleString('en-IN')}` : undefined })
  if (c.rejectedOn)         events.push({ date: c.rejectedOn,         label: 'Application rejected',              note: c.remarks ?? undefined })
  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

// ─────────────────────────────────────────────────────────────
// Tab types
// ─────────────────────────────────────────────────────────────

type DetailTab = 'profile' | 'performance' | 'earnings' | 'documents' | 'device' | 'activity'

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function ContributorDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [tab, setTab] = useState<DetailTab>('profile')
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const all = getStoredContributors()
    const found = all.find(c => c.id === id || c.contributorId === id)
    if (found) setContributor(found)
    else setNotFound(true)
  }, [id])

  async function handleStatusChange(newStatus: 'approved' | 'inactive') {
    if (!contributor) return
    setBusy(true)
    await new Promise(r => setTimeout(r, 350))
    const all = getStoredContributors()
    saveStoredContributors(all.map(c => c.id === contributor.id ? { ...c, status: newStatus } : c))
    setContributor(prev => prev ? { ...prev, status: newStatus } : prev)
    toast.success(newStatus === 'approved' ? 'Contributor activated' : 'Contributor deactivated')
    setBusy(false)
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <UserX className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-foreground">Contributor not found</p>
          <p className="text-[13px] text-muted-foreground">This contributor may have been removed or the link is incorrect.</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => router.push('/dashboard/contributors')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to contributors
        </Button>
      </div>
    )
  }
  if (!contributor) return null

  const c = contributor
  const isActive = c.status === 'approved'
  const pubRate = c.totalContentSubmitted
    ? Math.round(((c.contentPublished ?? 0) / c.totalContentSubmitted) * 100) : 0

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'profile',     label: 'Profile'     },
    { id: 'performance', label: 'Performance' },
    { id: 'earnings',    label: 'Earnings'    },
    { id: 'documents',   label: 'Documents'   },
    { id: 'device',      label: 'Device'      },
    { id: 'activity',    label: 'Activity'    },
  ]

  const timeline = buildTimeline(c)

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push('/dashboard/contributors')}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Contributors
        </button>
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        <span className="text-foreground font-medium">{c.name}</span>
      </div>

      {/* ══════════════════════════════
          PROFILE HEADER
      ══════════════════════════════ */}
      <div className="rounded-2xl border bg-card ring-1 ring-border/50 px-7 py-6">
        <div className="flex items-start gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            {c.photoUrl ? (
              <img src={c.photoUrl} alt={c.name}
                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-border" />
            ) : (
              <div className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center text-white text-base font-bold bg-gradient-to-br ring-1 ring-border',
                avatarGradient(c.id)
              )}>
                {initials(c.name)}
              </div>
            )}
            {c.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{c.name}</h1>
                  <VerifyBadge status={c.verificationStatus} />
                </div>
                <p className="text-[13px] text-muted-foreground mt-0.5 font-mono">{c.contributorId}</p>
                <div className="flex items-center gap-2 flex-wrap mt-2.5">
                  <TypeBadge type={c.reporterType} />
                  {c.contributorSource === 'APP'
                    ? <StatusChip label="App" tone="neutral" />
                    : <StatusChip label="CMS" tone="neutral" />}
                  {isActive
                    ? <StatusChip label="Active" tone="success" />
                    : <StatusChip label="Inactive" tone="neutral" />}
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0">
                {isActive ? (
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:border-red-500/30 dark:hover:bg-red-500/10 h-9 rounded-lg text-[13px] gap-1.5 cursor-pointer"
                    onClick={() => handleStatusChange('inactive')} disabled={busy}>
                    {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
                    {busy ? 'Deactivating…' : 'Deactivate'}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline"
                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10 h-9 rounded-lg text-[13px] gap-1.5 cursor-pointer"
                    onClick={() => handleStatusChange('approved')} disabled={busy}>
                    {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                    {busy ? 'Activating…' : 'Activate'}
                  </Button>
                )}
              </div>
            </div>

            {/* Contact + location strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border/60 text-[13px] text-muted-foreground">
              <a href={`tel:${c.mobile}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                <Phone className="h-3.5 w-3.5" /> {c.mobile}
              </a>
              <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                <Mail className="h-3.5 w-3.5" /> {c.email}
              </a>
              {c.district && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {c.district}, {c.state ?? 'Telangana'}
                </span>
              )}
              {c.isOnline && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online now
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          KEY METRICS — 4 numbers only
      ══════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Stories published',  value: (c.contentPublished ?? 0).toLocaleString('en-IN') },
          { label: 'Publish rate',        value: `${pubRate}%`,                                      note: `${c.totalContentSubmitted ?? 0} submitted` },
          { label: 'Lifetime earnings',   value: `₹${(c.totalEarnings ?? 0).toLocaleString('en-IN')}` },
          { label: 'Accuracy rate',       value: c.accuracyRate ? `${c.accuracyRate}%` : '—' },
        ].map(({ label, value, note }) => (
          <div key={label} className="rounded-2xl border bg-card ring-1 ring-border/50 px-4 py-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-semibold text-foreground tracking-tight tabular-nums">{value}</p>
            {note && <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{note}</p>}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════
          TABS + CONTENT
      ══════════════════════════════ */}
      <div className="rounded-2xl border bg-card ring-1 ring-border/50 overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-border bg-muted/40 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                tab === t.id
                  ? 'border-primary text-foreground bg-card'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-7 py-6 max-w-2xl">

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div>
              <Section label="Personal" />
              <div>
                <Row label="Full name"       value={c.name} />
                <Row label="Date of birth"   value={c.dob} />
                <Row label="Gender"          value={c.gender} />
                <Row label="Mobile"          value={<a href={`tel:${c.mobile}`} className="text-primary hover:underline font-mono cursor-pointer">{c.mobile}</a>} />
                {c.alternateMobile && <Row label="Alt. mobile" value={<a href={`tel:${c.alternateMobile}`} className="text-primary hover:underline font-mono cursor-pointer">{c.alternateMobile}</a>} />}
                <Row label="Email"           value={<a href={`mailto:${c.email}`} className="text-primary hover:underline cursor-pointer">{c.email}</a>} />
                {c.occupation  && <Row label="Occupation"   value={c.occupation} />}
                {c.education   && <Row label="Education"    value={c.education} />}
                <Row label="Languages"       value={(c.languagesKnown ?? [c.language]).filter(Boolean).join(', ')} />
              </div>

              {c.bio && (
                <>
                  <Section label="Bio" />
                  <p className="text-[14px] text-foreground/80 leading-relaxed">{c.bio}</p>
                </>
              )}

              <Section label="Address" />
              <div>
                {c.houseNumber && <Row label="House / flat" value={c.houseNumber} />}
                {c.street      && <Row label="Street"       value={c.street} />}
                {c.area        && <Row label="Area"         value={c.area} />}
                {c.village     && <Row label="Village"      value={c.village} />}
                {c.mandal      && <Row label="Mandal"       value={c.mandal} />}
                <Row label="District"        value={c.district} />
                <Row label="State"           value={c.state} />
                {c.pincode     && <Row label="Pincode"      value={c.pincode} />}
              </div>

              <Section label="Coverage" />
              <div>
                <Row label="Contributor type"   value={c.contributorType === 'team_recruited' ? 'Team Recruited' : 'User Applied'} />
                <Row label="Source"             value={c.registrationSource ? c.registrationSource.charAt(0).toUpperCase() + c.registrationSource.slice(1) : '—'} />
                {c.recruitedBy  && <Row label="Recruited by"  value={c.recruitedBy} />}
                {c.referralBy   && <Row label="Referred by"   value={c.referralBy} />}
                {c.referralCode && <Row label="Referral code" value={<span className="font-mono text-xs">{c.referralCode}</span>} />}
                <Row label="Applied on"         value={fmtDate(c.appliedOn)} />
                {c.approvedOn  && <Row label="Approved on"    value={fmtDate(c.approvedOn)} />}
                {c.approvedBy  && <Row label="Approved by"    value={c.approvedBy} />}
                <Row label="Assigned mandal"    value={c.assignedMandal} />
                {c.assignedVillage && <Row label="Assigned village" value={c.assignedVillage} />}
                <Row label="Priority"           value={
                  c.coveragePriorityLevel === 'high'   ? <StatusChip label="High"   tone="error"    /> :
                  c.coveragePriorityLevel === 'medium' ? <StatusChip label="Medium" tone="warn"     /> :
                  c.coveragePriorityLevel === 'low'    ? <StatusChip label="Low"    tone="neutral"  /> : '—'
                } />
              </div>

              {(c.coverageAreas?.length || c.newsGenres?.length) && (
                <>
                  <Section label="Coverage areas & genres" />
                  <div className="flex flex-wrap gap-1.5">
                    {[...(c.coverageAreas ?? []), ...(c.newsGenres ?? [])].map(item => (
                      <span key={item} className="rounded-full border border-border bg-muted/40 text-muted-foreground px-2.5 py-0.5 text-[12px]">{item}</span>
                    ))}
                  </div>
                </>
              )}

              {c.adminNotes && (
                <>
                  <Section label="Admin notes" />
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-[14px] text-amber-900 leading-relaxed dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    {c.adminNotes}
                  </div>
                </>
              )}

              {c.tags && c.tags.length > 0 && (
                <>
                  <Section label="Tags" />
                  <div className="flex flex-wrap gap-1.5">
                    {c.tags.map(tag => (
                      <span key={tag} className="rounded-full border border-border bg-muted/40 text-muted-foreground px-2.5 py-0.5 text-[11px]">{tag}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PERFORMANCE ── */}
          {tab === 'performance' && (
            <div>
              <Section label="Content" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Submitted', value: c.totalContentSubmitted ?? 0 },
                  { label: 'Published', value: c.contentPublished ?? 0 },
                  { label: 'Pending',   value: c.pendingStories ?? 0 },
                  { label: 'Rejected',  value: c.rejectedStories ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              {/* Publication rate bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[13px] text-muted-foreground">Publication rate</span>
                  <span className="text-[13px] font-semibold text-foreground tabular-nums">{pubRate}%</span>
                </div>
                <Bar pct={pubRate} accent="bg-primary" />
              </div>

              {/* Accuracy */}
              {c.accuracyRate != null && (
                <div className="mb-6">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] text-muted-foreground">Accuracy rate</span>
                    <span className="text-[13px] font-semibold text-foreground tabular-nums">{c.accuracyRate}%</span>
                  </div>
                  <Bar pct={c.accuracyRate}
                    accent={c.accuracyRate >= 90 ? 'bg-emerald-500' : c.accuracyRate >= 70 ? 'bg-amber-400' : 'bg-red-400'} />
                </div>
              )}

              <Section label="Content by type" />
              <div>
                {[
                  { label: 'Image stories', value: c.imageStories ?? 0 },
                  { label: 'Video stories', value: c.videoStories ?? 0 },
                  { label: 'Live sessions',  value: c.liveSessions ?? 0 },
                ].map(({ label, value }) => {
                  const total = c.totalContentSubmitted ?? 1
                  return (
                    <div key={label} className="py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[13px] text-muted-foreground">{label}</span>
                        <span className="text-[13px] font-medium text-foreground tabular-nums">{value}</span>
                      </div>
                      <Bar pct={(value / total) * 100} accent="bg-primary/50" />
                    </div>
                  )
                })}
              </div>

              <Section label="Engagement" />
              <div>
                {[
                  { label: 'Total views',  value: (c.contentViews ?? 0).toLocaleString('en-IN') },
                  { label: 'Avg. reach',   value: `${(c.avgStoryReach ?? 0).toLocaleString('en-IN')} / story` },
                  { label: 'Likes',        value: (c.totalLikes ?? 0).toLocaleString('en-IN') },
                  { label: 'Shares',       value: (c.totalShares ?? 0).toLocaleString('en-IN') },
                  { label: 'Comments',     value: (c.totalComments ?? 0).toLocaleString('en-IN') },
                  { label: 'Followers',    value: (c.followers ?? 0).toLocaleString('en-IN') },
                ].map(({ label, value }) => <Row key={label} label={label} value={value} />)}
              </div>

              <Section label="Timing" />
              <div>
                <Row label="Avg. approval time"   value={c.avgApprovalTime} />
                <Row label="Last story published"  value={fmtDate(c.lastStoryPublished)} />
                <Row label="Most active category"  value={c.mostActiveCategory} />
                <Row label="Experience"            value={c.experience} />
              </div>
            </div>
          )}

          {/* ── EARNINGS ── */}
          {tab === 'earnings' && (
            <div>
              <Section label="Summary" />
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'This month', value: `₹${(c.currentMonthEarnings ?? 0).toLocaleString('en-IN')}` },
                  { label: 'Pending',    value: `₹${(c.pendingEarnings ?? 0).toLocaleString('en-IN')}` },
                  { label: 'Lifetime',   value: `₹${(c.totalEarnings ?? 0).toLocaleString('en-IN')}` },
                  { label: 'Last payout',value: c.lastPaymentAmount ? `₹${c.lastPaymentAmount.toLocaleString('en-IN')}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-muted/20 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              <Section label="Banking" />
              <div>
                <Row label="Account holder" value={c.accountHolderName} />
                <Row label="Bank"           value={c.bankName} />
                <Row label="Account no."    value={c.accountNumberMasked ? <span className="font-mono tracking-widest">{c.accountNumberMasked}</span> : '—'} />
                <Row label="IFSC"           value={c.ifscCode ? <span className="font-mono">{c.ifscCode}</span> : '—'} />
                <Row label="Branch"         value={c.branch} />
                {c.upiId && <Row label="UPI ID" value={c.upiId} />}
                <Row label="Pref. method"   value={c.preferredPaymentMethod === 'upi' ? 'UPI' : c.preferredPaymentMethod === 'bank_transfer' ? 'Bank Transfer' : '—'} />
                <Row label="Payout status"  value={
                  c.payoutStatus === 'Paid'       ? <StatusChip label="Paid"       tone="success" /> :
                  c.payoutStatus === 'Processing' ? <StatusChip label="Processing" tone="warn"    /> :
                  <StatusChip label="Pending" tone="neutral" />
                } />
              </div>

              <Section label="Payout history" />
              <div className="rounded-2xl border bg-card ring-1 ring-border/50 overflow-hidden">
                <div className="overflow-x-auto rounded-t-2xl">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-5 h-12 text-left text-[13px] font-medium text-muted-foreground whitespace-nowrap">Date</th>
                        <th className="px-5 h-12 text-right text-[13px] font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                        <th className="px-5 h-12 text-left text-[13px] font-medium text-muted-foreground whitespace-nowrap">Method</th>
                        <th className="px-5 h-12 text-left text-[13px] font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.lastPaymentDate && c.lastPaymentAmount ? (
                        <tr className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 text-[14px] text-muted-foreground align-middle tabular-nums">{fmtDate(c.lastPaymentDate)}</td>
                          <td className="px-5 py-3.5 text-[14px] font-semibold text-foreground text-right align-middle tabular-nums">₹{c.lastPaymentAmount.toLocaleString('en-IN')}</td>
                          <td className="px-5 py-3.5 text-[14px] text-muted-foreground align-middle">{c.preferredPaymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}</td>
                          <td className="px-5 py-3.5 align-middle"><StatusChip label="Paid" tone="success" /></td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-5">
                            <EmptyState icon={CreditCard} title="No payout history" subtext="Payouts will appear here once the first payment is processed." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {c.lastPaymentDate && c.lastPaymentAmount && (
                  <div className="border-t border-border bg-muted/20 px-5 py-2.5 text-[12px] text-muted-foreground">
                    Showing 1 of 1 payout
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DOCUMENTS ── */}
          {tab === 'documents' && (
            <div>
              {/* KYC status */}
              <div className={cn('rounded-xl border px-4 py-4 mb-6 flex items-center justify-between gap-4', {
                'border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-500/10': c.verificationStatus === 'verified',
                'border-amber-200 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/10':          c.verificationStatus === 'pending',
                'border-border bg-muted/20':                                                              !c.verificationStatus || c.verificationStatus === 'unverified',
              })}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn('h-5 w-5 shrink-0', {
                    'text-emerald-600 dark:text-emerald-400': c.verificationStatus === 'verified',
                    'text-amber-500 dark:text-amber-400':     c.verificationStatus === 'pending',
                    'text-muted-foreground': !c.verificationStatus || c.verificationStatus === 'unverified',
                  })} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.verificationStatus === 'verified'   ? 'KYC Verified'
                       : c.verificationStatus === 'pending'  ? 'KYC Verification Pending'
                       : 'KYC Not Verified'}
                    </p>
                    {(c.verifiedBy || c.verificationDate) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {c.verifiedBy && `By ${c.verifiedBy}`}{c.verifiedBy && c.verificationDate && ' · '}{c.verificationDate && fmtDate(c.verificationDate)}
                      </p>
                    )}
                  </div>
                </div>
                <VerifyBadge status={c.verificationStatus} />
              </div>

              {(c.aadhaarMasked || c.panMasked) && (
                <>
                  <Section label="Identity numbers" />
                  <div>
                    {c.aadhaarMasked && <Row label="Aadhaar" value={<span className="font-mono tracking-wider">{c.aadhaarMasked}</span>} />}
                    {c.panMasked     && <Row label="PAN"     value={<span className="font-mono tracking-wider">{c.panMasked}</span>} />}
                  </div>
                </>
              )}

              <Section label="Documents" />
              {!c.documents?.length ? (
                <EmptyState icon={FileText} title="No documents uploaded" subtext="KYC and verification documents will appear here once submitted." />
              ) : (
                <div className="space-y-1.5">
                  {c.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="text-[14px] text-foreground">{doc.label}</span>
                      </div>
                      {doc.submitted
                        ? <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Submitted</span>
                        : <span className="text-[12px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><X className="h-3.5 w-3.5" /> Missing</span>
                      }
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground pt-2 tabular-nums">
                    {c.documents.filter(d => d.submitted).length} of {c.documents.length} documents submitted
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── DEVICE ── */}
          {tab === 'device' && (
            <div>
              <Section label="Device" />
              <div>
                <Row label="Platform"     value={c.devicePlatform === 'ios' ? 'iOS' : c.devicePlatform === 'android' ? 'Android' : '—'} />
                <Row label="Manufacturer" value={c.deviceManufacturer} />
                <Row label="Model"        value={c.deviceModel} />
                <Row label="OS version"   value={c.deviceOsVersion} />
                <Row label="App version"  value={c.deviceAppVersion} />
                <Row label="Network"      value={[
                  c.networkType === 'wifi' ? 'Wi-Fi' : c.networkType === 'mobile' ? 'Mobile data' : null,
                  c.connectionType ? c.connectionType.toUpperCase() : null,
                  c.isp,
                ].filter(Boolean).join(' · ')} />
              </div>

              <Section label="Permissions" />
              <div>
                {[
                  { label: 'Camera',             ok: c.cameraPermission },
                  { label: 'Microphone',         ok: c.micPermission },
                  { label: 'Location',           ok: c.locationPermission },
                  { label: 'Storage',            ok: c.storagePermission },
                  { label: 'Push notifications', ok: c.pushNotificationEnabled },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                    <span className="text-[13px] text-muted-foreground">{label}</span>
                    {ok === true  && <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Granted</span>}
                    {ok === false && <span className="text-[12px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1"><X className="h-3.5 w-3.5" /> Denied</span>}
                    {ok === undefined && <span className="text-[13px] text-muted-foreground">—</span>}
                  </div>
                ))}
              </div>

              <Section label="App activity" />
              <div>
                <Row label="Installed"    value={fmtDate(c.appInstallDate)} />
                <Row label="Login count"  value={c.loginCount?.toLocaleString('en-IN')} />
                <Row label="Last login"   value={<span title={fmtDateTime(c.lastLogin)}>{timeAgo(c.lastLogin)}</span>} />
                <Row label="Last active"  value={<span title={fmtDateTime(c.lastActive)}>{timeAgo(c.lastActive)}</span>} />
                <Row label="Crash count"  value={c.crashCount !== undefined ? (
                  <span className={cn('tabular-nums', c.crashCount > 3 ? 'text-red-600 dark:text-red-400 font-semibold' : '')}>{c.crashCount}</span>
                ) : '—'} />
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === 'activity' && (
            <div>
              <Section label="Timeline" />
              {timeline.length === 0 ? (
                <EmptyState icon={Activity} title="No activity recorded" subtext="Registration, verification and publishing events will appear here." />
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                  <ul className="space-y-4">
                    {timeline.map((ev, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full bg-foreground/20 border-2 border-background ring-1 ring-border" />
                        <p className="text-sm font-medium text-foreground leading-snug">{ev.label}</p>
                        {ev.note && <p className="text-xs text-muted-foreground mt-0.5">{ev.note}</p>}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{fmtDateTime(ev.date)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
