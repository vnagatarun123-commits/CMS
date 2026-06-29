'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

type CampaignStatus = 'Active' | 'Paused' | 'Completed'
type CampaignType = 'Banner' | 'Interstitial' | 'Native' | 'Video'
type SlotType = 'Banner' | 'Interstitial' | 'Native' | 'Video'
type SlotStatus = 'Active' | 'Paused'

interface Campaign {
  id: string
  name: string
  advertiser: string
  type: CampaignType
  status: CampaignStatus
  budget: number
  spent: number
  impressions: number
  clicks: number
  ctr: string
  period: string
}

interface AdSlot {
  id: string
  name: string
  type: SlotType
  placement: string
  dimensions: string
  fillRate: number
  cpm: number
  estDailyRevenue: number
  status: SlotStatus
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Hyderabad Summer Sale',
    advertiser: 'Reliance Retail',
    type: 'Banner',
    status: 'Active',
    budget: 50000,
    spent: 32400,
    impressions: 124000,
    clicks: 3720,
    ctr: '3.0%',
    period: 'Jun 1 – Jul 31',
  },
  {
    id: 'c2',
    name: 'Andhra Elections Coverage',
    advertiser: 'News18',
    type: 'Native',
    status: 'Completed',
    budget: 200000,
    spent: 200000,
    impressions: 840000,
    clicks: 16800,
    ctr: '2.0%',
    period: 'Apr 1 – May 15',
  },
  {
    id: 'c3',
    name: 'School Admissions 2025',
    advertiser: 'Sri Chaitanya',
    type: 'Banner',
    status: 'Active',
    budget: 75000,
    spent: 28500,
    impressions: 95000,
    clicks: 3800,
    ctr: '4.0%',
    period: 'Jun 10 – Jul 20',
  },
  {
    id: 'c4',
    name: 'Diwali Mega Offers',
    advertiser: 'Amazon India',
    type: 'Interstitial',
    status: 'Paused',
    budget: 150000,
    spent: 61200,
    impressions: 310000,
    clicks: 7440,
    ctr: '2.4%',
    period: 'May 20 – Jun 30',
  },
  {
    id: 'c5',
    name: 'Local Restaurant Week',
    advertiser: 'Zomato',
    type: 'Native',
    status: 'Active',
    budget: 25000,
    spent: 11250,
    impressions: 62500,
    clicks: 2500,
    ctr: '4.0%',
    period: 'Jun 20 – Jun 30',
  },
  {
    id: 'c6',
    name: 'New App Launch',
    advertiser: 'PhonePe',
    type: 'Video',
    status: 'Active',
    budget: 90000,
    spent: 18000,
    impressions: 45000,
    clicks: 1800,
    ctr: '4.0%',
    period: 'Jun 25 – Jul 25',
  },
]

const MOCK_SLOTS: AdSlot[] = [
  {
    id: 's1',
    name: 'Feed Banner #1',
    type: 'Banner',
    placement: 'Between articles 5 & 10',
    dimensions: '320×50',
    fillRate: 78,
    cpm: 18,
    estDailyRevenue: 420,
    status: 'Active',
  },
  {
    id: 's2',
    name: 'Article Header',
    type: 'Banner',
    placement: 'Top of article page',
    dimensions: '728×90',
    fillRate: 65,
    cpm: 24,
    estDailyRevenue: 580,
    status: 'Active',
  },
  {
    id: 's3',
    name: 'Full-Screen Interstitial',
    type: 'Interstitial',
    placement: 'After 3rd video',
    dimensions: '360×640',
    fillRate: 42,
    cpm: 85,
    estDailyRevenue: 1260,
    status: 'Active',
  },
  {
    id: 's4',
    name: 'Native Feed Card',
    type: 'Native',
    placement: 'In content feed (pos 8)',
    dimensions: '300×250',
    fillRate: 88,
    cpm: 32,
    estDailyRevenue: 840,
    status: 'Active',
  },
  {
    id: 's5',
    name: 'Pre-roll Video Ad',
    type: 'Video',
    placement: 'Before video plays',
    dimensions: '640×360',
    fillRate: 55,
    cpm: 120,
    estDailyRevenue: 1980,
    status: 'Active',
  },
  {
    id: 's6',
    name: 'Sidebar Panel',
    type: 'Banner',
    placement: 'Desktop right sidebar',
    dimensions: '160×600',
    fillRate: 22,
    cpm: 12,
    estDailyRevenue: 98,
    status: 'Paused',
  },
]

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN')
}

function fmtNum(n: number): string {
  if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString('en-IN')
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cls =
    status === 'Active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Paused'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function SlotTypeBadge({ type }: { type: SlotType }) {
  const cls =
    type === 'Banner'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : type === 'Interstitial'
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : type === 'Native'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-orange-50 text-orange-700 border-orange-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Campaigns tab ─────────────────────────────────────────────────────────────

function CampaignsTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS)

  const filtered = campaigns.filter(c => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.advertiser.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    const matchType = typeFilter === 'all' || c.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  const active = campaigns.filter(c => c.status === 'Active')
  const paused = campaigns.filter(c => c.status === 'Paused')
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0)
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)

  const handleToggle = (id: string) => {
    setCampaigns(prev =>
      prev.map(c => {
        if (c.id !== id) return c
        const next = c.status === 'Active' ? 'Paused' : 'Active'
        toast.success(`Campaign ${next === 'Active' ? 'resumed' : 'paused'}`)
        return { ...c, status: next as CampaignStatus }
      }),
    )
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total Campaigns" value={String(campaigns.length)} />
        <StatCard label="Active" value={String(active.length)} />
        <StatCard label="Paused" value={String(paused.length)} />
        <StatCard label="Total Budget" value={fmtINR(totalBudget)} />
        <StatCard label="Total Spent" value={fmtINR(totalSpent)} sub={`${Math.round((totalSpent / totalBudget) * 100)}% utilised`} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search campaigns or advertisers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <Select value={statusFilter} onValueChange={v => v && setStatusFilter(v)}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => v && setTypeFilter(v)}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Banner">Banner</SelectItem>
            <SelectItem value="Interstitial">Interstitial</SelectItem>
            <SelectItem value="Native">Native</SelectItem>
            <SelectItem value="Video">Video</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => toast.info('New campaign flow — coming soon')}>
            + New campaign
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Campaign Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Advertiser</th>
              <th className="px-4 py-2.5 text-left font-medium">Type</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Budget</th>
              <th className="px-4 py-2.5 text-right font-medium">Spent</th>
              <th className="px-4 py-2.5 text-right font-medium">Impressions</th>
              <th className="px-4 py-2.5 text-right font-medium">Clicks</th>
              <th className="px-4 py-2.5 text-right font-medium">CTR</th>
              <th className="px-4 py-2.5 text-left font-medium">Period</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(c => (
              <tr key={c.id} className="group hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.advertiser}</td>
                <td className="px-4 py-3">
                  <SlotTypeBadge type={c.type} />
                </td>
                <td className="px-4 py-3">
                  <CampaignStatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtINR(c.budget)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtINR(c.spent)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(c.impressions)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtNum(c.clicks)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{c.ctr}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.period}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status !== 'Completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleToggle(c.id)}
                      >
                        {c.status === 'Active' ? 'Pause' : 'Resume'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => toast.info(`Viewing ${c.name}`)}
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No campaigns match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Ad Slots tab ──────────────────────────────────────────────────────────────

function AdSlotsTab() {
  const [slots, setSlots] = useState<AdSlot[]>(MOCK_SLOTS)

  const active = slots.filter(s => s.status === 'Active')
  const avgFillRate = Math.round(slots.reduce((s, sl) => s + sl.fillRate, 0) / slots.length)
  const avgCpm = Math.round(slots.reduce((s, sl) => s + sl.cpm, 0) / slots.length)

  const handleToggle = (id: string) => {
    setSlots(prev =>
      prev.map(s => {
        if (s.id !== id) return s
        const next = s.status === 'Active' ? 'Paused' : 'Active'
        toast.success(`Slot ${next === 'Active' ? 'activated' : 'paused'}`)
        return { ...s, status: next as SlotStatus }
      }),
    )
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Slots" value={String(slots.length)} />
        <StatCard label="Active Slots" value={String(active.length)} />
        <StatCard label="Avg Fill Rate" value={`${avgFillRate}%`} />
        <StatCard label="Avg CPM" value={fmtINR(avgCpm)} />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Slot Name</th>
              <th className="px-4 py-2.5 text-left font-medium">Type</th>
              <th className="px-4 py-2.5 text-left font-medium">Placement / Position</th>
              <th className="px-4 py-2.5 text-left font-medium">Dimensions</th>
              <th className="px-4 py-2.5 text-right font-medium">Fill Rate</th>
              <th className="px-4 py-2.5 text-right font-medium">CPM</th>
              <th className="px-4 py-2.5 text-right font-medium">Est. Daily Rev</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slots.map(slot => (
              <tr key={slot.id} className="group hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{slot.name}</td>
                <td className="px-4 py-3">
                  <SlotTypeBadge type={slot.type} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{slot.placement}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{slot.dimensions}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`tabular-nums font-medium ${slot.fillRate >= 70 ? 'text-emerald-600' : slot.fillRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {slot.fillRate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtINR(slot.cpm)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtINR(slot.estDailyRevenue)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${slot.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {slot.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleToggle(slot.id)}
                  >
                    {slot.status === 'Active' ? 'Pause' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Performance tab ───────────────────────────────────────────────────────────

const PERF_CAMPAIGNS = [...MOCK_CAMPAIGNS].sort((a, b) => b.impressions - a.impressions)

function PerformanceTab() {
  return (
    <div className="space-y-8">
      {/* Top stats */}
      <div className="grid grid-cols-6 gap-3">
        <StatCard label="Total Impressions" value="14,76,500" />
        <StatCard label="Total Clicks" value="36,060" />
        <StatCard label="Avg CTR" value="2.44%" />
        <StatCard label="Total Revenue" value="₹4,32,000" />
        <StatCard label="Active Campaigns" value="4" />
        <StatCard label="Fill Rate" value="58%" />
      </div>

      {/* Campaign breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Campaign Breakdown</h2>
          <span className="text-xs text-muted-foreground">Sorted by impressions</span>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Campaign</th>
                <th className="px-4 py-2.5 text-right font-medium">Impressions</th>
                <th className="px-4 py-2.5 text-right font-medium">Clicks</th>
                <th className="px-4 py-2.5 text-right font-medium">CTR</th>
                <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERF_CAMPAIGNS.map(c => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.advertiser}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(c.impressions)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNum(c.clicks)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{c.ctr}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtINR(c.spent)}</td>
                  <td className="px-4 py-3">
                    <CampaignStatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slot breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Slot Breakdown</h2>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Slot</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-right font-medium">Fill Rate</th>
                <th className="px-4 py-2.5 text-right font-medium">Est. Monthly Rev</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_SLOTS.map(slot => (
                <tr key={slot.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{slot.name}</td>
                  <td className="px-4 py-3">
                    <SlotTypeBadge type={slot.type} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`tabular-nums font-medium ${slot.fillRate >= 70 ? 'text-emerald-600' : slot.fillRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {slot.fillRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmtINR(slot.estDailyRevenue * 30)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

type Tab = 'campaigns' | 'slots' | 'performance'

const TAB_LABELS: Record<Tab, string> = {
  campaigns: 'Campaigns',
  slots: 'Ad Slots',
  performance: 'Performance',
}

export function AdsClient() {
  const [tab, setTab] = useState<Tab>('campaigns')

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Ads Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage advertising campaigns, placements, and performance
        </p>
      </div>

      {/* Tab strip */}
      <div className="border-b flex gap-0">
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'campaigns' && <CampaignsTab />}
      {tab === 'slots' && <AdSlotsTab />}
      {tab === 'performance' && <PerformanceTab />}
    </div>
  )
}
