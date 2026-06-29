'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Plus, X, Check, Copy, Eye, EyeOff, Trash2, Edit2, ToggleLeft, ToggleRight,
  Upload, Link, Tv, Radio, Wifi, Clock, User,
  MapPin, ChevronDown, AlertCircle, ExternalLink, RefreshCw, StopCircle,
  PlayCircle, Settings, Key, Globe, Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SatelliteChannel {
  id: string
  name: string
  logo: string | null
  streamUrl: string
  category: string
  description: string
  active: boolean
  addedOn: Date
}

interface YoutubeChannel {
  id: string
  name: string
  youtubeUrl: string
  logo: string | null
  subscriberCount: string
  active: boolean
  addedOn: Date
}

type ReporterLiveStatus = 'pending' | 'live' | 'ended' | 'rejected'

interface ReporterLive {
  id: string
  reporterName: string
  reporterPhoto: string | null
  reporterRole: string
  title: string
  location: string
  startedAt: Date
  endedAt: Date | null
  status: ReporterLiveStatus
  streamUrl: string | null
  viewers: number
  rejectionReason: string | null
}

type RtmpStatus = 'offline' | 'live' | 'ended'

interface RtmpStream {
  id: string
  title: string
  description: string
  category: string
  rtmpUrl: string
  streamKey: string
  status: RtmpStatus
  viewers: number
  startedAt: Date | null
  createdAt: Date
}

type YoutubeLiveStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'

interface YoutubeLiveEvent {
  id: string
  title: string
  channelId: string
  channelName: string
  scheduledAt: Date
  youtubeStreamUrl: string
  status: YoutubeLiveStatus
  viewers: number
  description: string
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_SATELLITE: SatelliteChannel[] = [
  { id: 'sc1', name: 'TV9 Telugu',         logo: null, streamUrl: 'https://stream.tv9telugu.com/live', category: 'News',          description: 'Telugu news channel',          active: true,  addedOn: new Date('2025-01-10') },
  { id: 'sc2', name: 'NTV Telugu',          logo: null, streamUrl: 'https://live.ntvtelugu.com/hls',   category: 'News',          description: 'NTV 24x7 news stream',         active: true,  addedOn: new Date('2025-01-15') },
  { id: 'sc3', name: 'ABN Andhra Jyothi',  logo: null, streamUrl: 'https://abn.stream.live/ch1',      category: 'News',          description: 'Andhra Jyothi live stream',    active: false, addedOn: new Date('2025-02-01') },
  { id: 'sc4', name: 'Gemini TV',          logo: null, streamUrl: 'https://gemini.live/stream',        category: 'Entertainment', description: 'Gemini entertainment channel', active: true,  addedOn: new Date('2025-02-20') },
  { id: 'sc5', name: 'Zee Telugu',         logo: null, streamUrl: 'https://zeep.live/zeetelugu',       category: 'Entertainment', description: 'Zee Telugu HD stream',         active: true,  addedOn: new Date('2025-03-05') },
]

const SEED_YOUTUBE: YoutubeChannel[] = [
  { id: 'yc1', name: 'TV9 Telugu',        youtubeUrl: 'https://youtube.com/@tv9telugu',       logo: null, subscriberCount: '8.2M', active: true,  addedOn: new Date('2025-01-12') },
  { id: 'yc2', name: 'NTV Telugu',        youtubeUrl: 'https://youtube.com/@ntvtelugu',       logo: null, subscriberCount: '5.1M', active: true,  addedOn: new Date('2025-01-20') },
  { id: 'yc3', name: 'PuraLocal News',    youtubeUrl: 'https://youtube.com/@puralocalnews',   logo: null, subscriberCount: '124K', active: true,  addedOn: new Date('2025-04-01') },
  { id: 'yc4', name: 'Telangana Today',   youtubeUrl: 'https://youtube.com/@telanganatoday', logo: null, subscriberCount: '2.3M', active: false, addedOn: new Date('2025-04-10') },
]

const SEED_REPORTER_LIVE: ReporterLive[] = [
  { id: 'rl1', reporterName: 'Ramesh Kumar',  reporterPhoto: 'https://i.pravatar.cc/150?img=12', reporterRole: 'Senior Reporter', title: 'Breaking: Fire at Dilsukhnagar Market',         location: 'Hyderabad, Telangana',   startedAt: new Date('2025-06-26T10:15:00'), endedAt: null,                            status: 'pending',  streamUrl: 'rtmp://app.puralocal.com/live/rk_001', viewers: 0,   rejectionReason: null },
  { id: 'rl2', reporterName: 'Preethi Mehta', reporterPhoto: 'https://i.pravatar.cc/150?img=44', reporterRole: 'Staff Reporter',  title: 'Live: Mumbai Monsoon Flooding — Western Line',  location: 'Mumbai, Maharashtra',    startedAt: new Date('2025-06-26T09:30:00'), endedAt: null,                            status: 'live',     streamUrl: 'rtmp://app.puralocal.com/live/pm_002', viewers: 1423, rejectionReason: null },
  { id: 'rl3', reporterName: 'Vijay Kumar',   reporterPhoto: 'https://i.pravatar.cc/150?img=52', reporterRole: 'Staff Reporter',  title: 'ORR Traffic Update — Weekend Closure',         location: 'Bengaluru, Karnataka',   startedAt: new Date('2025-06-25T14:00:00'), endedAt: new Date('2025-06-25T15:30:00'), status: 'ended',    streamUrl: null,                                   viewers: 892, rejectionReason: null },
  { id: 'rl4', reporterName: 'Kiran Babu',    reporterPhoto: 'https://i.pravatar.cc/150?img=68', reporterRole: 'Contributor',     title: 'Political Rally — Karimnagar',                  location: 'Karimnagar, Telangana',  startedAt: new Date('2025-06-25T11:00:00'), endedAt: new Date('2025-06-25T11:45:00'), status: 'rejected', streamUrl: null,                                   viewers: 0,   rejectionReason: 'Poor video quality. Background noise too high.' },
  { id: 'rl5', reporterName: 'Anitha Rajan',  reporterPhoto: 'https://i.pravatar.cc/150?img=5',  reporterRole: 'Contributor',     title: 'Chennai Water Level — Chembarambakkam',         location: 'Chennai, Tamil Nadu',    startedAt: new Date('2025-06-26T08:00:00'), endedAt: null,                            status: 'pending',  streamUrl: 'rtmp://app.puralocal.com/live/ar_005', viewers: 0,   rejectionReason: null },
]

const RTMP_BASE = 'rtmp://live.puralocal.com/stream'

const SEED_RTMP: RtmpStream[] = [
  { id: 'rt1', title: 'Morning Bulletin',         description: 'Daily 7AM news desk live',          category: 'News',          rtmpUrl: RTMP_BASE, streamKey: 'sk_7a3f91bc', status: 'live',    viewers: 3421, startedAt: new Date('2025-06-26T07:00:00'), createdAt: new Date('2025-06-20') },
  { id: 'rt2', title: 'Prime Time Evening News',  description: 'Evening 9PM prime time bulletin',   category: 'News',          rtmpUrl: RTMP_BASE, streamKey: 'sk_4d2e8c01', status: 'offline', viewers: 0,    startedAt: null,                            createdAt: new Date('2025-06-21') },
  { id: 'rt3', title: 'Weekend Special Coverage', description: 'Special investigative live segment', category: 'Special',       rtmpUrl: RTMP_BASE, streamKey: 'sk_9f1a47de', status: 'offline', viewers: 0,    startedAt: null,                            createdAt: new Date('2025-06-22') },
  { id: 'rt4', title: 'Sports Desk Live',         description: 'Live sports commentary and scores',  category: 'Sports',        rtmpUrl: RTMP_BASE, streamKey: 'sk_2b8c64fa', status: 'ended',   viewers: 1876, startedAt: new Date('2025-06-25T18:00:00'), createdAt: new Date('2025-06-23') },
]

const SEED_YT_LIVE: YoutubeLiveEvent[] = [
  { id: 'yl1', title: 'PuraLocal Daily News — Morning',  channelId: 'yc3', channelName: 'PuraLocal News', scheduledAt: new Date('2025-06-27T07:00:00'), youtubeStreamUrl: 'https://studio.youtube.com/video/abc123/livestreaming', status: 'scheduled', viewers: 0,    description: 'Daily morning news digest' },
  { id: 'yl2', title: 'Breaking News — Budget Session',  channelId: 'yc3', channelName: 'PuraLocal News', scheduledAt: new Date('2025-06-26T11:00:00'), youtubeStreamUrl: 'https://studio.youtube.com/video/def456/livestreaming', status: 'live',      viewers: 5240, description: 'Live budget session coverage' },
  { id: 'yl3', title: 'Telangana Elections Special',     channelId: 'yc1', channelName: 'TV9 Telugu',    scheduledAt: new Date('2025-06-25T09:00:00'), youtubeStreamUrl: 'https://studio.youtube.com/video/ghi789/livestreaming', status: 'ended',     viewers: 18230, description: 'Election results night coverage' },
]

// ── Reference lists ───────────────────────────────────────────────────────────

const CHANNEL_CATEGORIES = ['News', 'Entertainment', 'Sports', 'Business', 'Education', 'Special']
const CONTENT_CATEGORIES = ['News', 'Sports', 'Entertainment', 'Business', 'Special']

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    live:      'bg-red-50 text-red-700 border-red-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    offline:   'bg-gray-100 text-gray-500 border-gray-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    ended:     'bg-gray-100 text-gray-400 border-gray-200',
    rejected:  'bg-red-50 text-red-400 border-red-100',
    cancelled: 'bg-gray-100 text-gray-400 border-gray-200',
    active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive:  'bg-gray-100 text-gray-500 border-gray-200',
  }
  const labels: Record<string, string> = {
    live: 'Live', pending: 'Pending Approval', offline: 'Offline',
    scheduled: 'Scheduled', ended: 'Ended', rejected: 'Rejected',
    cancelled: 'Cancelled', active: 'Active', inactive: 'Inactive',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg[status] ?? 'bg-muted text-muted-foreground border-border'}`}>
      {status === 'live' && <LiveDot />}
      {labels[status] ?? status}
    </span>
  )
}

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} title={label}
      className="h-7 w-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function ChannelLogo({ name, logo, size = 'md' }: { name: string; logo: string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={name} className={`${sz} rounded-lg object-cover border border-border`} />
  }
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div className={`${sz} rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-white shrink-0`}>
      {initials}
    </div>
  )
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20">{footer}</div>
      </div>
    </div>
  )
}

// ── Reject live dialog ────────────────────────────────────────────────────────

function RejectLiveDialog({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <Modal title="Reject Live Stream" onClose={onCancel} footer={
      <>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
          disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Reject</Button>
      </>
    }>
      <p className="text-xs text-muted-foreground">Provide a reason for rejecting this live stream request.</p>
      <Field label="Rejection reason" required>
        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} autoFocus
          placeholder="e.g. Poor video quality, inappropriate content…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </Field>
    </Modal>
  )
}

// ── TAB 1: Satellite Channels ─────────────────────────────────────────────────

function SatelliteTab() {
  const [channels, setChannels] = useState<SatelliteChannel[]>(SEED_SATELLITE)
  const [showAdd, setShowAdd]   = useState(false)
  const [editItem, setEditItem] = useState<SatelliteChannel | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', streamUrl: '', category: '', description: '', logo: null as string | null })

  function resetForm() { setForm({ name: '', streamUrl: '', category: '', description: '', logo: null }) }

  function openEdit(ch: SatelliteChannel) {
    setForm({ name: ch.name, streamUrl: ch.streamUrl, category: ch.category, description: ch.description, logo: ch.logo })
    setEditItem(ch)
  }

  function save() {
    if (!form.name || !form.streamUrl) return toast.error('Name and Stream URL are required')
    if (editItem) {
      setChannels(prev => prev.map(c => c.id === editItem.id ? { ...c, ...form } : c))
      toast.success('Channel updated')
      setEditItem(null)
    } else {
      const newCh: SatelliteChannel = { id: `sc${Date.now()}`, ...form, active: true, addedOn: new Date() }
      setChannels(prev => [...prev, newCh])
      toast.success('Satellite channel added')
      setShowAdd(false)
    }
    resetForm()
  }

  const FormModal = () => (
    <Modal title={editItem ? 'Edit Channel' : 'Add Satellite Channel'}
      onClose={() => { setShowAdd(false); setEditItem(null); resetForm() }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setEditItem(null); resetForm() }}>Cancel</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={save}>
            {editItem ? 'Update' : 'Add Channel'}
          </Button>
        </>
      }>
      {/* Logo upload */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => logoRef.current?.click()}
          className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-red-300 flex items-center justify-center transition-colors group shrink-0">
          {form.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={form.logo} alt="logo" className="h-full w-full object-cover rounded-xl" />
            : <Upload className="h-5 w-5 text-gray-300 group-hover:text-red-400 transition-colors" />}
        </button>
        <div className="text-xs text-muted-foreground"><p className="font-medium">Channel Logo</p><p>PNG, JPG (Max. 2MB)</p></div>
        <input ref={logoRef} type="file" className="hidden" accept="image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, logo: URL.createObjectURL(f) })) }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Channel Name" required>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. TV9 Telugu" className="h-9 text-sm" />
        </Field>
        <Field label="Category" required>
          <SelectField value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={CHANNEL_CATEGORIES} placeholder="Select category" />
        </Field>
      </div>
      <Field label="Stream URL (HLS / RTMP)" required>
        <Input value={form.streamUrl} onChange={e => setForm(p => ({ ...p, streamUrl: e.target.value }))} placeholder="https://stream.example.com/live" className="h-9 text-sm" />
      </Field>
      <Field label="Description">
        <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Short description of the channel…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </Field>
    </Modal>
  )

  return (
    <div>
      <SectionHeader
        title="Satellite Channels"
        subtitle="Manage live satellite and cable TV channel streams"
        action={
          <Button size="sm" className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white" onClick={() => { resetForm(); setShowAdd(true) }}>
            <Plus className="h-3.5 w-3.5" />Add Channel
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Channel', 'Stream URL', 'Category', 'Added On', 'Status', 'Actions'].map(h => (
                <th key={h} className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {channels.map(ch => (
              <tr key={ch.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <ChannelLogo name={ch.name} logo={ch.logo} />
                    <div>
                      <p className="font-medium text-sm text-foreground">{ch.name}</p>
                      {ch.description && <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{ch.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">{ch.streamUrl}</span>
                    <CopyButton value={ch.streamUrl} label="Copy stream URL" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{ch.category}</span>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  {ch.addedOn.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 px-4"><StatusBadge status={ch.active ? 'active' : 'inactive'} /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, active: !c.active } : c))}
                      title={ch.active ? 'Deactivate' : 'Activate'}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      {ch.active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => openEdit(ch)} title="Edit"
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setChannels(prev => prev.filter(c => c.id !== ch.id)); toast.success('Channel removed') }} title="Delete"
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(showAdd || editItem) && <FormModal />}
    </div>
  )
}

// ── TAB 2: YouTube Channels ───────────────────────────────────────────────────

function YoutubeChannelsTab() {
  const [channels, setChannels] = useState<YoutubeChannel[]>(SEED_YOUTUBE)
  const [showAdd, setShowAdd]   = useState(false)
  const [editItem, setEditItem] = useState<YoutubeChannel | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', youtubeUrl: '', subscriberCount: '', logo: null as string | null })
  function resetForm() { setForm({ name: '', youtubeUrl: '', subscriberCount: '', logo: null }) }

  function openEdit(ch: YoutubeChannel) {
    setForm({ name: ch.name, youtubeUrl: ch.youtubeUrl, subscriberCount: ch.subscriberCount, logo: ch.logo })
    setEditItem(ch)
  }

  function save() {
    if (!form.name || !form.youtubeUrl) return toast.error('Name and YouTube URL are required')
    if (editItem) {
      setChannels(prev => prev.map(c => c.id === editItem.id ? { ...c, ...form } : c))
      toast.success('Channel updated'); setEditItem(null)
    } else {
      setChannels(prev => [...prev, { id: `yc${Date.now()}`, ...form, active: true, addedOn: new Date() }])
      toast.success('YouTube channel added'); setShowAdd(false)
    }
    resetForm()
  }

  const FormModal = () => (
    <Modal title={editItem ? 'Edit YouTube Channel' : 'Add YouTube Channel'}
      onClose={() => { setShowAdd(false); setEditItem(null); resetForm() }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setEditItem(null); resetForm() }}>Cancel</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={save}>{editItem ? 'Update' : 'Add Channel'}</Button>
        </>
      }>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => logoRef.current?.click()}
          className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-red-300 flex items-center justify-center transition-colors group shrink-0">
          {form.logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={form.logo} alt="logo" className="h-full w-full object-cover rounded-xl" />
            : <Video className="h-6 w-6 text-gray-300 group-hover:text-red-400 transition-colors" />}
        </button>
        <div className="text-xs text-muted-foreground"><p className="font-medium">Channel Logo</p><p>PNG, JPG (Max. 2MB)</p></div>
        <input ref={logoRef} type="file" className="hidden" accept="image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, logo: URL.createObjectURL(f) })) }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Channel Name" required>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. PuraLocal News" className="h-9 text-sm" />
        </Field>
        <Field label="Subscriber Count">
          <Input value={form.subscriberCount} onChange={e => setForm(p => ({ ...p, subscriberCount: e.target.value }))} placeholder="e.g. 124K" className="h-9 text-sm" />
        </Field>
      </div>
      <Field label="YouTube Channel URL" required>
        <Input value={form.youtubeUrl} onChange={e => setForm(p => ({ ...p, youtubeUrl: e.target.value }))} placeholder="https://youtube.com/@channelname" className="h-9 text-sm" />
      </Field>
    </Modal>
  )

  return (
    <div>
      <SectionHeader
        title="YouTube Channels"
        subtitle="Manage linked YouTube channels for live streaming and embedding"
        action={
          <Button size="sm" className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white" onClick={() => { resetForm(); setShowAdd(true) }}>
            <Plus className="h-3.5 w-3.5" />Add Channel
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4">
        {channels.map(ch => (
          <div key={ch.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <ChannelLogo name={ch.name} logo={ch.logo} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{ch.name}</p>
                    {ch.subscriberCount && <p className="text-[11px] text-muted-foreground">{ch.subscriberCount} subscribers</p>}
                  </div>
                  <StatusBadge status={ch.active ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Link className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-blue-600 truncate flex-1">{ch.youtubeUrl}</span>
                  <button onClick={() => window.open(ch.youtubeUrl, '_blank')} title="Open in YouTube"
                    className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-blue-600 transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border">
              <button onClick={() => setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, active: !c.active } : c))} title={ch.active ? 'Deactivate' : 'Activate'}
                className="h-7 px-2.5 flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                {ch.active ? <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                {ch.active ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => openEdit(ch)} title="Edit"
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setChannels(prev => prev.filter(c => c.id !== ch.id)); toast.success('Channel removed') }} title="Delete"
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => { resetForm(); setShowAdd(true) }}
          className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/20 flex flex-col items-center justify-center gap-2 p-8 transition-colors group min-h-[120px]">
          <Plus className="h-8 w-8 text-gray-300 group-hover:text-red-400 transition-colors" />
          <p className="text-xs font-medium text-muted-foreground group-hover:text-red-600 transition-colors">Add YouTube Channel</p>
        </button>
      </div>
      {(showAdd || editItem) && <FormModal />}
    </div>
  )
}

// ── TAB 3: Reporter Live ──────────────────────────────────────────────────────

const REPORTER_LIVE_TABS: { label: string; value: ReporterLiveStatus | 'all' }[] = [
  { label: 'Pending Approval', value: 'pending' },
  { label: 'Live Now',         value: 'live'    },
  { label: 'Ended',           value: 'ended'   },
  { label: 'Rejected',        value: 'rejected' },
]

function ReporterLiveTab() {
  const [streams, setStreams]         = useState<ReporterLive[]>(SEED_REPORTER_LIVE)
  const [activeFilter, setActiveFilter] = useState<ReporterLiveStatus | 'all'>('pending')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  const filtered = streams.filter(s => activeFilter === 'all' || s.status === activeFilter)
  const counts: Record<string, number> = {}
  for (const s of streams) counts[s.status] = (counts[s.status] ?? 0) + 1

  function approve(id: string) {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, status: 'live' as const } : s))
    toast.success('Live stream approved — now broadcasting')
  }

  function stop(id: string) {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, status: 'ended' as const, endedAt: new Date() } : s))
    toast.info('Live stream stopped')
  }

  function reject(id: string, reason: string) {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' as const, rejectionReason: reason } : s))
    setRejectTarget(null)
    toast.error('Live stream rejected')
  }

  return (
    <div>
      <SectionHeader title="Reporter Live" subtitle="Approve and manage live streams started by reporters in the field" />

      {/* Sub-filter tabs */}
      <div className="flex items-center gap-0 border-b border-border mb-5">
        {REPORTER_LIVE_TABS.map(tab => {
          const active = activeFilter === tab.value
          const count  = counts[tab.value] ?? 0
          return (
            <button key={tab.value} onClick={() => setActiveFilter(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
                ${active ? 'border-red-600 text-red-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 flex flex-col items-center justify-center text-center gap-2">
          <Radio className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No streams in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(stream => (
            <div key={stream.id}
              className={`rounded-xl border bg-card p-4 transition-colors ${stream.status === 'live' ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start gap-4">
                {/* Reporter avatar */}
                {stream.reporterPhoto
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={stream.reporterPhoto} alt={stream.reporterName} className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
                  : <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="h-5 w-5 text-muted-foreground" /></div>}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{stream.title}</p>
                        <StatusBadge status={stream.status} />
                        {stream.status === 'live' && (
                          <span className="text-xs font-bold text-red-600">{stream.viewers.toLocaleString()} watching</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <User className="h-3 w-3" />{stream.reporterName}
                          <span className="rounded px-1.5 py-px bg-muted text-[9px] font-semibold ml-1">{stream.reporterRole}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />{stream.location}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />{stream.startedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {stream.rejectionReason && (
                        <div className="flex items-start gap-1.5 mt-1.5 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
                          <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-600">{stream.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {stream.status === 'pending' && (
                        <>
                          <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs px-2.5"
                            onClick={() => approve(stream.id)}>
                            <PlayCircle className="h-3.5 w-3.5" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50 gap-1 text-xs px-2.5"
                            onClick={() => setRejectTarget(stream.id)}>
                            <X className="h-3.5 w-3.5" />Reject
                          </Button>
                        </>
                      )}
                      {stream.status === 'live' && (
                        <>
                          {stream.streamUrl && <CopyButton value={stream.streamUrl} label="Copy stream URL" />}
                          <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50 gap-1 text-xs px-2.5"
                            onClick={() => stop(stream.id)}>
                            <StopCircle className="h-3.5 w-3.5" />Stop
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectLiveDialog
          onConfirm={reason => reject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  )
}

// ── TAB 4: RTMP Streams ───────────────────────────────────────────────────────

function RtmpTab() {
  const [streams, setStreams] = useState<RtmpStream[]>(SEED_RTMP)
  const [showAdd, setShowAdd] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ title: '', description: '', category: '' })

  function resetForm() { setForm({ title: '', description: '', category: '' }) }

  function generateKey() {
    return 'sk_' + Math.random().toString(36).slice(2, 10)
  }

  function create() {
    if (!form.title || !form.category) return toast.error('Title and Category are required')
    const newStream: RtmpStream = {
      id: `rt${Date.now()}`, ...form,
      rtmpUrl: RTMP_BASE, streamKey: generateKey(),
      status: 'offline', viewers: 0, startedAt: null, createdAt: new Date(),
    }
    setStreams(prev => [newStream, ...prev])
    toast.success('RTMP stream created — configure your encoder with the stream key')
    setShowAdd(false); resetForm()
  }

  function toggleStatus(id: string) {
    setStreams(prev => prev.map(s => {
      if (s.id !== id) return s
      if (s.status === 'offline') return { ...s, status: 'live' as const, startedAt: new Date() }
      if (s.status === 'live')    return { ...s, status: 'ended' as const }
      return s
    }))
  }

  function toggleKey(id: string) { setShowKeys(p => ({ ...p, [id]: !p[id] })) }

  return (
    <div>
      <SectionHeader
        title="RTMP Streams"
        subtitle="Create RTMP endpoints for OBS, vMix, or any streaming encoder"
        action={
          <Button size="sm" className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white" onClick={() => { resetForm(); setShowAdd(true) }}>
            <Plus className="h-3.5 w-3.5" />Create Stream
          </Button>
        }
      />

      {/* RTMP server info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-5 flex items-center gap-3">
        <Settings className="h-4 w-4 text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-800">RTMP Ingest Server</p>
          <p className="text-xs text-blue-600 font-mono mt-0.5">{RTMP_BASE}</p>
        </div>
        <CopyButton value={RTMP_BASE} label="Copy RTMP server URL" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Stream', 'Stream Key', 'Category', 'Status', 'Viewers', 'Started', 'Actions'].map(h => (
                <th key={h} className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {streams.map(s => (
              <tr key={s.id} className={`hover:bg-muted/20 transition-colors ${s.status === 'live' ? 'bg-red-50/20' : ''}`}>
                <td className="py-3 px-4">
                  <p className="font-medium text-sm text-foreground">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{s.description}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded border border-border">
                      {showKeys[s.id] ? s.streamKey : '••••••••'}
                    </code>
                    <button onClick={() => toggleKey(s.id)} title={showKeys[s.id] ? 'Hide key' : 'Show key'}
                      className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      {showKeys[s.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <CopyButton value={s.streamKey} label="Copy stream key" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{s.category}</span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={s.status} /></td>
                <td className="py-3 px-4 text-xs text-foreground">
                  {s.status === 'live' ? <span className="font-semibold text-red-600">{s.viewers.toLocaleString()}</span> : '—'}
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  {s.startedAt ? s.startedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {s.status !== 'ended' && (
                      <button onClick={() => toggleStatus(s.id)}
                        title={s.status === 'offline' ? 'Start stream' : 'Stop stream'}
                        className={`h-7 px-2.5 flex items-center gap-1 rounded-md text-xs font-medium transition-colors border ${
                          s.status === 'live'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}>
                        {s.status === 'live' ? <><StopCircle className="h-3 w-3" />Stop</> : <><PlayCircle className="h-3 w-3" />Start</>}
                      </button>
                    )}
                    <button onClick={() => { setStreams(prev => prev.filter(x => x.id !== s.id)); toast.success('Stream deleted') }}
                      title="Delete" className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Create RTMP Stream" onClose={() => { setShowAdd(false); resetForm() }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetForm() }}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={create}>Create Stream</Button>
            </>
          }>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5"><Key className="h-3.5 w-3.5" />A stream key will be auto-generated</p>
            <p className="text-[11px] text-blue-600 mt-0.5">Use it in OBS → Stream → Service: Custom → Server: rtmp://live.puralocal.com/stream</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stream Title" required>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Morning Bulletin" className="h-9 text-sm" />
            </Field>
            <Field label="Category" required>
              <SelectField value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={CONTENT_CATEGORIES} placeholder="Select category" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this stream…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </Field>
        </Modal>
      )}
    </div>
  )
}

// ── TAB 5: YouTube Live ───────────────────────────────────────────────────────

function YoutubeLiveTab({ ytChannels }: { ytChannels: YoutubeChannel[] }) {
  const [events, setEvents] = useState<YoutubeLiveEvent[]>(SEED_YT_LIVE)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', channelId: '', scheduledAt: '', description: '' })
  function resetForm() { setForm({ title: '', channelId: '', scheduledAt: '', description: '' }) }

  function create() {
    if (!form.title || !form.channelId || !form.scheduledAt) return toast.error('Title, channel and scheduled time are required')
    const ch = ytChannels.find(c => c.id === form.channelId)
    const newEvent: YoutubeLiveEvent = {
      id: `yl${Date.now()}`, title: form.title,
      channelId: form.channelId, channelName: ch?.name ?? '—',
      scheduledAt: new Date(form.scheduledAt),
      youtubeStreamUrl: `https://studio.youtube.com/video/${Math.random().toString(36).slice(2, 9)}/livestreaming`,
      status: 'scheduled', viewers: 0, description: form.description,
    }
    setEvents(prev => [newEvent, ...prev])
    toast.success('YouTube Live event created')
    setShowAdd(false); resetForm()
  }

  function toggleStatus(id: string) {
    setEvents(prev => prev.map(e => {
      if (e.id !== id) return e
      if (e.status === 'scheduled') return { ...e, status: 'live' as const, viewers: Math.floor(Math.random() * 5000) }
      if (e.status === 'live')      return { ...e, status: 'ended' as const }
      return e
    }))
  }

  return (
    <div>
      <SectionHeader
        title="YouTube Live"
        subtitle="Create and manage YouTube Live events linked to your channels"
        action={
          <Button size="sm" className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white" onClick={() => { resetForm(); setShowAdd(true) }}>
            <Plus className="h-3.5 w-3.5" />Create Event
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Title', 'Channel', 'Scheduled At', 'Status', 'Viewers', 'Actions'].map(h => (
                <th key={h} className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map(ev => (
              <tr key={ev.id} className={`hover:bg-muted/20 transition-colors ${ev.status === 'live' ? 'bg-red-50/20' : ''}`}>
                <td className="py-3 px-4">
                  <p className="font-medium text-sm text-foreground">{ev.title}</p>
                  {ev.description && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{ev.description}</p>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Video className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <span className="text-xs text-foreground">{ev.channelName}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                  <div>{ev.scheduledAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  <div className="text-[11px]">{ev.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap"><StatusBadge status={ev.status} /></td>
                <td className="py-3 px-4 text-xs">
                  {ev.status === 'live' ? <span className="font-semibold text-red-600">{ev.viewers.toLocaleString()}</span> : '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {(ev.status === 'scheduled' || ev.status === 'live') && (
                      <button onClick={() => toggleStatus(ev.id)}
                        className={`h-7 px-2.5 flex items-center gap-1 rounded-md text-xs font-medium border transition-colors ${
                          ev.status === 'live' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}>
                        {ev.status === 'live' ? <><StopCircle className="h-3 w-3" />Stop</> : <><PlayCircle className="h-3 w-3" />Go Live</>}
                      </button>
                    )}
                    <button onClick={() => window.open(ev.youtubeStreamUrl, '_blank')} title="Open in YouTube Studio"
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setEvents(prev => prev.filter(e => e.id !== ev.id)); toast.success('Event removed') }}
                      title="Delete" className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Create YouTube Live Event" onClose={() => { setShowAdd(false); resetForm() }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetForm() }}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={create}>
                <Video className="h-3.5 w-3.5" />Create Event
              </Button>
            </>
          }>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Event Title" required>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Morning News Live" className="h-9 text-sm" />
            </Field>
            <Field label="YouTube Channel" required>
              <div className="relative">
                <select value={form.channelId} onChange={e => setForm(p => ({ ...p, channelId: e.target.value }))}
                  className="w-full h-9 appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="" disabled>Select channel</option>
                  {ytChannels.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </Field>
          </div>
          <Field label="Scheduled Date & Time" required>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Description">
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of the live event…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </Field>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <p className="text-[11px] text-amber-700 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 shrink-0" />
              A YouTube Studio link will be generated. Complete the live stream setup in YouTube Studio after creating.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type LiveTab = 'satellite' | 'youtube-channels' | 'reporter-live' | 'rtmp' | 'youtube-live'

const TABS: { id: LiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'satellite',        label: 'Satellite Channels', icon: Tv      },
  { id: 'youtube-channels', label: 'YouTube Channels',   icon: Video },
  { id: 'reporter-live',    label: 'Reporter Live',      icon: Radio   },
  { id: 'rtmp',             label: 'RTMP Streams',       icon: Wifi    },
  { id: 'youtube-live',     label: 'YouTube Live',       icon: PlayCircle },
]

export function LiveManagementClient() {
  const [activeTab, setActiveTab] = useState<LiveTab>('satellite')
  const [ytChannels] = useState<YoutubeChannel[]>(SEED_YOUTUBE)

  const liveCount = SEED_REPORTER_LIVE.filter(s => s.status === 'live').length
  const pendingCount = SEED_REPORTER_LIVE.filter(s => s.status === 'pending').length

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Live Management
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
                <LiveDot />{liveCount} live now
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage satellite channels, YouTube, RTMP streams and reporter live approvals
            {pendingCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {pendingCount} pending approval</span>}
          </p>
        </div>
        <button onClick={() => window.location.reload()} title="Refresh"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const active = activeTab === tab.id
          const Icon = tab.icon
          const isPending = tab.id === 'reporter-live' && pendingCount > 0
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
                ${active ? 'border-red-600 text-red-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
              {isPending && (
                <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">{pendingCount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'satellite'        && <SatelliteTab />}
        {activeTab === 'youtube-channels' && <YoutubeChannelsTab />}
        {activeTab === 'reporter-live'    && <ReporterLiveTab />}
        {activeTab === 'rtmp'             && <RtmpTab />}
        {activeTab === 'youtube-live'     && <YoutubeLiveTab ytChannels={ytChannels} />}
      </div>
    </div>
  )
}
