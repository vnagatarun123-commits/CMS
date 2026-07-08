'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, IndianRupee, Check, X, Clock,
  AlertTriangle, Download, Pencil, Eye, AlertCircle, Shield,
  ImageIcon, Video, Film, Radio, TrendingUp, Zap, BarChart2,
  Repeat, ArrowUpCircle, ArrowDownCircle, History, Wallet,
  UserCheck, Info, RefreshCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SEED_REPORTERS, SEED_SETTLEMENTS, SEED_REDEMPTIONS, getStoredCommissionRules,
} from '@/lib/mock/seed-reporters'
import type { Reporter } from '@/types/reporter'
import type { Settlement, SettlementStatus, RedemptionRequest, MonthlyEarningBreakdown } from '@/types/earnings'
import { downloadCsv } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function inr(n: number) {
  return `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function fmtDate(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function timeAgo(d: Date) {
  const hrs = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (hrs < 1)  return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return fmtDate(d)
}

const MONTHS = [
  { period: '2026-04', label: 'April 2026' },
  { period: '2026-05', label: 'May 2026' },
  { period: '2026-06', label: 'June 2026' },
]

// ── Status badge ──────────────────────────────────────────────────────────────

function SettlementStatusBadge({ status }: { status: SettlementStatus }) {
  const cfg: Record<SettlementStatus, { cls: string; label: string }> = {
    pending:        { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',       label: 'Pending' },
    processing:     { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',            label: 'Processing' },
    settled:        { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20', label: 'Settled' },
    on_hold:        { cls: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',                  label: 'On Hold' },
    partially_paid: { cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20', label: 'Partial' },
  }
  const { cls, label } = cfg[status]
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
}

function RedemptionStatusBadge({ status }: { status: RedemptionRequest['status'] }) {
  const cfg = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    rejected: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

// ── Breakdown summary ─────────────────────────────────────────────────────────

function BreakdownCard({ b }: { b: MonthlyEarningBreakdown }) {
  const rows: { icon: React.ElementType; label: string; posts: number; earnings: number; color: string }[] = [
    { icon: ImageIcon, label: 'Image Posts',    posts: b.imagePosts,    earnings: b.imageEarningsInr,  color: 'text-blue-500'   },
    { icon: Video,     label: 'Video Posts',    posts: b.videoPosts,    earnings: b.videoEarningsInr,  color: 'text-violet-500' },
    { icon: Film,      label: 'Short/Reels',    posts: b.shortPosts,    earnings: b.shortEarningsInr,  color: 'text-pink-500'   },
    { icon: Radio,     label: 'Live Sessions',  posts: b.liveSessions,  earnings: b.liveEarningsInr,   color: 'text-red-500'    },
  ]
  const bonuses: { icon: React.ElementType; label: string; amount: number; color: string }[] = []
  if (b.reachBonusInr > 0)   bonuses.push({ icon: TrendingUp, label: `Reach bonus (${b.reachBonusCount} posts)`, amount: b.reachBonusInr,   color: 'text-emerald-500' })
  if (b.viralBonusInr > 0)   bonuses.push({ icon: Zap,        label: `Viral bonus (${b.viralBonusCount} posts)`, amount: b.viralBonusInr,   color: 'text-amber-500'  })
  if (b.volumeBonusInr > 0)  bonuses.push({ icon: BarChart2,  label: 'Volume bonus',   amount: b.volumeBonusInr,  color: 'text-blue-500'   })
  if (b.streakBonusInr > 0)  bonuses.push({ icon: Repeat,     label: 'Streak bonus',   amount: b.streakBonusInr,  color: 'text-violet-500' })

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Content Breakdown</p>
        </div>
        <div className="divide-y divide-border">
          {rows.map(r => {
            if (r.posts === 0) return null
            const Icon = r.icon
            return (
              <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                <Icon className={`h-3.5 w-3.5 ${r.color} shrink-0`} />
                <span className="text-[13px] text-foreground flex-1">{r.label}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{r.posts} posts</span>
                <span className="text-[13px] font-semibold text-foreground w-20 text-right tabular-nums">{inr(r.earnings)}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-t border-border">
          <span className="text-[13px] text-muted-foreground flex-1">Subtotal</span>
          <span className="text-[13px] font-bold text-foreground tabular-nums">{inr(b.imageEarningsInr + b.videoEarningsInr + b.shortEarningsInr + b.liveEarningsInr)}</span>
        </div>
      </div>

      {bonuses.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Bonuses</p>
          </div>
          <div className="divide-y divide-border">
            {bonuses.map(bon => {
              const Icon = bon.icon
              return (
                <div key={bon.label} className="flex items-center gap-3 px-4 py-3">
                  <Icon className={`h-3.5 w-3.5 ${bon.color} shrink-0`} />
                  <span className="text-[13px] text-foreground flex-1">{bon.label}</span>
                  <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{inr(bon.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted-foreground">Total Impressions</span>
        <span className="text-[13px] font-bold text-foreground tabular-nums">{b.totalImpressions.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

// ── Mark as paid modal ────────────────────────────────────────────────────────

function MarkPaidModal({ settlement, onSave, onClose }: {
  settlement: Settlement
  onSave: (id: string, ref: string, method: 'upi' | 'bank_transfer', date: string) => void
  onClose: () => void
}) {
  const [ref, setRef]       = useState('')
  const [method, setMethod] = useState<'upi' | 'bank_transfer'>('upi')
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0]!)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border ring-1 ring-border/50 shadow-2xl w-[380px] p-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground mb-1">Mark as Paid</h3>
        <p className="text-[13px] text-muted-foreground mb-4">
          Recording payment of <span className="font-bold text-foreground tabular-nums">{inr(settlement.netPayableInr)}</span> to <span className="font-medium text-foreground">{settlement.reporterName}</span> for {settlement.periodLabel}.
        </p>
        <div className="space-y-3.5">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Payment Method</p>
            <div className="flex gap-2">
              {(['upi', 'bank_transfer'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex-1 py-2 rounded-lg border text-[13px] font-medium transition-colors
                    ${method === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/40'}`}>
                  {m === 'upi' ? 'UPI' : 'Bank Transfer / NEFT'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
              {method === 'upi' ? 'UPI Transaction ID' : 'UTR / NEFT Reference'}
            </label>
            <input value={ref} onChange={e => setRef(e.target.value)}
              placeholder={method === 'upi' ? 'e.g. UPI2606XXXXXXX' : 'e.g. NEFT2606XXXXXXX'}
              className="w-full h-9 rounded-lg border border-border bg-muted/20 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Payment Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-muted/20 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            disabled={!ref.trim()}
            onClick={() => { onSave(settlement.id, ref.trim(), method, date); onClose() }}>
            <Check className="h-3.5 w-3.5" />Confirm Paid
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Manual adjustment modal ───────────────────────────────────────────────────

function AdjustModal({ settlement, onSave, onClose }: {
  settlement: Settlement
  onSave: (id: string, amount: number, note: string) => void
  onClose: () => void
}) {
  const [type, setType]   = useState<'bonus' | 'deduction'>('bonus')
  const [amount, setAmt]  = useState('')
  const [note, setNote]   = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-2xl w-[380px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Manual Adjustment</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Add a bonus or deduction for <span className="font-medium text-foreground">{settlement.reporterName}</span> · {settlement.periodLabel}
        </p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setType('bonus')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors
                ${type === 'bonus' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-border text-muted-foreground'}`}>
              <ArrowUpCircle className="h-3.5 w-3.5" />Bonus / Credit
            </button>
            <button onClick={() => setType('deduction')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors
                ${type === 'deduction' ? 'border-red-300 bg-red-50 text-red-600' : 'border-border text-muted-foreground'}`}>
              <ArrowDownCircle className="h-3.5 w-3.5" />Deduction
            </button>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Amount (₹)</p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">₹</span>
              <input type="number" value={amount} onChange={e => setAmt(e.target.value)} placeholder="0"
                className="flex-1 h-9 rounded-lg border border-border bg-muted/20 px-3 text-sm font-semibold focus:outline-none" />
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Reason (required)</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Bonus for exclusive interview; Deduction for policy violation"
              className="w-full h-20 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs resize-none focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm"
            className={`flex-1 gap-1.5 ${type === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            disabled={!amount || !note.trim()}
            onClick={() => {
              const amt = parseFloat(amount) * (type === 'deduction' ? -1 : 1)
              onSave(settlement.id, amt, note.trim())
              onClose()
            }}>
            <Check className="h-3.5 w-3.5" />Apply {type === 'bonus' ? 'Bonus' : 'Deduction'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── On-hold modal ─────────────────────────────────────────────────────────────

function HoldModal({ settlement, onSave, onClose }: {
  settlement: Settlement; onSave: (id: string, reason: string) => void; onClose: () => void
}) {
  const [reason, setReason] = useState(settlement.onHoldReason ?? '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-2xl w-[380px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Put On Hold</h3>
        <p className="text-xs text-muted-foreground mb-3">Settlement for <span className="font-medium text-foreground">{settlement.reporterName}</span> — {settlement.periodLabel}</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Reason for hold (shown in audit log)…"
          className="w-full h-24 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs resize-none focus:outline-none mb-3" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={!reason.trim()}
            onClick={() => { onSave(settlement.id, reason.trim()); onClose() }}>
            Confirm Hold
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Reject redemption modal ───────────────────────────────────────────────────

function RejectRedemptionModal({ req, onSave, onClose }: {
  req: RedemptionRequest; onSave: (id: string, note: string) => void; onClose: () => void
}) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-2xl w-[360px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Reject Redemption Request</h3>
        <p className="text-xs text-muted-foreground mb-3">{req.reporterName} requested {inr(req.amountRequestedInr)} for {req.period}.</p>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Reason (shown to reporter)…"
          className="w-full h-20 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs resize-none focus:outline-none mb-3" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={!note.trim()}
            onClick={() => { onSave(req.id, note.trim()); onClose() }}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Detail side panel ─────────────────────────────────────────────────────────

type DetailTab = 'summary' | 'breakdown' | 'history' | 'redemptions'

function DetailPanel({ reporter, settlements, onClose, onEdit }: {
  reporter: Reporter
  settlements: Settlement[]
  onClose: () => void
  onEdit: (s: Settlement, action: 'paid' | 'adjust' | 'hold' | 'process') => void
}) {
  const [tab, setTab] = useState<DetailTab>('summary')
  const rules         = getStoredCommissionRules()
  const rule          = rules.find(r => r.id === reporter.commissionRuleId) ?? rules[0]!
  const latest        = settlements[settlements.length - 1]

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'summary',     label: 'Summary' },
    { id: 'breakdown',   label: 'Breakdown' },
    { id: 'history',     label: 'History' },
    { id: 'redemptions', label: 'Redemptions' },
  ]

  return (
    <div className="fixed inset-0 z-40 flex" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ml-auto h-full w-[440px] bg-background border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                <span className="text-sm font-bold text-muted-foreground">{reporter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{reporter.name}</p>
                <p className="text-[11px] text-muted-foreground">{reporter.designation} · {reporter.district}</p>
              </div>
            </div>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2">
            <Ministat label="Lifetime" value={inr(reporter.lifetimeEarnedInr)} />
            <Ministat label="Settled" value={inr(reporter.lifetimeSettledInr)} />
            <Ministat label="Pending" value={inr(reporter.pendingEarningsInr)} highlight />
          </div>
          {reporter.flaggedForReview && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600">{reporter.adminNotes}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-[11px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
                ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'summary' && (
            <>
              {latest && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-muted/20 px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{latest.periodLabel} Settlement</p>
                    <SettlementStatusBadge status={latest.status} />
                  </div>
                  <div className="divide-y divide-border">
                    <SRow label="Gross Earnings" value={inr(latest.breakdown.grossEarningsInr)} />
                    {latest.manualAdjustmentInr !== 0 && (
                      <SRow label={`Manual ${latest.manualAdjustmentInr > 0 ? 'Bonus' : 'Deduction'}`}
                        value={`${latest.manualAdjustmentInr > 0 ? '+' : '-'}${inr(latest.manualAdjustmentInr)}`}
                        valueClass={latest.manualAdjustmentInr > 0 ? 'text-emerald-600' : 'text-red-600'} />
                    )}
                    {latest.tdsDeductedInr > 0 && (
                      <SRow label="TDS Deducted (10%)" value={`-${inr(latest.tdsDeductedInr)}`} valueClass="text-amber-600" />
                    )}
                    <SRow label="Net Payable" value={inr(latest.netPayableInr)} bold />
                    {latest.paymentReference && (
                      <SRow label="Payment Ref" value={<span className="font-mono text-[10px]">{latest.paymentReference}</span>} />
                    )}
                    {latest.paidAt && <SRow label="Paid On" value={fmtDate(latest.paidAt)} />}
                    {latest.onHoldReason && (
                      <div className="px-4 py-3">
                        <p className="text-[11px] text-red-600 flex items-start gap-1.5">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{latest.onHoldReason}
                        </p>
                      </div>
                    )}
                  </div>
                  {latest.status !== 'settled' && (
                    <div className="p-3 border-t border-border flex gap-2 flex-wrap">
                      {(latest.status === 'pending' || latest.status === 'processing') && (
                        <Button size="sm" className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          onClick={() => onEdit(latest, 'paid')}>
                          <Check className="h-3 w-3" />Mark Paid
                        </Button>
                      )}
                      {latest.status === 'pending' && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                          onClick={() => onEdit(latest, 'process')}>
                          <RefreshCcw className="h-3 w-3" />Mark Processing
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                        onClick={() => onEdit(latest, 'adjust')}>
                        <Pencil className="h-3 w-3" />Adjust
                      </Button>
                      {latest.status !== 'on_hold' && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          onClick={() => onEdit(latest, 'hold')}>
                          <AlertCircle className="h-3 w-3" />Hold
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Rule info */}
              <div className="rounded-xl border border-border px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Commission Rule</p>
                <p className="text-xs font-semibold text-foreground">{rule.name}</p>
                <p className="text-[11px] text-muted-foreground">{rule.earningMode === 'post_based' ? '₹ per post' : 'Impression-based (CPM)'}</p>
                <p className="text-[10px] text-muted-foreground">
                  Image {inr(rule.imagePostRateInr)}/post · Video {inr(rule.videoPostRateInr)}/post · Short {inr(rule.shortPostRateInr)}/post · Live {inr(rule.liveSessionRateInr)}/session
                </p>
                {reporter.annualEarnedInr > 0 && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-muted-foreground">Annual earnings (TDS threshold: {inr(rule.tdsThresholdInr)})</p>
                      <p className="text-[11px] font-semibold text-foreground">{inr(reporter.annualEarnedInr)}</p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, (reporter.annualEarnedInr / rule.tdsThresholdInr) * 100)}%` }} />
                    </div>
                    {reporter.tdsDeductedInr > 0 && (
                      <p className="text-[10px] text-amber-600 mt-1">TDS deducted this year: {inr(reporter.tdsDeductedInr)}</p>
                    )}
                  </div>
                )}
              </div>
              {/* Content stats */}
              <div className="rounded-xl border border-border px-4 py-3">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Content Stats (All time)</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: ImageIcon, label: 'Images',  value: reporter.stats.totalImagePosts,    color: 'text-blue-500'   },
                    { icon: Video,     label: 'Videos',  value: reporter.stats.totalVideoPosts,    color: 'text-violet-500' },
                    { icon: Film,      label: 'Shorts',  value: reporter.stats.totalShortPosts,    color: 'text-pink-500'   },
                    { icon: Radio,     label: 'Lives',   value: reporter.stats.totalLiveSessions,  color: 'text-red-500'    },
                  ].map(s => {
                    const Icon = s.icon
                    return (
                      <div key={s.label} className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2.5">
                        <Icon className={`h-3.5 w-3.5 ${s.color} shrink-0`} />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          <p className="text-sm font-bold text-foreground">{s.value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'breakdown' && latest && <BreakdownCard b={latest.breakdown} />}
          {tab === 'breakdown' && !latest && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">No settlement data for this period</p>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              {settlements.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-8">No settlement history</p>
                : settlements.slice().reverse().map(s => (
                  <div key={s.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">{s.periodLabel}</span>
                      <SettlementStatusBadge status={s.status} />
                    </div>
                    <div className="space-y-1">
                      <SRow label="Net Payable" value={inr(s.netPayableInr)} />
                      {s.tdsDeductedInr > 0 && <SRow label="TDS" value={`-${inr(s.tdsDeductedInr)}`} valueClass="text-amber-600" />}
                      {s.paymentReference && <SRow label="Ref" value={<span className="font-mono text-[10px]">{s.paymentReference}</span>} />}
                      {s.paidAt && <SRow label="Paid" value={fmtDate(s.paidAt)} />}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === 'redemptions' && (
            <div className="space-y-3">
              {settlements
                .filter(s => s.redemptionRequestId)
                .map(s => (
                  <div key={s.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{s.periodLabel}</span>
                      <SettlementStatusBadge status={s.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{inr(s.netPayableInr)} · Redemption triggered</p>
                  </div>
                ))}
              {settlements.filter(s => s.redemptionRequestId).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No redemption-linked settlements</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Ministat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${highlight ? 'border-amber-200 bg-amber-50' : 'border-border bg-muted/10'}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-amber-700' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function SRow({ label, value, bold, valueClass }: { label: string; value: React.ReactNode; bold?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] ${bold ? 'font-bold text-foreground text-sm' : `font-medium text-foreground ${valueClass ?? ''}`}`}>{value}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type MainTab = 'settlements' | 'redemptions'

export function EarningsClient() {
  const [monthIdx, setMonthIdx]     = useState(2) // default June 2026
  const [activeTab, setActiveTab]   = useState<MainTab>('settlements')
  const [settlements, setSettlements] = useState<Settlement[]>(SEED_SETTLEMENTS)
  const [redemptions, setRedemptions] = useState<RedemptionRequest[]>(SEED_REDEMPTIONS)
  const [reporters]                   = useState(SEED_REPORTERS)
  const [selectedReporter, setSelectedReporter] = useState<Reporter | null>(null)
  const [modalTarget, setModalTarget] = useState<{ s: Settlement; action: 'paid' | 'adjust' | 'hold' | 'process' } | null>(null)
  const [rejectRedTarget, setRejectRedTarget] = useState<RedemptionRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | 'all'>('all')

  const currentMonth  = MONTHS[monthIdx]!
  const monthSettlements = useMemo(() =>
    settlements.filter(s => s.period === currentMonth.period),
    [settlements, currentMonth.period]
  )

  const filteredSettlements = useMemo(() => {
    if (statusFilter === 'all') return monthSettlements
    return monthSettlements.filter(s => s.status === statusFilter)
  }, [monthSettlements, statusFilter])

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending')

  // Stats for current month
  const totalGross   = monthSettlements.reduce((s, x) => s + x.breakdown.grossEarningsInr, 0)
  const totalNet     = monthSettlements.reduce((s, x) => s + x.netPayableInr, 0)
  const totalSettled = monthSettlements.filter(s => s.status === 'settled').reduce((s, x) => s + x.netPayableInr, 0)
  const totalPending = monthSettlements.filter(s => s.status === 'pending').reduce((s, x) => s + x.netPayableInr, 0)
  const totalTds     = monthSettlements.reduce((s, x) => s + x.tdsDeductedInr, 0)
  const onHoldCount  = monthSettlements.filter(s => s.status === 'on_hold').length

  function updateSettlement(id: string, patch: Partial<Settlement>) {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  function handleMarkPaid(id: string, ref: string, method: 'upi' | 'bank_transfer', date: string) {
    updateSettlement(id, { status: 'settled', paymentReference: ref, paymentMethod: method, paidAt: new Date(date), paidBy: 'admin@puralocal.in', settledAt: new Date(date) })
    toast.success('Settlement marked as paid')
  }
  function handleAdjust(id: string, amount: number, note: string) {
    setSettlements(prev => prev.map(s => {
      if (s.id !== id) return s
      const adj = s.manualAdjustmentInr + amount
      const net = Math.max(0, s.breakdown.grossEarningsInr + adj - s.tdsDeductedInr)
      return { ...s, manualAdjustmentInr: adj, manualAdjustmentNote: note, netPayableInr: net }
    }))
    toast.success(`Adjustment of ${inr(Math.abs(amount))} applied`)
  }
  function handleHold(id: string, reason: string) {
    updateSettlement(id, { status: 'on_hold', onHoldReason: reason })
    toast.error('Settlement placed on hold')
  }
  function handleProcess(id: string) {
    updateSettlement(id, { status: 'processing' })
    toast.info('Settlement marked as processing')
  }

  function handleApproveRedemption(req: RedemptionRequest) {
    setRedemptions(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved', reviewedAt: new Date(), reviewedBy: 'admin@puralocal.in' } : r))
    toast.success(`Redemption request approved — create a settlement for ${req.reporterName}`)
  }
  function handleRejectRedemption(id: string, note: string) {
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', adminNote: note, reviewedAt: new Date(), reviewedBy: 'admin@puralocal.in' } : r))
    setRejectRedTarget(null)
    toast.error('Redemption request rejected')
  }

  function handleDetailEdit(s: Settlement, action: 'paid' | 'adjust' | 'hold' | 'process') {
    if (action === 'process') { handleProcess(s.id) }
    else setModalTarget({ s, action })
  }

  function exportCsv() {
    if (activeTab === 'settlements') {
      const rows = filteredSettlements.map(s => ({
        'Reporter':       s.reporterName,
        'Period':         s.period,
        'Image Posts':    s.breakdown.imagePosts,
        'Video Posts':    s.breakdown.videoPosts,
        'Short Posts':    s.breakdown.shortPosts,
        'Live Sessions':  s.breakdown.liveSessions,
        'Gross (₹)':      s.breakdown.grossEarningsInr.toFixed(2),
        'Bonus (₹)':      (s.breakdown.reachBonusInr + s.breakdown.viralBonusInr + s.breakdown.volumeBonusInr + s.breakdown.streakBonusInr).toFixed(2),
        'Adjustment (₹)': s.manualAdjustmentInr.toFixed(2),
        'TDS (₹)':        s.tdsDeductedInr.toFixed(2),
        'Net Payable (₹)':s.netPayableInr.toFixed(2),
        'Status':         s.status,
        'Payment Ref':    s.paymentReference ?? '',
        'Paid At':        s.paidAt ? s.paidAt.toISOString() : '',
      }))
      downloadCsv(`settlements-${currentMonth.period}.csv`, rows)
    } else {
      const rows = redemptions.map(r => ({
        'Reporter':           r.reporterName,
        'Requested At':       r.requestedAt.toISOString(),
        'Period':             r.period,
        'Amount (₹)':         r.amountRequestedInr.toFixed(2),
        'Available Balance (₹)': r.availableBalanceInr.toFixed(2),
        'Note':               r.reporterNote ?? '',
        'Status':             r.status,
        'Reviewed At':        r.reviewedAt ? r.reviewedAt.toISOString() : '',
        'Admin Note':         r.adminNote ?? '',
      }))
      downloadCsv(`redemptions-${currentMonth.period}.csv`, rows)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Earnings Management</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Track earnings, manage settlements, and process payouts — all in ₹</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1.5 text-[13px]"
          onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border mb-6">
        {([['settlements', 'Monthly Settlements'], ['redemptions', 'Redemption Requests']] as [MainTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
            {id === 'redemptions' && pendingRedemptions.length > 0 && (
              <span className="h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRedemptions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'settlements' && (
        <>
          {/* Month navigator */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))} disabled={monthIdx === 0}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-foreground w-28 text-center">{currentMonth.label}</span>
              <button onClick={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))} disabled={monthIdx === MONTHS.length - 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
              {monthIdx === MONTHS.length - 1 && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">Current month</span>
              )}
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-lg p-0.5">
              {(['all', 'pending', 'processing', 'settled', 'on_hold'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize
                    ${statusFilter === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {s === 'all' ? 'All' : s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Gross Earnings',  value: inr(totalGross),   color: 'text-foreground',                       bg: 'bg-card' },
              { label: 'Net Payable',     value: inr(totalNet),     color: 'text-foreground',                       bg: 'bg-card' },
              { label: 'Settled',         value: inr(totalSettled), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/60 dark:bg-emerald-500/10' },
              { label: 'Pending',         value: inr(totalPending), color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50/60 dark:bg-amber-500/10' },
              { label: 'TDS Deducted',    value: inr(totalTds),     color: 'text-primary',                          bg: 'bg-primary/5 dark:bg-primary/10' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border bg-card ring-1 ring-border/50 px-4 py-3 ${s.bg}`}>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold mt-1 tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {onHoldCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-700">
                <span className="font-semibold">{onHoldCount} settlement{onHoldCount > 1 ? 's' : ''} on hold</span> — action required before month-end.
              </p>
            </div>
          )}

          {/* Settlements table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto rounded-t-2xl">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['Reporter', 'Posts (I/V/S/L)', 'Gross', 'Bonus', 'Adj', 'TDS', 'Net Payable', 'Status', ''].map(h => (
                      <th key={h} className="py-3 px-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSettlements.length === 0 ? (
                    <tr><td colSpan={9} className="py-14 text-center text-sm text-muted-foreground">No settlements for this filter</td></tr>
                  ) : filteredSettlements.map(s => {
                    const reporter = reporters.find(r => r.id === s.reporterId)
                    const b        = s.breakdown
                    const posts    = `${b.imagePosts}/${b.videoPosts}/${b.shortPosts}/${b.liveSessions}`
                    const bonus    = b.reachBonusInr + b.viralBonusInr + b.volumeBonusInr + b.streakBonusInr
                    return (
                      <tr key={s.id}
                        className={`hover:bg-muted/20 transition-colors ${s.status === 'on_hold' ? 'bg-red-50/30' : ''}`}>
                        <td className="py-3 px-3">
                          <button className="flex items-center gap-2.5 text-left group"
                            onClick={() => reporter && setSelectedReporter(reporter)}>
                            <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-muted-foreground">{s.reporterName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground group-hover:underline">{s.reporterName}</p>
                              <p className="text-[10px] text-muted-foreground">{reporter?.designation} · {reporter?.district}</p>
                            </div>
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-mono text-foreground">{posts}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-semibold text-foreground">{inr(b.grossEarningsInr - bonus)}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-semibold ${bonus > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {bonus > 0 ? `+${inr(bonus)}` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-semibold ${s.manualAdjustmentInr !== 0 ? (s.manualAdjustmentInr > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-muted-foreground'}`}>
                            {s.manualAdjustmentInr !== 0 ? `${s.manualAdjustmentInr > 0 ? '+' : ''}${inr(s.manualAdjustmentInr)}` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-semibold ${s.tdsDeductedInr > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {s.tdsDeductedInr > 0 ? `-${inr(s.tdsDeductedInr)}` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-sm font-bold text-foreground">{inr(s.netPayableInr)}</span>
                          {s.paymentReference && (
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.paymentReference}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <SettlementStatusBadge status={s.status} />
                            {s.status === 'on_hold' && (
                              <p className="text-[9px] text-red-500 max-w-[120px] leading-tight truncate">{s.onHoldReason}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-0.5">
                            {reporter && (
                              <button onClick={() => setSelectedReporter(reporter)} title="View details"
                                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {(s.status === 'pending' || s.status === 'processing') && (
                              <button onClick={() => setModalTarget({ s, action: 'paid' })} title="Mark as paid"
                                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600">
                                <Wallet className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {s.status !== 'settled' && (
                              <button onClick={() => setModalTarget({ s, action: 'adjust' })} title="Adjust"
                                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{filteredSettlements.length} reporter{filteredSettlements.length !== 1 ? 's' : ''} · {currentMonth.label}</p>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[11px] text-muted-foreground">TDS deducted per Sec. 194J — {inr(totalTds)} this month</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'redemptions' && (
        <>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto rounded-t-2xl">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Reporter', 'Requested', 'Period', 'Amount', 'Available Balance', 'Note', 'Status', ''].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {redemptions.length === 0 ? (
                  <tr><td colSpan={8} className="py-14 text-center text-sm text-muted-foreground">No redemption requests</td></tr>
                ) : redemptions.map(req => (
                  <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground">{req.reporterName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-foreground">{fmtDate(req.requestedAt)}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(req.requestedAt)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-muted-foreground">{req.period}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-foreground">{inr(req.amountRequestedInr)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-foreground">{inr(req.availableBalanceInr)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[11px] text-muted-foreground max-w-[160px] truncate">{req.reporterNote ?? '—'}</p>
                      {req.adminNote && <p className="text-[10px] text-blue-600 max-w-[160px] truncate">Admin: {req.adminNote}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <RedemptionStatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4">
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleApproveRedemption(req)}
                            className="h-7 flex items-center gap-1 px-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">
                            <Check className="h-3 w-3" />Approve
                          </button>
                          <button onClick={() => setRejectRedTarget(req)}
                            className="h-7 flex items-center gap-1 px-2.5 rounded-md bg-red-50 border border-red-200 text-[11px] font-medium text-red-600 hover:bg-red-100">
                            <X className="h-3 w-3" />Reject
                          </button>
                        </div>
                      )}
                      {req.status !== 'pending' && req.reviewedAt && (
                        <p className="text-[10px] text-muted-foreground">{fmtDate(req.reviewedAt)}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <p className="text-[11px] text-blue-700">
              When you approve a redemption request, create the settlement record and mark it paid after bank transfer. Enter the UTR/UPI reference for audit trail.
            </p>
          </div>
        </>
      )}

      {/* Detail panel */}
      {selectedReporter && (
        <DetailPanel
          reporter={selectedReporter}
          settlements={settlements.filter(s => s.reporterId === selectedReporter.id)}
          onClose={() => setSelectedReporter(null)}
          onEdit={handleDetailEdit}
        />
      )}

      {/* Modals */}
      {modalTarget?.action === 'paid' && (
        <MarkPaidModal settlement={modalTarget.s} onSave={handleMarkPaid} onClose={() => setModalTarget(null)} />
      )}
      {modalTarget?.action === 'adjust' && (
        <AdjustModal settlement={modalTarget.s} onSave={handleAdjust} onClose={() => setModalTarget(null)} />
      )}
      {modalTarget?.action === 'hold' && (
        <HoldModal settlement={modalTarget.s} onSave={handleHold} onClose={() => setModalTarget(null)} />
      )}
      {rejectRedTarget && (
        <RejectRedemptionModal req={rejectRedTarget} onSave={handleRejectRedemption} onClose={() => setRejectRedTarget(null)} />
      )}
    </div>
  )
}
