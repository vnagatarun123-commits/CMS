'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Percent, ImageIcon, Video, Film, Radio, TrendingUp, Zap,
  BarChart2, Repeat, Shield, X, Check, Pencil, Info, Users, Plus, Trash2, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COMMISSION_RULES, SEED_REPORTERS } from '@/lib/mock/seed-reporters'
import type { CommissionRule, EarningMode } from '@/types/earnings'

// ── Helpers ───────────────────────────────────────────────────────────────────

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

function blankRule(orgId: string): CommissionRule {
  return {
    id: `rule_${Date.now()}`,
    organizationId: orgId,
    name: '', description: '', isDefault: false, earningMode: 'post_based',
    imagePostRateInr: 0, videoPostRateInr: 0, shortPostRateInr: 0, liveSessionRateInr: 0,
    imageCpmInr: 0, videoCpmInr: 0, shortCpmInr: 0, liveCpmInr: 0,
    reachBonusThreshold: null, reachBonusAmountInr: null,
    viralBonusThreshold: null, viralBonusAmountInr: null,
    volumeBonusThreshold: null, volumeBonusAmountInr: null,
    streakBonusMonths: null, streakBonusAmountInr: null,
    tdsApplicable: false, tdsThresholdInr: 15000, tdsRatePercent: 10,
    createdAt: new Date(), updatedAt: new Date(),
  }
}

function Toggle({ value, onChange }: { value: EarningMode; onChange: (v: EarningMode) => void }) {
  return (
    <div className="inline-flex items-center bg-muted rounded-xl p-1 gap-0.5">
      {(['post_based', 'impression_based'] as EarningMode[]).map(m => (
        <button key={m} onClick={() => onChange(m)}
          className={cn('px-4 py-2 rounded-lg text-xs font-semibold transition-all',
            value === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          {m === 'post_based' ? '₹ per Post' : '₹ per 1K Impressions (CPM)'}
        </button>
      ))}
    </div>
  )
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('h-6 w-11 rounded-full transition-colors relative shrink-0', on ? 'bg-primary' : 'bg-muted')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all', on ? 'left-5 -translate-x-0.5' : 'left-0.5')} />
    </button>
  )
}

// ── Rate / bonus config ─────────────────────────────────────────────────────────

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
  { key: 'image',  label: 'Image Post',   description: 'Published image articles',   icon: ImageIcon, color: 'text-primary',    postField: 'imagePostRateInr',   cpmField: 'imageCpmInr'  },
  { key: 'video',  label: 'Video Post',   description: 'Published video stories',    icon: Video,     color: 'text-violet-500', postField: 'videoPostRateInr',   cpmField: 'videoCpmInr'  },
  { key: 'short',  label: 'Short/Reel',   description: 'Short-form vertical video',  icon: Film,      color: 'text-pink-500',   postField: 'shortPostRateInr',   cpmField: 'shortCpmInr'  },
  { key: 'live',   label: 'Live Session', description: 'Live broadcast per session', icon: Radio,     color: 'text-red-500',    postField: 'liveSessionRateInr', cpmField: 'liveCpmInr'   },
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
  { id: 'reach',  icon: TrendingUp, color: 'text-emerald-500', title: 'Reach Bonus',  description: 'Bonus per post when it crosses an impression threshold',              thresholdLabel: 'Impressions per post', thresholdField: 'reachBonusThreshold',  amountField: 'reachBonusAmountInr'  },
  { id: 'viral',  icon: Zap,        color: 'text-amber-500',   title: 'Viral Bonus',  description: 'Higher bonus per post for truly viral reach (stacks with Reach Bonus)', thresholdLabel: 'Impressions per post', thresholdField: 'viralBonusThreshold',  amountField: 'viralBonusAmountInr'  },
  { id: 'volume', icon: BarChart2,  color: 'text-primary',     title: 'Volume Bonus', description: 'Flat monthly bonus when reporter publishes N or more posts',           thresholdLabel: 'Posts in a month',     thresholdField: 'volumeBonusThreshold', amountField: 'volumeBonusAmountInr' },
  { id: 'streak', icon: Repeat,     color: 'text-violet-500',  title: 'Streak Bonus', description: 'Monthly flat bonus for reporters active for N consecutive months',     thresholdLabel: 'Consecutive months',   thresholdField: 'streakBonusMonths',    amountField: 'streakBonusAmountInr' },
]

// ── Rule editor modal (create + edit) ───────────────────────────────────────────

function RuleEditorModal({ rule, isNew, onSave, onClose }: {
  rule: CommissionRule
  isNew: boolean
  onSave: (r: CommissionRule) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<CommissionRule>({ ...rule })

  const num = (field: keyof CommissionRule) => (draft[field] as number | null) ?? 0
  const setNum = (field: keyof CommissionRule, v: string) =>
    setDraft(prev => ({ ...prev, [field]: v === '' ? null : parseFloat(v) || 0 }))
  const toggle = (field: keyof CommissionRule) =>
    setDraft(prev => ({ ...prev, [field]: !(prev[field] as boolean) }))

  function handleSave() {
    if (!draft.name.trim()) { toast.error('Rule name is required'); return }
    onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim(), updatedAt: new Date() })
    toast.success(isNew ? `${draft.name.trim()} rule created` : `${draft.name.trim()} rule saved`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-glass-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              {isNew ? 'New Commission Rule' : `Edit Commission Rule${draft.name ? ` — ${draft.name}` : ''}`}
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">Set rates, bonuses and TDS. Applies from the next settlement cycle.</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Rule name</label>
                <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Standard, Premium, District Lead"
                  className="mt-1.5 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40" autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
                <input value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
                  placeholder="Short summary of who this rule is for"
                  className="mt-1.5 w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">Default rule</p>
                <p className="text-[10px] text-muted-foreground">Applied to new reporters</p>
              </div>
              <Switch on={draft.isDefault} onClick={() => toggle('isDefault')} />
            </div>
          </div>

          {/* Earning mode */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Earning Mode</p>
            <Toggle value={draft.earningMode} onChange={v => setDraft(p => ({ ...p, earningMode: v }))} />
            <p className="text-[11px] text-muted-foreground mt-2">
              {draft.earningMode === 'post_based'
                ? 'Reporter earns a flat ₹ amount for each published post, regardless of impressions.'
                : 'Reporter earns based on impressions. ₹ per 1,000 impressions (CPM) per content type.'}
            </p>
          </div>

          {/* Base rates */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {draft.earningMode === 'post_based' ? 'Per-Post Rates (₹)' : 'CPM Rates (₹ per 1K impressions)'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTENT_TYPES.map(ct => {
                const field = draft.earningMode === 'post_based' ? ct.postField : ct.cpmField
                const Icon  = ct.icon
                return (
                  <div key={ct.key} className="rounded-xl border border-border p-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className={cn('h-4 w-4', ct.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{ct.label}</p>
                      <p className="text-[10px] text-muted-foreground">{ct.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <input type="number" value={num(field)} onChange={e => setNum(field, e.target.value)}
                        className="w-20 h-8 rounded-lg border border-input bg-transparent px-2 text-sm font-semibold text-foreground text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/40" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bonus rules */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bonus Rules</p>
            <div className="space-y-3">
              {BONUS_RULES.map(br => {
                const Icon    = br.icon
                const enabled = (draft[br.thresholdField] as number | null) !== null
                return (
                  <div key={br.id} className={cn('rounded-xl border p-4 transition-colors', enabled ? 'border-border' : 'border-dashed border-border bg-muted/20')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className={cn('h-4 w-4', br.color)} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{br.title}</p>
                          <p className="text-[10px] text-muted-foreground">{br.description}</p>
                        </div>
                      </div>
                      <Switch on={enabled} onClick={() => {
                        if (enabled) setDraft(p => ({ ...p, [br.thresholdField]: null, [br.amountField]: null }))
                        else setDraft(p => ({ ...p, [br.thresholdField]: 10000, [br.amountField]: 50 }))
                      }} />
                    </div>
                    {enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">{br.thresholdLabel}</p>
                          <input type="number" value={num(br.thresholdField)} onChange={e => setNum(br.thresholdField, e.target.value)}
                            className="w-full h-8 rounded-lg border border-input bg-transparent px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/40" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Bonus amount (₹)</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">₹</span>
                            <input type="number" value={num(br.amountField)} onChange={e => setNum(br.amountField, e.target.value)}
                              className="w-full h-8 rounded-lg border border-input bg-transparent px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/40" />
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
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">TDS Settings</p>
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">TDS Applicable (Sec. 194J)</p>
                  <p className="text-[11px] text-muted-foreground">Deduct TDS if annual payouts exceed threshold</p>
                </div>
                <Switch on={draft.tdsApplicable} onClick={() => toggle('tdsApplicable')} />
              </div>
              {draft.tdsApplicable && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Annual threshold (₹)</p>
                    <input type="number" value={draft.tdsThresholdInr} onChange={e => setDraft(p => ({ ...p, tdsThresholdInr: +e.target.value }))}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">TDS rate (%)</p>
                    <input type="number" value={draft.tdsRatePercent} onChange={e => setDraft(p => ({ ...p, tdsRatePercent: +e.target.value }))}
                      className="w-full h-8 rounded-lg border border-input bg-transparent px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/40" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="flex-1 gap-1.5" onClick={handleSave}>
            <Check className="h-3.5 w-3.5" />{isNew ? 'Create Rule' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation ─────────────────────────────────────────────────────────

function DeleteModal({ rule, assignedCount, onConfirm, onClose }: {
  rule: CommissionRule; assignedCount: number; onConfirm: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-glass-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/12 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
          </div>
          <h3 className="text-[15px] font-semibold text-foreground">Delete “{rule.name}”?</h3>
        </div>
        <p className="text-[13px] text-muted-foreground">
          This commission rule will be permanently removed.
          {assignedCount > 0 && (
            <> <span className="font-medium text-foreground">{assignedCount} reporter{assignedCount !== 1 ? 's' : ''}</span> currently on this rule will move to the default rule.</>
          )}
          {rule.isDefault && ' Another rule will be promoted to default.'}
        </p>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" className="flex-1 gap-1.5" onClick={onConfirm}>
            <Trash2 className="h-3.5 w-3.5" />Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CommissionClient() {
  const [rules, setRules]       = useState<CommissionRule[]>(COMMISSION_RULES)
  const [editorRule, setEditor] = useState<CommissionRule | null>(null)
  const [isNewRule, setIsNew]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<CommissionRule | null>(null)

  const orgId = rules[0]?.organizationId ?? 'org_puralocal_001'
  const assignedCount = (ruleId: string) =>
    SEED_REPORTERS.filter(r => r.commissionRuleId === ruleId).length

  function openCreate() { setEditor(blankRule(orgId)); setIsNew(true) }
  function openEdit(rule: CommissionRule) { setEditor(rule); setIsNew(false) }

  function saveRule(updated: CommissionRule) {
    setRules(prev => {
      const exists = prev.some(r => r.id === updated.id)
      let next = exists ? prev.map(r => (r.id === updated.id ? updated : r)) : [...prev, updated]
      // A single default: if this rule is default, clear default on the rest.
      if (updated.isDefault) next = next.map(r => (r.id === updated.id ? r : { ...r, isDefault: false }))
      // Always keep at least one default.
      if (next.length > 0 && !next.some(r => r.isDefault)) next = next.map((r, i) => (i === 0 ? { ...r, isDefault: true } : r))
      return next
    })
    setEditor(null); setIsNew(false)
  }

  function deleteRule(rule: CommissionRule) {
    if (rules.length <= 1) { toast.error('At least one commission rule is required'); setConfirmDelete(null); return }
    setRules(prev => {
      let next = prev.filter(r => r.id !== rule.id)
      if (rule.isDefault && !next.some(r => r.isDefault)) next = next.map((r, i) => (i === 0 ? { ...r, isDefault: true } : r))
      return next
    })
    toast.success(`“${rule.name}” deleted`)
    setConfirmDelete(null)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Commission Rules</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Configure earning rates, bonuses, and TDS settings for reporters</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-[11px] text-primary/90">Rules apply from the next settlement cycle.</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />New Rule
          </Button>
        </div>
      </div>

      {/* Rules cards */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Percent className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">No commission rules yet</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">Create your first rule to start paying reporters.</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}><Plus className="h-4 w-4" />New Rule</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {rules.map(rule => {
            const count = assignedCount(rule.id)
            return (
              <div key={rule.id} className={cn(
                'rounded-2xl border bg-card overflow-hidden ring-1',
                rule.isDefault ? 'border-primary/30 ring-primary/20' : 'border-border ring-border/50')}>
                {/* Card header */}
                <div className={cn('px-5 py-4 border-b', rule.isDefault ? 'border-primary/15 bg-primary/[0.04]' : 'border-border bg-muted/20')}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                        rule.isDefault ? 'bg-primary/12 text-primary' : 'bg-muted text-foreground')}>
                        <Percent className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-bold text-foreground truncate">{rule.name}</span>
                      {rule.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary border border-primary/30 bg-primary/10 rounded-full px-2 py-0.5 shrink-0">
                          <Star className="h-2.5 w-2.5 fill-primary" />Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3 w-3" />Edit
                      </Button>
                      <Button size="sm" variant="ghost" aria-label={`Delete ${rule.name}`}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmDelete(rule)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{rule.description || 'No description'}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Users className="h-3 w-3" />{count} reporter{count !== 1 ? 's' : ''} on this rule
                    {' · '}{rule.earningMode === 'post_based' ? '₹ per Post' : 'Impression-based (CPM)'}
                  </p>
                </div>

                {/* Rates grid */}
                <div className="p-5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {rule.earningMode === 'post_based' ? 'Per-Post Rates' : 'CPM Rates'}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {CONTENT_TYPES.map(ct => {
                      const Icon  = ct.icon
                      const value = rule.earningMode === 'post_based' ? rule[ct.postField] as number : rule[ct.cpmField] as number
                      return (
                        <div key={ct.key} className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                          <Icon className={cn('h-3.5 w-3.5 shrink-0', ct.color)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground truncate">{ct.label}</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">{inr(value)}
                              <span className="text-[10px] text-muted-foreground font-normal ml-1">{rule.earningMode === 'post_based' ? '/post' : '/1K'}</span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Bonus summary */}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active Bonuses</p>
                  <div className="space-y-1.5">
                    {rule.reachBonusThreshold != null && <BonusLine icon={TrendingUp} color="text-emerald-500" text={`Reach: ${rule.reachBonusThreshold.toLocaleString()} impressions → ${inr(rule.reachBonusAmountInr!)}/post`} />}
                    {rule.viralBonusThreshold != null && <BonusLine icon={Zap} color="text-amber-500" text={`Viral: ${rule.viralBonusThreshold.toLocaleString()} impressions → +${inr(rule.viralBonusAmountInr!)}/post`} />}
                    {rule.volumeBonusThreshold != null && <BonusLine icon={BarChart2} color="text-primary" text={`Volume: ${rule.volumeBonusThreshold}+ posts/month → ${inr(rule.volumeBonusAmountInr!)} flat`} />}
                    {rule.streakBonusMonths != null && <BonusLine icon={Repeat} color="text-violet-500" text={`Streak: ${rule.streakBonusMonths}+ consecutive months → ${inr(rule.streakBonusAmountInr!)} flat`} />}
                    {rule.reachBonusThreshold == null && rule.viralBonusThreshold == null && rule.volumeBonusThreshold == null && rule.streakBonusMonths == null && (
                      <p className="text-[11px] text-muted-foreground">No bonus rules configured</p>
                    )}
                  </div>

                  {/* TDS */}
                  <div className="mt-3 flex items-center gap-2">
                    <Shield className={cn('h-3.5 w-3.5', rule.tdsApplicable ? 'text-amber-500' : 'text-muted-foreground')} />
                    <p className="text-[11px] text-muted-foreground">
                      {rule.tdsApplicable ? `TDS: ${rule.tdsRatePercent}% deducted if annual earnings > ${inr(rule.tdsThresholdInr)}` : 'TDS: Not applicable'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {editorRule && <RuleEditorModal rule={editorRule} isNew={isNewRule} onSave={saveRule} onClose={() => { setEditor(null); setIsNew(false) }} />}
      {confirmDelete && (
        <DeleteModal rule={confirmDelete} assignedCount={assignedCount(confirmDelete.id)}
          onConfirm={() => deleteRule(confirmDelete)} onClose={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}

function BonusLine({ icon: Icon, color, text }: { icon: React.ElementType; color: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn('h-3 w-3 shrink-0', color)} />
      <span className="text-[11px] text-foreground">{text}</span>
    </div>
  )
}
