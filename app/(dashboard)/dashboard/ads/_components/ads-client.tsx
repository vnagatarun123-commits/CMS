'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AD_POSITIONS, 
  MOCK_PACKAGES, 
  LOCATION_TREE, 
  MOCK_ADS, 
  Ad, 
  AdPosition, 
  AdPackage, 
  AdType, 
  AdStatus, 
  PackageTier,
  PackageRule
} from '@/lib/mock/ads-store'
import { 
  ChevronRight, X, Check, Play, PauseCircle, Clock, AlertCircle
} from 'lucide-react'

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN')
}

function fmtNum(n: number): string {
  if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString('en-IN')
}

// ── Badge Helpers ─────────────────────────────────────────────────────────────
function CampaignStatusBadge({ status }: { status: AdStatus }) {
  const cls =
    status === 'Active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Paused'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : status === 'Completed'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  )
}

function SlotTypeBadge({ type }: { type: AdType }) {
  const cls =
    type === 'Banner'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : type === 'Interstitial'
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : type === 'Native'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-orange-50 text-orange-700 border-orange-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {type}
    </span>
  )
}

// ── Mini Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1 hover:shadow-sm transition-all duration-200">
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Main Page Component ───────────────────────────────────────────────────────
type Tab = 'campaigns' | 'slots' | 'packages' | 'performance'

export function AdsClient() {
  const [tab, setTab] = useState<Tab>('campaigns')
  
  // State
  const [ads, setAds] = useState<Ad[]>(MOCK_ADS)
  const [packages, setPackages] = useState<AdPackage[]>(MOCK_PACKAGES)
  const [positions, setPositions] = useState<AdPosition[]>(AD_POSITIONS)
  
  // Drawer states
  const [isCreateAdOpen, setIsCreateAdOpen] = useState(false)
  const [isCreatePackageOpen, setIsCreatePackageOpen] = useState(false)

  // Filtering campaigns
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Create Ad Form State (4-step state)
  const [adStep, setAdStep] = useState(1)
  const [newAd, setNewAd] = useState({
    name: '',
    advertiser: '',
    type: 'Banner' as AdType,
    mediaUrl: '',
    selectedPositions: [] as string[],
    packageId: '',
    startDate: '',
    endDate: '',
    selectedLocations: [] as string[] // list of mandal IDs
  })

  // Create Package Form State
  const [newPkg, setNewPkg] = useState({
    name: '',
    tier: 'Bronze' as PackageTier,
    pricePerDay: 0,
    minDurationDays: 1,
    maxDurationDays: 30,
    maxSlots: 1,
    includedPositionIds: [] as string[],
    rules: ['']
  })

  // Calculated Days for Ad Creation
  const getDaysCount = () => {
    if (!newAd.startDate || !newAd.endDate) return 0
    const start = new Date(newAd.startDate)
    const end = new Date(newAd.endDate)
    const diff = end.getTime() - start.getTime()
    if (diff < 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  const getEstimatedCost = () => {
    const days = getDaysCount()
    if (days <= 0) return 0
    const pkg = packages.find(p => p.id === newAd.packageId)
    const rate = pkg ? pkg.pricePerDay : 300 // default custom rate placeholder
    return days * rate * Math.max(1, newAd.selectedPositions.length)
  }

  const handleToggleAdStatus = (id: string) => {
    setAds(prev =>
      prev.map(a => {
        if (a.id !== id) return a
        const next = a.status === 'Active' ? 'Paused' : 'Active'
        toast.success(`Ad status updated to ${next}`)
        return { ...a, status: next as AdStatus }
      })
    )
  }

  const handleBookSlot = (positionId: string) => {
    setPositions(prev =>
      prev.map(p => {
        if (p.id !== positionId) return p
        if (p.currentBookings >= p.maxAdsPerSlot) {
          toast.error('All slots for this position are currently booked!')
          return p
        }
        toast.success(`Booked slot successfully for ${p.name}`)
        return { ...p, currentBookings: p.currentBookings + 1 }
      })
    )
  }

  // Handle new ad submit
  const handleCreateAdSubmit = () => {
    if (!newAd.name || !newAd.advertiser || !newAd.startDate || !newAd.endDate) {
      toast.error('Please fill out all required fields')
      return
    }

    const createdAd: Ad = {
      id: 'a_' + Math.random().toString(36).substr(2, 9),
      name: newAd.name,
      advertiser: newAd.advertiser,
      type: newAd.type,
      status: 'Pending',
      budget: getEstimatedCost(),
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: '0.0%',
      startDate: newAd.startDate,
      endDate: newAd.endDate,
      packageId: newAd.packageId || null,
      positionIds: newAd.selectedPositions,
      locationIds: newAd.selectedLocations,
      estimatedCost: getEstimatedCost()
    }

    setAds(prev => [createdAd, ...prev])
    toast.success('Ad Campaign submitted for verification successfully!')
    setIsCreateAdOpen(false)
    // reset
    setNewAd({
      name: '',
      advertiser: '',
      type: 'Banner',
      mediaUrl: '',
      selectedPositions: [],
      packageId: '',
      startDate: '',
      endDate: '',
      selectedLocations: []
    })
    setAdStep(1)
  }

  // Handle new package submit
  const handleCreatePackageSubmit = () => {
    if (!newPkg.name || newPkg.pricePerDay <= 0) {
      toast.error('Please enter a valid package name and price per day')
      return
    }

    const rulesList: PackageRule[] = newPkg.rules
      .filter(r => r.trim() !== '')
      .map((r, i) => ({ id: `r_custom_${i}`, description: r }))

    const createdPackage: AdPackage = {
      id: 'pkg_' + Math.random().toString(36).substr(2, 9),
      name: newPkg.name,
      tier: newPkg.tier,
      pricePerDay: newPkg.pricePerDay,
      minDurationDays: newPkg.minDurationDays,
      maxDurationDays: newPkg.maxDurationDays,
      maxSlots: newPkg.maxSlots,
      includedPositionIds: newPkg.includedPositionIds,
      rules: rulesList,
      description: `Custom ${newPkg.tier} package designed with active rules.`,
      isActive: true
    }

    setPackages(prev => [...prev, createdPackage])
    toast.success('Ad Package created successfully!')
    setIsCreatePackageOpen(false)
    setNewPkg({
      name: '',
      tier: 'Bronze',
      pricePerDay: 0,
      minDurationDays: 1,
      maxDurationDays: 30,
      maxSlots: 1,
      includedPositionIds: [],
      rules: ['']
    })
  }

  // Filter ads
  const filteredAds = ads.filter(a => {
    const matchSearch = 
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.advertiser.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    const matchType = typeFilter === 'all' || a.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header & Tabs Group ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Ads Manager</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure positions, manage bookings, rule-based packages and regional targeting.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setIsCreatePackageOpen(true)} className="text-xs cursor-pointer h-8.5 rounded-lg">
              Create Package
            </Button>
            <Button size="sm" onClick={() => { setIsCreateAdOpen(true); setAdStep(1); }} className="text-xs cursor-pointer h-8.5 rounded-lg">
              + Book Ad Campaign
            </Button>
          </div>
        </div>

        {/* ── Tab Selector ── */}
        <div className="flex border-b border-border gap-2">
        {(['campaigns', 'slots', 'packages', 'performance'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-5 py-3 text-xs font-semibold border-b-2 -mb-px transition-all duration-150 cursor-pointer',
              tab === t
                ? 'border-foreground text-foreground font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>

      {/* ── CAMPAIGNS TAB ── */}
      {tab === 'campaigns' && (
        <div className="space-y-5">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Ads" value={String(ads.length)} />
            <StatCard label="Active Campaigns" value={String(ads.filter(a => a.status === 'Active').length)} />
            <StatCard label="Pending Approval" value={String(ads.filter(a => a.status === 'Pending').length)} />
            <StatCard label="Total Cost Valuation" value={fmtINR(ads.reduce((acc, a) => acc + (a.budget || 0), 0))} />
          </div>

          {/* Filtering */}
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Search campaign name or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs text-xs h-9 rounded-lg"
            />
            <Select value={statusFilter} onValueChange={v => v && setStatusFilter(v)}>
              <SelectTrigger className="w-40 text-xs h-9 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => v && setTypeFilter(v)}>
              <SelectTrigger className="w-40 text-xs h-9 rounded-lg">
                <SelectValue placeholder="Ad Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Banner">Banner</SelectItem>
                <SelectItem value="Interstitial">Interstitial</SelectItem>
                <SelectItem value="Native">Native</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ads List Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground text-left">
                    <th className="px-4 py-3 font-semibold">Campaign / Advertiser</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Target Placements</th>
                    <th className="px-4 py-3 font-semibold">Locations</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold text-right">Budget</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAds.map(a => {
                    const activePkg = packages.find(p => p.id === a.packageId)
                    return (
                      <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground">{a.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{a.advertiser}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <SlotTypeBadge type={a.type} />
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {a.positionIds.map(pid => {
                              const pos = positions.find(p => p.id === pid)
                              return (
                                <Badge key={pid} variant="outline" className="text-[10px] px-1 py-0 border-border bg-muted/20">
                                  {pos ? pos.name : pid}
                                </Badge>
                              )
                            })}
                            {a.positionIds.length === 0 && <span className="text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {a.locationIds.length > 0 ? (
                            <span className="text-muted-foreground text-[11px]">{a.locationIds.length} target mandals</span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">All regions (Nationwide)</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                          <div className="font-medium text-foreground">{a.startDate}</div>
                          <div className="text-[10px]">to {a.endDate}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold tabular-nums text-foreground">
                          {fmtINR(a.budget)}
                          {activePkg && <div className="text-[10px] text-muted-foreground font-normal">{activePkg.name}</div>}
                        </td>
                        <td className="px-4 py-3.5">
                          <CampaignStatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {a.status !== 'Completed' && a.status !== 'Pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] font-semibold cursor-pointer"
                                onClick={() => handleToggleAdStatus(a.id)}
                              >
                                {a.status === 'Active' ? <PauseCircle className="h-3 w-3 mr-1 text-amber-500" /> : <Play className="h-3 w-3 mr-1 text-emerald-500" />}
                                {a.status === 'Active' ? 'Pause' : 'Resume'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] cursor-pointer"
                              onClick={() => toast.info(`Campaign: ${a.name}\nAdvertiser: ${a.advertiser}\nEstimated cost: ${fmtINR(a.budget)}`)}
                            >
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAds.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No ad campaigns match the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── AD SLOTS / PLACEMENTS TAB ── */}
      {tab === 'slots' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {positions.map(p => {
              const occupancyPct = Math.round((p.currentBookings / p.maxAdsPerSlot) * 100)
              const isFull = p.currentBookings >= p.maxAdsPerSlot
              
              return (
                <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{p.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.screen} · {p.dimensions}</p>
                      </div>
                      <Badge variant={isFull ? 'destructive' : 'outline'} className="text-[10px]">
                        {p.currentBookings}/{p.maxAdsPerSlot} Booked
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-muted-foreground">Occupancy Rate</span>
                      <span className="text-[11px] font-semibold text-foreground">{occupancyPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-400' : 'bg-primary'}`}
                        style={{ width: `${Math.min(occupancyPct, 100)}%` }} 
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs h-8 cursor-pointer"
                      disabled={isFull}
                      onClick={() => handleBookSlot(p.id)}
                    >
                      {isFull ? 'Sold Out' : 'Quick Book Slot'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PACKAGES TAB ── */}
      {tab === 'packages' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-foreground">{pkg.name}</h3>
                    <Badge className="text-[10px] uppercase font-semibold tracking-wider">
                      {pkg.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{pkg.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-semibold text-foreground">{pkg.pricePerDay > 0 ? `${fmtINR(pkg.pricePerDay)}/day` : 'Variable'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Allowed Slots:</span>
                      <span className="font-semibold text-foreground">Up to {pkg.maxSlots} placements</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Duration rule:</span>
                      <span className="font-semibold text-foreground">{pkg.minDurationDays}-{pkg.maxDurationDays} days</span>
                    </div>
                  </div>

                  {pkg.rules.length > 0 && (
                    <div className="mt-5 space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pricing Rules & Caps</p>
                      <ul className="space-y-1">
                        {pkg.rules.map(rule => (
                          <li key={rule.id} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{rule.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/60">
                  <Button 
                    size="sm" 
                    className="w-full text-xs h-8 cursor-pointer" 
                    variant="outline"
                    onClick={() => {
                      setNewAd(prev => ({ ...prev, packageId: pkg.id }))
                      setIsCreateAdOpen(true)
                      setAdStep(3)
                      toast.info(`Selected ${pkg.name}. Now set dates.`)
                    }}
                  >
                    Select Package
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PERFORMANCE TAB ── */}
      {tab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Impressions" value="1.4M" />
            <StatCard label="Total Clicks" value="36.1K" />
            <StatCard label="Avg. Click Rate" value="2.44%" />
            <StatCard label="Gross Revenue" value="₹4.3L" />
            <StatCard label="Placements Active" value="10" />
            <StatCard label="Network Fill Rate" value="72%" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Ad Slot Analytics Overview</h3>
            <div className="space-y-3.5">
              {positions.slice(0, 5).map(pos => {
                const clickRate = (Math.random() * 3 + 1).toFixed(2)
                const rev = Math.round(Math.random() * 20000 + 5000)
                return (
                  <div key={pos.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-xs text-foreground">{pos.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pos.screen}</p>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <p className="text-[10px] text-muted-foreground">CTR</p>
                        <p className="text-xs font-semibold text-foreground">{clickRate}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Est. Rev</p>
                        <p className="text-xs font-bold text-foreground">{fmtINR(rev)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          CREATE AD DRAWER (SHEET)
      ══════════════════════════════ */}
      <Sheet open={isCreateAdOpen} onOpenChange={setIsCreateAdOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto duration-200">
          <SheetHeader>
            <SheetTitle>Book Ad Campaign</SheetTitle>
            <SheetDescription>
              Deploy a new rule-compliant advertisement banner or video.
            </SheetDescription>
          </SheetHeader>

          {/* Stepper indicators */}
          <div className="flex justify-between items-center my-5 text-[11px] text-muted-foreground px-1">
            <span className={adStep >= 1 ? 'font-bold text-foreground' : ''}>1. Basics</span>
            <ChevronRight className="h-3 w-3" />
            <span className={adStep >= 2 ? 'font-bold text-foreground' : ''}>2. Placement</span>
            <ChevronRight className="h-3 w-3" />
            <span className={adStep >= 3 ? 'font-bold text-foreground' : ''}>3. Budget & Package</span>
            <ChevronRight className="h-3 w-3" />
            <span className={adStep >= 4 ? 'font-bold text-foreground' : ''}>4. Targeting</span>
          </div>

          <Separator className="my-4" />

          {/* STEP 1: BASICS */}
          {adStep === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ad-name" className="text-xs">Campaign Name *</Label>
                <Input 
                  id="ad-name"
                  placeholder="e.g. Hyderabad Summer Bonanza" 
                  value={newAd.name}
                  onChange={e => setNewAd(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-advertiser" className="text-xs">Advertiser / Brand *</Label>
                <Input 
                  id="ad-advertiser"
                  placeholder="e.g. Reliance Digital" 
                  value={newAd.advertiser}
                  onChange={e => setNewAd(prev => ({ ...prev, advertiser: e.target.value }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-type" className="text-xs">Format Type</Label>
                <Select value={newAd.type} onValueChange={v => setNewAd(prev => ({ ...prev, type: v as AdType }))}>
                  <SelectTrigger id="ad-type" className="text-xs h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Banner">Standard Banner</SelectItem>
                    <SelectItem value="Interstitial">Interstitial (Full-screen)</SelectItem>
                    <SelectItem value="Native">Native Card (Feed layout)</SelectItem>
                    <SelectItem value="Video">Video Ad (Pre-roll)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-media" className="text-xs">Media/Banner URL</Label>
                <Input 
                  id="ad-media"
                  placeholder="https://example.com/assets/banner.png" 
                  value={newAd.mediaUrl}
                  onChange={e => setNewAd(prev => ({ ...prev, mediaUrl: e.target.value }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>

              <Button className="w-full mt-6 text-xs h-9 cursor-pointer" onClick={() => setAdStep(2)}>
                Next: Select Placements
              </Button>
            </div>
          )}

          {/* STEP 2: PLACEMENT */}
          {adStep === 2 && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground mb-3">
                Choose the locations/screens on the app/web where the ad should be visible:
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {positions.map(p => {
                  const isSelected = newAd.selectedPositions.includes(p.id)
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        setNewAd(prev => ({
                          ...prev,
                          selectedPositions: isSelected 
                            ? prev.selectedPositions.filter(id => id !== p.id)
                            : [...prev.selectedPositions, p.id]
                        }))
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-foreground bg-foreground/[0.02]'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">{p.name}</p>
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{p.screen} · Dimensions: {p.dimensions}</p>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2.5 mt-6">
                <Button variant="outline" className="w-full text-xs h-9 cursor-pointer" onClick={() => setAdStep(1)}>
                  Back
                </Button>
                <Button className="w-full text-xs h-9 cursor-pointer" onClick={() => setAdStep(3)}>
                  Next: Package & Pricing
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PACKAGE & DURATION */}
          {adStep === 3 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-select" className="text-xs">Billing Package Rule</Label>
                <Select value={newAd.packageId} onValueChange={v => setNewAd(prev => ({ ...prev, packageId: v || '' }))}>
                  <SelectTrigger id="pkg-select" className="text-xs h-9 rounded-lg">
                    <SelectValue placeholder="Select a pricing package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.pricePerDay > 0 ? `${fmtINR(p.pricePerDay)}/day` : 'Negotiable'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label htmlFor="start-date" className="text-xs">Start Date *</Label>
                  <Input 
                    id="start-date"
                    type="date" 
                    value={newAd.startDate}
                    onChange={e => setNewAd(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-xs h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end-date" className="text-xs">End Date *</Label>
                  <Input 
                    id="end-date"
                    type="date" 
                    value={newAd.endDate}
                    onChange={e => setNewAd(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-xs h-9 rounded-lg"
                  />
                </div>
              </div>

              {/* Dynamic Price Summary Box */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Selected placements:</span>
                  <span className="font-semibold text-foreground">{newAd.selectedPositions.length} position(s)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total booking days:</span>
                  <span className="font-semibold text-foreground">{getDaysCount()} day(s)</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xs pt-1">
                  <span className="font-medium text-foreground">Estimated Cost:</span>
                  <span className="font-bold text-foreground text-sm">{fmtINR(getEstimatedCost())}</span>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6">
                <Button variant="outline" className="w-full text-xs h-9 cursor-pointer" onClick={() => setAdStep(2)}>
                  Back
                </Button>
                <Button className="w-full text-xs h-9 cursor-pointer" onClick={() => setAdStep(4)}>
                  Next: Local Target Regions
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: GEOTARGETING & CONFIRMATION */}
          {adStep === 4 && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Select districts/mandals to narrow down the target audience (blank means nationwide/all):
              </p>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {LOCATION_TREE.map(state => (
                  <div key={state.id} className="space-y-1">
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">{state.name}</p>
                    <div className="pl-2 space-y-2">
                      {state.districts.map(dist => (
                        <div key={dist.id} className="space-y-1">
                          <p className="text-[11px] font-semibold text-muted-foreground">{dist.name}</p>
                          <div className="grid grid-cols-2 gap-1.5 pl-2">
                            {dist.mandals.map(m => {
                              const isChecked = newAd.selectedLocations.includes(m.id)
                              return (
                                <div 
                                  key={m.id} 
                                  onClick={() => {
                                    setNewAd(prev => ({
                                      ...prev,
                                      selectedLocations: isChecked
                                        ? prev.selectedLocations.filter(id => id !== m.id)
                                        : [...prev.selectedLocations, m.id]
                                    }))
                                  }}
                                  className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                                    isChecked ? 'border-foreground bg-foreground/[0.02]' : 'border-border'
                                  }`}
                                >
                                  <Checkbox checked={isChecked} className="pointer-events-none h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{m.name}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 mt-6">
                <Button variant="outline" className="w-full text-xs h-9 cursor-pointer" onClick={() => setAdStep(3)}>
                  Back
                </Button>
                <Button className="w-full text-xs h-9 cursor-pointer" onClick={handleCreateAdSubmit}>
                  Confirm & Book Ad
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ══════════════════════════════
          CREATE PACKAGE DRAWER (SHEET)
      ══════════════════════════════ */}
      <Sheet open={isCreatePackageOpen} onOpenChange={setIsCreatePackageOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto duration-200">
          <SheetHeader>
            <SheetTitle>Configure Pricing Package</SheetTitle>
            <SheetDescription>
              Create a new set of constraints, duration limits and slot prices.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-name" className="text-xs">Package Name *</Label>
              <Input 
                id="pkg-name" 
                placeholder="e.g. Regional Special Banner Pack" 
                value={newPkg.name}
                onChange={e => setNewPkg(prev => ({ ...prev, name: e.target.value }))}
                className="text-xs h-9 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-tier" className="text-xs">Package Tier</Label>
                <Select value={newPkg.tier} onValueChange={v => setNewPkg(prev => ({ ...prev, tier: v as PackageTier }))}>
                  <SelectTrigger id="pkg-tier" className="text-xs h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bronze">Bronze (Standard)</SelectItem>
                    <SelectItem value="Silver">Silver (Mid-tier)</SelectItem>
                    <SelectItem value="Gold">Gold (Premium)</SelectItem>
                    <SelectItem value="Custom">Custom Negotiated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg-price" className="text-xs">Price Per Day (₹) *</Label>
                <Input 
                  id="pkg-price"
                  type="number"
                  placeholder="500" 
                  value={newPkg.pricePerDay || ''}
                  onChange={e => setNewPkg(prev => ({ ...prev, pricePerDay: Number(e.target.value) }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-min" className="text-xs">Min Days</Label>
                <Input 
                  id="pkg-min"
                  type="number"
                  value={newPkg.minDurationDays}
                  onChange={e => setNewPkg(prev => ({ ...prev, minDurationDays: Number(e.target.value) }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-max" className="text-xs">Max Days</Label>
                <Input 
                  id="pkg-max"
                  type="number"
                  value={newPkg.maxDurationDays}
                  onChange={e => setNewPkg(prev => ({ ...prev, maxDurationDays: Number(e.target.value) }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-slots" className="text-xs">Max Slots</Label>
                <Input 
                  id="pkg-slots"
                  type="number"
                  value={newPkg.maxSlots}
                  onChange={e => setNewPkg(prev => ({ ...prev, maxSlots: Number(e.target.value) }))}
                  className="text-xs h-9 rounded-lg"
                />
              </div>
            </div>

            {/* Custom Rules Creation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Pricing Rules & Limitations</Label>
                <button 
                  type="button"
                  onClick={() => setNewPkg(prev => ({ ...prev, rules: [...prev.rules, ''] }))}
                  className="text-[10px] text-foreground font-bold hover:underline cursor-pointer"
                >
                  + Add rule line
                </button>
              </div>
              <div className="space-y-2">
                {newPkg.rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <Input 
                      placeholder={`e.g. Rule #${idx + 1}`}
                      value={rule}
                      onChange={e => {
                        const val = e.target.value
                        setNewPkg(prev => {
                          const updated = [...prev.rules]
                          updated[idx] = val
                          return { ...prev, rules: updated }
                        })
                      }}
                      className="text-xs h-8 rounded-lg"
                    />
                    {newPkg.rules.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 cursor-pointer"
                        onClick={() => setNewPkg(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full mt-6 text-xs h-9 cursor-pointer" onClick={handleCreatePackageSubmit}>
              Create Package Ruleset
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
