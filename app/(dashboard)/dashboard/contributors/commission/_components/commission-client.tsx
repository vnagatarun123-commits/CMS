'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Percent, ImageIcon, Video, Film, Radio, TrendingUp, Zap,
  BarChart2, Repeat, Shield, X, Check, Pencil, Info, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMMISSION_RULES, SEED_REPORTERS } from '@/lib/mock/seed-reporters'
import type { CommissionRule, EarningMode } from '@/types/earnings'

// ── Helpers ───────────────────────────────────────────────────────────────────

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function Toggle({ value, onChange }: { value: EarningMode; onChange: (v: EarningMode) => void }) {
  return (
    <div className="inline-flex items-center bg-muted rounded-xl p-1 gap-0.5">
      {(['post_based', 'impression_based'] as EarningMode[]).map(m => (
        <button key={m} onClick={() => onChange(m)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
            ${value === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          {m === 'post_based' ? '₹ per Post' : '₹ per 1K Impressions (CPM)'}
        </button>
      ))}
    </div>
  )
}

// ── Rate editor ───────────────────────────────────────────────────────────────

interface ContentTypeRate {
  key: 'image' | 'video' | 'short' | 'live'
  label: string
  description: string
  icon: React.ElementType
  color: string
  postField: keyof CommissionRule
  cpmField: keyof CommissionRule
}

const CONTENT_TYPES: ContentTypeRate[] = [
  { key: 'image',  label: 'Image Post',   description: 'Published image articles',         icon: ImageIcon, color: 'text-primary',   postField: 'imagePostRateInr',   cpmField: 'imageCpmInr'  },
  { key: 'video',  label: 'Video Post',   description: 'Published video stories',           icon: Video,     color: 'text-violet-500', postField: 'videoPostRateInr',   cpmField: 'videoCpmInr'  },
  { key: 'short',  label: 'Short/Reel',   description: 'Short-form vertical video',         icon: Film,      color: 'text-pink-500',   postField: 'shortPostRateInr',   cpmField: 'shortCpmInr'  },
  { key: 'live',   label: 'Live Session', description: 'Live broadcast per session',        icon: Radio,     color: 'text-red-500',    postField: 'liveSessionRateInr', cpmField: 'liveCpmInr'   },
]

interface BonusRule {
  id: string
  icon: React.ElementType
  color: string
  title: string
  description: string
  thresholdLabel: string
  thresholdField: keyof CommissionRule
  amountField: keyof CommissionRule
}

const BONUS_RULES: BonusRule[] = [
  {
    id: 'reach', icon: TrendingUp, color: 'text-emerald-500',
    title: 'Reach Bonus',
    description: 'Bonus per post when it crosses an impression threshold',
    thresholdLabel: 'Impressions per post',
    thresholdField: 'reachBonusThreshold',
    amountField: 'reachBonusAmountInr',
  },
  {
    id: 'viral', icon: Zap, color: 'text-amber-500',
    title: 'Viral Bonus',
    description: 'Higher bonus per post for truly viral reach (stacks with Reach Bonus)',
    thresholdLabel: 'Impressions per post',
    thresholdField: 'viralBonusThreshold',
    amountField: 'viralBonusAmountInr',
  },
  {
    id: 'volume', icon: BarChart2, color: 'text-primary',
    title: 'Volume Bonus',
    description: 'Flat monthly bonus when reporter publishes N or more posts',
    thresholdLabel: 'Posts in a month',
    thresholdField: 'volumeBonusThreshold',
    amountField: 'volumeBonusAmountInr',
  },
  {
    id: 'streak', icon: Repeat, color: 'text-violet-500',
    title: 'Streak Bonus',
    description: 'Monthly flat bonus for reporters active for N consecutive months',
    thresholdLabel: 'Consecutive months',
    thresholdField: 'streakBonusMonths',
    amountField: 'streakBonusAmountInr',
  },
]

// ── Rule editor modal ─────────────────────────────────────────────────────────

function RuleEditorModal({ rule, onSave, onClose }: {
  rule: CommissionRule
  onSave: (r: CommissionRule) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<CommissionRule>({ ...rule })

  function num(field: keyof CommissionRule) {
    return (draft[field] as number | null) ?? 0
  }
  function setNum(field: keyof CommissionRule, v: string) {
    setDraft(prev => ({ ...prev, [field]: v === '' ? null : parseFloat(v) || 0 }))
  }
  function toggle(field: keyof CommissionRule) {
    setDraft(prev => ({ ...prev, [field]: !(prev[field] as boolean) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Edit Commission Rule — {draft.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{draft.description}</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Earning mode */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Earning Mode</p>
            <Toggle value={draft.earningMode} onChange={v => setDraft(p => ({ ...p, earningMode: v }))} />
            <p className="text-[11px] text-muted-foreground mt-2">
              {draft.earningMode === 'post_based'
                ? 'Reporter earns a flat ₹ amount for each published post, regardless of impressions.'
                : 'Reporter earns based on impressions. ₹ per 1,000 impressions (CPM) per content type.'}
            </p>
          </div>

          {/* Base rates */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
              {draft.earningMode === 'post_based' ? 'Per-Post Rates (₹)' : 'CPM Rates (₹ per 1K impressions)'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map(ct => {
                const field = draft.earningMode === 'post_based' ? ct.postField : ct.cpmField
                const Icon  = ct.icon
                return (
                  <div key={ct.key} className="rounded-xl border border-border p-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className={`h-4 w-4 ${ct.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{ct.label}</p>
                      <p className="text-[10px] text-muted-foreground">{ct.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <input type="number" value={num(field)} onChange={e => setNum(field, e.target.value)}
                        className="w-20 h-8 rounded-lg border border-border bg-muted/20 px-2 text-sm font-semibold text-foreground text-right focus:outline-none focus:ring-1 focus:ring-foreground/20" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bonus rules */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Bonus Rules</p>
            <div className="space-y-3">
              {BONUS_RULES.map(br => {
                const Icon    = br.icon
                const enabled = (draft[br.thresholdField] as number | null) !== null
                return (
                  <div key={br.id} className={`rounded-xl border p-4 transition-colors ${enabled ? 'border-border' : 'border-dashed border-border bg-muted/10'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className={`h-4 w-4 ${br.color}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{br.title}</p>
                          <p className="text-[10px] text-muted-foreground">{br.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (enabled) {
                            setDraft(p => ({ ...p, [br.thresholdField]: null, [br.amountField]: null }))
                          } else {
                            setDraft(p => ({ ...p, [br.thresholdField]: 10000, [br.amountField]: 50 }))
                          }
                        }}
                        className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-foreground' : 'bg-muted'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${enabled ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">{br.thresholdLabel}</p>
                          <input type="number" value={num(br.thresholdField)} onChange={e => setNum(br.thresholdField, e.target.value)}
                            className="w-full h-8 rounded-lg border border-border bg-muted/20 px-3 text-sm font-semibold focus:outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Bonus amount (₹)</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">₹</span>
                            <input type="number" value={num(br.amountField)} onChange={e => setNum(br.amountField, e.target.value)}
                              className="w-full h-8 rounded-lg border border-border bg-muted/20 px-3 text-sm font-semibold focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* TDS */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">TDS Settings</p>
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">TDS Applicable (Sec. 194J)</p>
                  <p className="text-[11px] text-muted-foreground">Deduct 10% TDS if annual payouts exceed threshold</p>
                </div>
                <button onClick={() => toggle('tdsApplicable')}
                  className={`h-6 w-11 rounded-full transition-colors relative shrink-0 ${draft.tdsApplicable ? 'bg-foreground' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${draft.tdsApplicable ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              {draft.tdsApplicable && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Annual threshold (₹)</p>
                    <input type="number" value={draft.tdsThresholdInr} onChange={e => setDraft(p => ({ ...p, tdsThresholdInr: +e.target.value }))}
                      className="w-full h-8 rounded-lg border border-border bg-muted/20 px-3 text-sm font-semibold focus:outline-none" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">TDS rate (%)</p>
                    <input type="number" value={draft.tdsRatePercent} onChange={e => setDraft(p => ({ ...p, tdsRatePercent: +e.target.value }))}
                      className="w-full h-8 rounded-lg border border-border bg-muted/20 px-3 text-sm font-semibold focus:outline-none" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            onClick={() => { onSave({ ...draft, updatedAt: new Date() }); toast.success(`${draft.name} rule saved`) }}>
            <Check className="h-3.5 w-3.5" />Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Reporter override modal ────────────────────────────────────────────────────

function OverrideModal({ reporterId, reporterName, currentRule, rules, onSave, onClose }: {
  reporterId: string; reporterName: string; currentRule: string
  rules: CommissionRule[]; onSave: (rid: string, ruleId: string) => void; onClose: () => void
}) {
  const [selected, setSelected] = useState(currentRule)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-2xl w-[360px] p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Override Commission Rule</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Assigning a custom rule for <span className="font-medium text-foreground">{reporterName}</span>.
          This overrides the default for this reporter only.
        </p>
        <div className="space-y-2">
          {rules.map(r => (
            <button key={r.id} onClick={() => setSelected(r.id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors
                ${selected === r.id ? 'border-foreground bg-muted/30' : 'border-border hover:bg-muted/20'}`}>
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === r.id ? 'border-foreground' : 'border-muted-foreground'}`}>
                {selected === r.id && <div className="h-2 w-2 rounded-full bg-foreground" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{r.name} {r.isDefault && <span className="text-muted-foreground font-normal">(default)</span>}</p>
                <p className="text-[10px] text-muted-foreground">{r.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => { onSave(reporterId, selected); toast.success('Rule override saved'); onClose() }}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CommissionClient() {
  const [rules, setRules]         = useState<CommissionRule[]>(COMMISSION_RULES)
  const [reporters, setReporters] = useState(SEED_REPORTERS)
  const [editRule, setEditRule]   = useState<CommissionRule | null>(null)
  const [overrideTarget, setOverrideTarget] = useState<{ id: string; name: string; currentRule: string } | null>(null)

  function saveRule(updated: CommissionRule) {
    setRules(prev => prev.map(r => r.id === updated.id ? updated : r))
    setEditRule(null)
  }

  function saveOverride(reporterId: string, ruleId: string) {
    setReporters(prev => prev.map(r => r.id === reporterId ? { ...r, commissionRuleId: ruleId } : r))
  }

  const defaultRule  = rules.find(r => r.isDefault)
  const premiumRule  = rules.find(r => !r.isDefault)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 px-1">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Commission Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure earning rates, bonuses, and TDS settings for reporters</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-primary/80">Rules apply from the next settlement cycle. Existing settlements are not affected.</p>
        </div>
      </div>

      {/* Rules cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {rules.map(rule => {
          const assignedCount = reporters.filter(r => r.commissionRuleId === rule.id).length
          return (
            <div key={rule.id} className={`rounded-2xl border-2 bg-card overflow-hidden ${rule.isDefault ? 'border-border' : 'border-violet-200'}`}>
              <div className={`px-5 py-4 border-b ${rule.isDefault ? 'border-border bg-muted/20' : 'border-violet-100 bg-violet-50/50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${rule.isDefault ? 'bg-muted' : 'bg-violet-100'}`}>
                      <Percent className={`h-3.5 w-3.5 ${rule.isDefault ? 'text-foreground' : 'text-violet-700'}`} />
                    </div>
                    <span className="text-sm font-bold text-foreground">{rule.name}</span>
                    {rule.isDefault && <span className="text-[10px] font-semibold text-muted-foreground border border-border rounded-full px-2 py-0.5">Default</span>}
                    {!rule.isDefault && <span className="text-[10px] font-semibold text-violet-700 border border-violet-200 bg-violet-50 rounded-full px-2 py-0.5">★ Premium</span>}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditRule(rule)}>
                    <Pencil className="h-3 w-3" />Edit
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">{rule.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Users className="h-3 w-3" />{assignedCount} reporter{assignedCount !== 1 ? 's' : ''} on this rule
                  {' · '}{rule.earningMode === 'post_based' ? '₹ per Post' : 'Impression-based (CPM)'}
                </p>
              </div>

              {/* Rates grid */}
              <div className="p-5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  {rule.earningMode === 'post_based' ? 'Per-Post Rates' : 'CPM Rates'}
                </p>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {CONTENT_TYPES.map(ct => {
                    const Icon  = ct.icon
                    const value = rule.earningMode === 'post_based'
                      ? rule[ct.postField] as number
                      : rule[ct.cpmField] as number
                    return (
                      <div key={ct.key} className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/10 px-3 py-2.5">
                        <Icon className={`h-3.5 w-3.5 ${ct.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-muted-foreground truncate">{ct.label}</p>
                          <p className="text-sm font-bold text-foreground">{inr(value)}
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              {rule.earningMode === 'post_based' ? '/post' : '/1K'}
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bonus summary */}
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Active Bonuses</p>
                <div className="space-y-1.5">
                  {rule.reachBonusThreshold && (
                    <BonusLine icon={TrendingUp} color="text-emerald-500"
                      text={`Reach: ${rule.reachBonusThreshold.toLocaleString()} impressions → ${inr(rule.reachBonusAmountInr!)}/post`} />
                  )}
                  {rule.viralBonusThreshold && (
                    <BonusLine icon={Zap} color="text-amber-500"
                      text={`Viral: ${rule.viralBonusThreshold.toLocaleString()} impressions → +${inr(rule.viralBonusAmountInr!)}/post`} />
                  )}
                  {rule.volumeBonusThreshold && (
                    <BonusLine icon={BarChart2} color="text-primary"
                      text={`Volume: ${rule.volumeBonusThreshold}+ posts/month → ${inr(rule.volumeBonusAmountInr!)} flat`} />
                  )}
                  {rule.streakBonusMonths && (
                    <BonusLine icon={Repeat} color="text-violet-500"
                      text={`Streak: ${rule.streakBonusMonths}+ consecutive months → ${inr(rule.streakBonusAmountInr!)} flat`} />
                  )}
                  {!rule.reachBonusThreshold && !rule.viralBonusThreshold && !rule.volumeBonusThreshold && !rule.streakBonusMonths && (
                    <p className="text-[11px] text-muted-foreground">No bonus rules configured</p>
                  )}
                </div>

                {/* TDS */}
                <div className="mt-3 flex items-center gap-2">
                  <Shield className={`h-3.5 w-3.5 ${rule.tdsApplicable ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <p className="text-[11px] text-muted-foreground">
                    {rule.tdsApplicable
                      ? `TDS: ${rule.tdsRatePercent}% deducted if annual earnings > ${inr(rule.tdsThresholdInr)}`
                      : 'TDS: Not applicable'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reporter overrides table */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Reporter Rule Assignments</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Override the commission rule for individual reporters</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Reporter', 'Designation', 'Type', 'Active Rule', 'This Month', 'Lifetime', ''].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reporters.filter(r => r.status === 'active').map(reporter => {
                const appliedRule = rules.find(r => r.id === reporter.commissionRuleId) ?? rules[0]!
                const isPremium   = appliedRule.id === 'rule_premium'
                return (
                  <tr key={reporter.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-muted-foreground">{reporter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{reporter.name}</p>
                          <p className="text-[10px] text-muted-foreground">{reporter.district}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-foreground">{reporter.designation}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] capitalize text-muted-foreground">{reporter.reporterType.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold ${isPremium ? 'text-violet-700' : 'text-foreground'}`}>
                        {appliedRule.name}
                        {!reporter.commissionRuleId.includes('standard') && !isPremium && ' (custom)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-foreground">{inr(reporter.currentMonthEarningsInr)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-muted-foreground">{inr(reporter.lifetimeEarnedInr)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                        onClick={() => setOverrideTarget({ id: reporter.id, name: reporter.name, currentRule: reporter.commissionRuleId })}>
                        <Pencil className="h-3 w-3" />Override
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editRule && <RuleEditorModal rule={editRule} onSave={saveRule} onClose={() => setEditRule(null)} />}
      {overrideTarget && (
        <OverrideModal
          reporterId={overrideTarget.id}
          reporterName={overrideTarget.name}
          currentRule={overrideTarget.currentRule}
          rules={rules}
          onSave={saveOverride}
          onClose={() => setOverrideTarget(null)}
        />
      )}
    </div>
  )
}

function BonusLine({ icon: Icon, color, text }: { icon: React.ElementType; color: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3 w-3 ${color} shrink-0`} />
      <span className="text-[11px] text-foreground">{text}</span>
    </div>
  )
}
