'use client'

import { useState, useEffect, useTransition, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, Download, Plus, Pencil, CheckCircle, XCircle, Share2, Check,
  FileText, MapPin, SlidersHorizontal, GripVertical, Columns3,
  Image as ImageIcon, Video, Film, Eye, EyeOff, ChevronLeft, ChevronRight, X,
  Calendar, Globe, User, Tag, LayoutList, AlertCircle,
  ZoomIn, ZoomOut, RotateCcw, Maximize2,
  History, ArrowRightLeft, Trash2, Clock, SendHorizonal, Undo2,
} from 'lucide-react'

import type { Content, Category, Location, Language, AuditEntry } from '@/types/domain'
import { ContentStatus, ContentType } from '@/types/domain'
import { listContent, transitionContent, toggleContentVisibility, deleteContent } from '@/app/actions/content'
import { getContentActivity } from '@/app/actions/audit-log'
import { StatusBadge, contentStatusLabel } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLATFORMS, PlatformIcon, type ConnectedAccount, type PlatformId, formatFollowers } from '../../social-connect/_components/social-connect-client'

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CFG: Record<ContentType, { label: string; icon: React.ElementType; color: string }> = {
  IMAGE:   { label: 'Image',   icon: ImageIcon, color: 'bg-blue-50 text-blue-700 border-blue-200'       },
  VIDEO:   { label: 'Video',   icon: Video,     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHORT:   { label: 'Short',   icon: Film,      color: 'bg-pink-50 text-pink-700 border-pink-200'       },
  LIVE:    { label: 'Live',    icon: Video,     color: 'bg-red-50 text-red-700 border-red-200'           },
  YOUTUBE: { label: 'YouTube', icon: Video,     color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

const VISIBLE_TYPES: ContentType[] = [ContentType.IMAGE, ContentType.VIDEO, ContentType.SHORT]

// ── Social publish modal ──────────────────────────────────────────────────────

const MOCK_CONNECTED: ConnectedAccount[] = [
  { id: 'ca1', platformId: 'instagram', accountName: 'PuraLocal News',       accountHandle: '@puralocal_news',     accountType: 'Business',    avatarUrl: 'https://i.pravatar.cc/150?img=10', verified: true,  followers: 48200,  status: 'connected', active: true,  connectedAt: new Date(), lastSyncedAt: new Date(), expiresAt: null, autoPublish: true,  permissions: [] },
  { id: 'ca3', platformId: 'facebook',  accountName: 'PuraLocal — Official', accountHandle: 'PuraLocalNews',       accountType: 'News Page',   avatarUrl: 'https://i.pravatar.cc/150?img=30', verified: true,  followers: 94500,  status: 'connected', active: true,  connectedAt: new Date(), lastSyncedAt: new Date(), expiresAt: null, autoPublish: true,  permissions: [] },
  { id: 'ca5', platformId: 'youtube',   accountName: 'PuraLocal News',       accountHandle: '@puralocalnews',      accountType: 'Channel',     avatarUrl: 'https://i.pravatar.cc/150?img=40', verified: true,  followers: 124000, status: 'connected', active: true,  connectedAt: new Date(), lastSyncedAt: new Date(), expiresAt: null, autoPublish: true,  permissions: [] },
  { id: 'ca2', platformId: 'instagram', accountName: 'Hyderabad Breaking',   accountHandle: '@hyd_breaking',       accountType: 'Creator',     avatarUrl: 'https://i.pravatar.cc/150?img=22', verified: false, followers: 12600,  status: 'connected', active: false, connectedAt: new Date(), lastSyncedAt: new Date(), expiresAt: null, autoPublish: false, permissions: [] },
]

function SocialPublishModal({ item, onClose }: { item: Content; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(MOCK_CONNECTED.filter(a => a.autoPublish && a.active).map(a => a.id))
  )
  const [caption, setCaption] = useState(item.title)
  const [publishing, setPublishing] = useState(false)
  const [done, setDone] = useState(false)

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function publish() {
    if (selected.size === 0) return toast.error('Select at least one account')
    setPublishing(true)
    setTimeout(() => {
      setDone(true)
      setTimeout(() => {
        onClose()
        toast.success(`Published to ${selected.size} account${selected.size > 1 ? 's' : ''}`)
      }, 800)
    }, 1400)
  }

  const platformGroups = PLATFORMS.filter(p => MOCK_CONNECTED.some(a => a.platformId === p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget && !publishing) onClose() }}>
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-4 w-4 text-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Publish to Social Media</h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">{item.title}</p>
            </div>
          </div>
          {!publishing && (
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {done ? (
          <div className="px-8 py-10 flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-foreground">Published successfully!</p>
          </div>
        ) : publishing ? (
          <div className="px-8 py-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              {[...selected].map(id => {
                const acc = MOCK_CONNECTED.find(a => a.id === id)
                if (!acc) return null
                return (
                  <div key={id} className="h-10 w-10 rounded-full border-2 border-background ring-2 ring-muted overflow-hidden"
                    style={{ marginLeft: '-8px' }}>
                    {acc.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={acc.avatarUrl} alt={acc.accountName} className="h-full w-full object-cover" />
                      : <div className="h-full w-full bg-muted flex items-center justify-center"><span className="text-xs font-bold">{acc.accountName[0]}</span></div>}
                  </div>
                )
              })}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Publishing to {selected.size} account{selected.size > 1 ? 's' : ''}…</p>
              <p className="text-xs text-muted-foreground mt-0.5">Please wait</p>
            </div>
            <div className="w-48 bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-foreground rounded-full animate-[width_1.4s_ease-in-out_forwards]" style={{ width: '100%', transition: 'width 1.4s ease' }} />
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Caption / Post text</label>
              <textarea rows={3} value={caption} onChange={e => setCaption(e.target.value)}
                className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <p className="text-[11px] text-muted-foreground mt-1">{caption.length} chars · Article link will be appended automatically</p>
            </div>

            {/* Account selection by platform */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block">Select accounts</label>
              <div className="space-y-3">
                {platformGroups.map(platform => {
                  const platAccounts = MOCK_CONNECTED.filter(a => a.platformId === platform.id)
                  return (
                    <div key={platform.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <PlatformIcon id={platform.id} size={14} />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{platform.name}</span>
                      </div>
                      <div className="space-y-1.5 pl-5">
                        {platAccounts.map(acc => {
                          const sel = selected.has(acc.id)
                          const disabled = !acc.active || acc.status !== 'connected'
                          return (
                            <button key={acc.id} type="button" disabled={disabled}
                              onClick={() => toggle(acc.id)}
                              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all ${disabled ? 'opacity-40 cursor-not-allowed border-border' : sel ? 'border-emerald-300 bg-emerald-50/50 shadow-sm' : 'border-border hover:border-foreground/20 hover:bg-muted/20'}`}>
                              <div className="relative shrink-0">
                                {acc.avatarUrl
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={acc.avatarUrl} alt={acc.accountName} className="h-7 w-7 rounded-full object-cover border border-border" />
                                  : <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center"><span className="text-[10px] font-bold">{acc.accountName[0]}</span></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{acc.accountName}</p>
                                <p className="text-[11px] text-muted-foreground">{acc.accountHandle} · {formatFollowers(acc.followers)} followers</p>
                              </div>
                              {disabled && <span className="text-[10px] text-muted-foreground shrink-0">Inactive</span>}
                              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${sel && !disabled ? 'bg-emerald-500 border-emerald-500' : 'border-border'}`}>
                                {sel && !disabled && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border">
              <p className="text-[11px] text-muted-foreground">{selected.size} account{selected.size !== 1 ? 's' : ''} selected</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={selected.size === 0} onClick={publish}>
                  <Share2 className="h-3.5 w-3.5" />Publish Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: ContentType }) {
  const { label, icon: Icon, color } = TYPE_CFG[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  )
}

// ── Flag badge — single, highest-priority only ────────────────────────────────

function FlagBadge({ isBreakingNews, isTrending, isFeatured }: {
  isBreakingNews: boolean; isTrending: boolean; isFeatured: boolean
}) {
  if (isBreakingNews) {
    return (
      <span className="inline-block text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-px bg-red-100 text-red-700 leading-tight">
        Breaking
      </span>
    )
  }
  if (isTrending) {
    return (
      <span className="inline-block text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-px bg-orange-100 text-orange-700 leading-tight">
        Trending
      </span>
    )
  }
  if (isFeatured) {
    return (
      <span className="inline-block text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-px bg-amber-100 text-amber-700 leading-tight">
        Featured
      </span>
    )
  }
  return null
}

// ── Category badge ────────────────────────────────────────────────────────────

const CAT_PALETTES = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-orange-50 text-orange-700 border-orange-200',
]

function catColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return CAT_PALETTES[Math.abs(h) % CAT_PALETTES.length] ?? CAT_PALETTES[0]!
}

// ── Location path builder ─────────────────────────────────────────────────────

function buildLocationPath(locationId: string | null | undefined, locations: Location[]): string {
  if (!locationId) return '—'
  const path: string[] = []
  let id: string | null | undefined = locationId
  while (id) {
    const loc = locations.find(l => l.id === id)
    if (!loc) break
    path.unshift(loc.name)
    id = loc.parentId
  }
  return path.length ? path.join(' › ') : '—'
}

// ── Reporter cell ─────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  'Senior Reporter': 'bg-indigo-100 text-indigo-700',
  'Staff Reporter':  'bg-sky-100 text-sky-700',
  'Contributor':     'bg-emerald-100 text-emerald-700',
  'Freelancer':      'bg-amber-100 text-amber-700',
}

function ReporterCell({ name, photoUrl, role }: { name: string; photoUrl?: string | null; role?: string | null }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  const roleColor = role ? (ROLE_COLORS[role] ?? 'bg-muted text-muted-foreground') : ''
  return (
    <div className="flex items-center gap-2 min-w-[130px]">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} width={28} height={28}
          className="h-7 w-7 rounded-full object-cover shrink-0 border border-border" />
      ) : (
        <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary border border-border">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate max-w-[90px]">{name}</p>
        {role && (
          <span className={`inline-block text-[9px] font-semibold rounded px-1.5 py-0 leading-4 mt-0.5 ${roleColor}`}>
            {role}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Thumbnail — uniform h-14 w-[72px] for all types ──────────────────────────

function Thumbnail({ type, url, title, onPreview }: {
  type: ContentType; url?: string | null; title: string; onPreview: () => void
}) {
  const { icon: Icon, color } = TYPE_CFG[type]

  if (url) {
    return (
      <button onClick={onPreview} type="button" title="Preview"
        className="h-14 w-[72px] shrink-0 overflow-hidden rounded bg-muted relative group cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-all">
          <Eye className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
        <div className="absolute bottom-0.5 left-0.5">
          <span className={`inline-flex items-center rounded px-0.5 py-px text-[7px] font-bold uppercase ${color} border`}>
            <Icon className="h-1.5 w-1.5" />
          </span>
        </div>
      </button>
    )
  }

  return (
    <button onClick={onPreview} type="button"
      className="h-14 w-[72px] shrink-0 rounded bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/70 group transition-colors">
      <Icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
    </button>
  )
}

// ── Reject reason dialog ──────────────────────────────────────────────────────

interface RejectDialogProps {
  content: Content
  toStatus: ContentStatus
  pending: boolean
  onConfirm: (note: string) => void
  onCancel: () => void
}

function RejectDialog({ content, toStatus, pending, onConfirm, onCancel }: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const label = toStatus === ContentStatus.NEEDS_CLARIFICATION ? 'Rejected' : 'Draft'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Reject — Move to {label}</h3>
          </div>
          <button onClick={onCancel}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{content.title}</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea rows={3}
              placeholder="Explain what needs to be changed or clarified…"
              value={reason} onChange={e => setReason(e.target.value)}
              disabled={pending} autoFocus
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none" />
            {reason.trim().length === 0 && (
              <p className="text-[11px] text-muted-foreground">A reason is required before rejecting.</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>Cancel</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={pending || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}>
            {pending ? 'Rejecting…' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Preview modal ─────────────────────────────────────────────────────────────

interface PreviewItem {
  type: ContentType
  thumbnailUrl?: string | null
  mediaUrl?: string | null
  title: string
  excerpt?: string | null
  tags?: string[]
  categoryName?: string | null
  locationId?: string | null
  languageName?: string | null
  reporterName?: string | null
  reporterPhotoUrl?: string | null
  reporterRole?: string | null
  status: ContentStatus
  scheduledAt?: Date | null
  isBreakingNews?: boolean
  isTrending?: boolean
  isFeatured?: boolean
  rejectionNote?: string | null
}

function PreviewModal({ item, locations, onClose }: {
  item: PreviewItem; locations: Location[]; onClose: () => void
}) {
  const { icon: TypeIcon } = TYPE_CFG[item.type]
  const isMedia = item.type === ContentType.VIDEO || item.type === ContentType.SHORT
  const isShort = item.type === ContentType.SHORT
  const locationPath = buildLocationPath(item.locationId, locations)
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const adjustZoom = useCallback((delta: number) =>
    setZoom(z => Math.max(1, Math.min(4, Math.round((z + delta) * 10) / 10))), [])

  // Fullscreen image overlay
  if (fullscreen && item.thumbnailUrl) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black animate-in fade-in duration-150"
        onClick={() => setFullscreen(false)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.thumbnailUrl} alt={item.title}
          className="max-w-full max-h-full object-contain select-none"
          onClick={e => e.stopPropagation()} draggable={false} />
        <button onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">Click anywhere to close</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}>
      <div className="relative w-full bg-background rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        style={{ maxWidth: isShort ? 380 : 900, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
            <FlagBadge isBreakingNews={!!item.isBreakingNews} isTrending={!!item.isTrending} isFeatured={!!item.isFeatured} />
          </div>
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className={`overflow-hidden ${isShort ? 'flex flex-col' : 'flex'}`} style={{ minHeight: 0, maxHeight: 'calc(90vh - 52px)' }}>
          {/* ── Media area ── */}
          {isShort ? (
            /* SHORT: portrait video, full-width */
            <div className="bg-neutral-950 w-full flex items-center justify-center shrink-0">
              {item.mediaUrl ? (
                <video src={item.mediaUrl} controls preload="metadata"
                  className="w-full" style={{ maxHeight: 480, aspectRatio: '9/16' }} />
              ) : item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl} alt={item.title}
                  className="w-full object-contain" style={{ maxHeight: 480, aspectRatio: '9/16' }} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-white/30">
                  <TypeIcon className="h-10 w-10" />
                  <p className="text-xs">No media uploaded yet</p>
                </div>
              )}
            </div>
          ) : (
            /* VIDEO / IMAGE: landscape, two-column (media left, meta right) */
            <div className="flex overflow-hidden" style={{ minHeight: 0 }}>
              {/* left: media */}
              <div className="bg-neutral-950 flex items-center justify-center shrink-0" style={{ width: 520 }}>
                {isMedia && item.mediaUrl ? (
                  <video src={item.mediaUrl} controls preload="metadata"
                    className="w-full max-h-[400px] object-contain" />
                ) : isMedia && item.thumbnailUrl ? (
                  <div className="relative w-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnailUrl} alt={item.title}
                      className="w-full max-h-[400px] object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="h-14 w-14 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl">
                        <Video className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </div>
                ) : item.thumbnailUrl ? (
                  /* Zoomable image */
                  <div className="relative w-full group overflow-hidden flex items-center justify-center" style={{ maxHeight: 400 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnailUrl} alt={item.title}
                      className="w-full max-h-[400px] object-contain select-none transition-transform duration-200"
                      style={{ transform: `scale(${zoom})` }}
                      onWheel={e => { e.preventDefault(); adjustZoom(e.deltaY < 0 ? 0.1 : -0.1) }}
                      draggable={false}
                    />
                    {/* Controls */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => adjustZoom(-0.25)} className="h-5 w-5 flex items-center justify-center text-white hover:text-white/70">
                        <ZoomOut className="h-3 w-3" />
                      </button>
                      <span className="text-white text-[10px] tabular-nums w-8 text-center">{Math.round(zoom * 100)}%</span>
                      <button type="button" onClick={() => adjustZoom(0.25)} className="h-5 w-5 flex items-center justify-center text-white hover:text-white/70">
                        <ZoomIn className="h-3 w-3" />
                      </button>
                      <div className="w-px h-3 bg-white/30 mx-0.5" />
                      <button type="button" onClick={() => setZoom(1)} className="h-5 w-5 flex items-center justify-center text-white hover:text-white/70">
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Fullscreen button */}
                    <button type="button" onClick={() => setFullscreen(true)}
                      className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-md bg-black/50 backdrop-blur-sm text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute top-2 left-2 text-[10px] text-white/70 bg-black/40 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Scroll to zoom
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12 px-4 text-white/30">
                    <TypeIcon className="h-12 w-12" />
                    <p className="text-xs text-center">No media uploaded yet</p>
                  </div>
                )}
              </div>
              {/* right: meta */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-w-0">
                <PreviewMeta item={item} locationPath={locationPath} />
              </div>
            </div>
          )}

          {/* SHORT meta — scrollable below the video */}
          {isShort && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <PreviewMeta item={item} locationPath={locationPath} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PreviewMeta({ item, locationPath }: { item: PreviewItem; locationPath: string }) {
  return (
    <>
      <h2 className="text-base font-semibold text-foreground leading-snug">{item.title}</h2>

      {item.rejectionNote && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection reason</p>
            <p className="text-xs text-red-700 leading-relaxed">{item.rejectionNote}</p>
          </div>
        </div>
      )}

      {item.excerpt && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <LayoutList className="h-3 w-3" />Description
          </p>
          <p className="text-sm text-foreground leading-relaxed">{item.excerpt}</p>
        </div>
      )}

      {(item.tags?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Tag className="h-3 w-3" />Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(item.tags ?? []).map(tag => (
              <span key={tag} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border" />

      <div className="flex flex-col gap-2.5">
        <MetaRow icon={MapPin} label="Location"><span className="text-sm">{locationPath}</span></MetaRow>
        {item.categoryName && (
          <MetaRow icon={LayoutList} label="Category">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${catColor(item.categoryName)}`}>
              {item.categoryName}
            </span>
          </MetaRow>
        )}
        {item.languageName && (
          <MetaRow icon={Globe} label="Language"><span className="text-sm">{item.languageName}</span></MetaRow>
        )}
        {item.reporterName && (
          <MetaRow icon={User} label="Reporter">
            <div className="flex items-center gap-2">
              {item.reporterPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.reporterPhotoUrl} alt={item.reporterName} width={20} height={20}
                  className="h-5 w-5 rounded-full object-cover border border-border" />
              )}
              <span className="text-sm">{item.reporterName}</span>
              {item.reporterRole && (
                <span className={`text-[9px] font-semibold rounded px-1.5 py-px ${ROLE_COLORS[item.reporterRole] ?? 'bg-muted text-muted-foreground'}`}>
                  {item.reporterRole}
                </span>
              )}
            </div>
          </MetaRow>
        )}
        {item.scheduledAt && (
          <MetaRow icon={Calendar} label="Scheduled">
            <span className="text-sm text-amber-700 font-medium">
              {new Date(item.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </MetaRow>
        )}
      </div>
    </>
  )
}

function MetaRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex items-center gap-1.5 w-20 shrink-0 mt-0.5">
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ── Activity modal ────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'content.created':      { label: 'Uploaded',          icon: History,         color: 'bg-blue-100 text-blue-600'    },
  'content.updated':      { label: 'Edited',             icon: Pencil,          color: 'bg-amber-100 text-amber-600'  },
  'content.transitioned': { label: 'Status changed',     icon: ArrowRightLeft,  color: 'bg-violet-100 text-violet-600'},
  'content.published':    { label: 'Published',          icon: CheckCircle,     color: 'bg-emerald-100 text-emerald-600'},
  'content.scheduled':    { label: 'Scheduled',          icon: Clock,           color: 'bg-amber-100 text-amber-600'  },
  'content.deleted':      { label: 'Deleted',            icon: Trash2,          color: 'bg-red-100 text-red-600'      },
}

function eventLabel(entry: AuditEntry): string {
  const meta = entry.metadata
  if (entry.action === 'content.transitioned') {
    const from = meta.from as string | undefined
    const to   = meta.to   as string | undefined
    if (from && to) return `${from} → ${to}`
  }
  if (entry.action === 'content.updated') {
    const fields = meta.fields as string[] | undefined
    if (fields?.length) return `Edited: ${fields.join(', ')}`
  }
  if (entry.action === 'content.scheduled') {
    const at = meta.scheduledAt as string | undefined
    if (at) return `Scheduled for ${new Date(at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`
  }
  return ACTION_META[entry.action]?.label ?? entry.action
}

function eventNote(entry: AuditEntry): string | null {
  const note = entry.metadata.note as string | null | undefined
  return note || null
}

function ActivityModal({ contentId, contentTitle, onClose }: {
  contentId: string
  contentTitle: string
  onClose: () => void
}) {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    getContentActivity(contentId).then(result => {
      if (result.ok) setEntries(result.data)
      else setError(result.error.message)
    })
  }, [contentId])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <History className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Activity</p>
              <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">{contentTitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-600 py-6 justify-center">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          ) : entries === null ? (
            <div className="space-y-3 py-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <History className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            </div>
          ) : (
            <ol className="relative">
              {entries.map((entry, idx) => {
                const cfg   = ACTION_META[entry.action] ?? { label: entry.action, icon: History, color: 'bg-muted text-muted-foreground' }
                const Icon  = cfg.icon
                const label = eventLabel(entry)
                const note  = eventNote(entry)
                const isLast = idx === entries.length - 1
                const d = new Date(entry.createdAt)
                const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

                return (
                  <li key={entry.id} className="flex gap-3 pb-5 relative">
                    {/* Vertical line */}
                    {!isLast && (
                      <div className="absolute left-3.5 top-7 bottom-0 w-px bg-border" />
                    )}

                    {/* Icon bubble */}
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${cfg.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            by <span className="font-medium text-foreground">{entry.actorName}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] text-muted-foreground whitespace-nowrap">{dateStr}</p>
                          <p className="text-[11px] text-muted-foreground whitespace-nowrap">{timeStr}</p>
                        </div>
                      </div>
                      {note && (
                        <div className="mt-1.5 rounded-md bg-muted/50 border border-border px-3 py-2">
                          <p className="text-xs text-foreground italic leading-relaxed">"{note}"</p>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Status tabs ───────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ContentStatus | '' }[] = [
  { label: 'Drafts',         value: ContentStatus.DRAFT },
  { label: 'Pending Review', value: ContentStatus.UNDER_REVIEW },
  { label: 'Scheduled',      value: ContentStatus.SCHEDULED },
  { label: 'Published',      value: ContentStatus.PUBLISHED },
  { label: 'Rejected',       value: ContentStatus.NEEDS_CLARIFICATION },
  { label: 'All Content',    value: '' },
]

const PAGE_SIZE = 10

// ── Column configuration ──────────────────────────────────────────────────────

type ColId = 'sno' | 'content' | 'type' | 'category' | 'location' | 'contributor' | 'status' | 'reason' | 'scheduled' | 'uploaded' | 'actions'
interface ColDef { id: ColId; label: string; visible: boolean }

const DEFAULT_COLS: ColDef[] = [
  { id: 'sno',       label: 'S.No',         visible: true },
  { id: 'content',   label: 'Content',      visible: true },
  { id: 'type',      label: 'Type',         visible: true },
  { id: 'category',  label: 'Category',     visible: true },
  { id: 'location',  label: 'Location',     visible: true },
  { id: 'contributor', label: 'Contributor',  visible: true },
  { id: 'status',    label: 'Status',       visible: true },
  { id: 'reason',    label: 'Reason',       visible: true },
  { id: 'scheduled', label: 'Scheduled At', visible: true },
  { id: 'uploaded',  label: 'Uploaded',     visible: true },
  { id: 'actions',   label: 'Actions',      visible: true },
]

function ColumnConfigPanel({ columns, onChange, onClose }: {
  columns: ColDef[]
  onChange: (cols: ColDef[]) => void
  onClose: () => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const LOCKED: ColId[] = ['content', 'sno']

  function handleDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return }
    const next = [...columns]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved!)
    onChange(next)
    setDragIdx(null); setOverIdx(null)
  }

  function handleDragEnd() { setDragIdx(null); setOverIdx(null) }

  return (
    <div className="absolute right-0 top-full mt-1.5 z-30 w-60 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/20">
        <p className="text-xs font-semibold text-foreground">Columns</p>
        <button onClick={onClose} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="px-3 pt-2 pb-1 text-[10px] text-muted-foreground">Drag to reorder</p>
      <div className="px-2 pb-2 flex flex-col gap-0.5 max-h-72 overflow-y-auto">
        {columns.map((col, idx) => {
          const locked = LOCKED.includes(col.id)
          const isDragging = dragIdx === idx
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
          return (
            <div key={col.id}
              draggable={!locked}
              onDragStart={e => handleDragStart(e, idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={[
                'flex items-center gap-2 rounded-lg px-2 py-1.5 select-none transition-colors',
                isDragging ? 'opacity-40' : '',
                isOver ? 'border-t-2 border-red-500' : '',
                locked ? 'opacity-60' : 'cursor-grab hover:bg-muted/50',
              ].join(' ')}>
              <GripVertical className={`h-3.5 w-3.5 shrink-0 ${locked ? 'text-transparent' : 'text-muted-foreground'}`} />
              <span className="flex-1 text-xs text-foreground">
                {col.label}
              </span>
              {locked && <span className="text-[9px] text-muted-foreground bg-muted rounded px-1">fixed</span>}
            </div>
          )
        })}
      </div>
      <div className="px-3 py-2 border-t border-border">
        <button onClick={() => onChange([...DEFAULT_COLS])}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          Reset to default
        </button>
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContentListClientProps {
  initialContent: Content[]
  categories: Category[]
  locations: Location[]
  languages: Language[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContentListClient({ initialContent, categories, locations, languages }: ContentListClientProps) {
  const router = useRouter()
  const [content, setContent]         = useState<Content[]>(initialContent)
  const [previewItem, setPreviewItem]   = useState<PreviewItem | null>(null)
  const [socialTarget, setSocialTarget] = useState<Content | null>(null)
  const [activityTarget, setActivityTarget] = useState<{ id: string; title: string } | null>(null)

  const [rejectTarget, setRejectTarget] = useState<{ item: Content; toStatus: ContentStatus } | null>(null)
  const [rejectPending, startRejectTransition] = useTransition()
  const [, startRefreshTransition] = useTransition()

  const [columns, setColumns]             = useState<ColDef[]>([...DEFAULT_COLS])
  const [showColPanel, setShowColPanel]   = useState(false)

  const [activeTab,      setActiveTab]      = useState<ContentStatus | ''>(ContentStatus.DRAFT)
  const [search,         setSearch]         = useState('')
  const [typeFilter,     setTypeFilter]     = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [page,           setPage]           = useState(1)

  const counts = useMemo(() => {
    const map: Record<string, number> = { '': content.length }
    for (const item of content) map[item.status] = (map[item.status] ?? 0) + 1
    return map
  }, [content])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return content.filter(item => {
      if (activeTab && item.status !== activeTab) return false
      if (typeFilter && item.type !== typeFilter) return false
      if (categoryFilter && item.categoryId !== categoryFilter) return false
      if (locationFilter && item.locationId !== locationFilter) return false
      if (q && !item.title.toLowerCase().includes(q) && !(item.excerpt ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [content, activeTab, search, typeFilter, categoryFilter, locationFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage  = Math.min(page, pageCount)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function switchTab(val: ContentStatus | '') { setActiveTab(val); setPage(1) }

  function refresh() {
    startRefreshTransition(async () => {
      const result = await listContent()
      if (result.ok) setContent(result.data)
    })
  }

  function handleToggleVisibility(item: Content) {
    const next = item.isVisibleInApp === false
    startRefreshTransition(async () => {
      const result = await toggleContentVisibility(item.id, next)
      if (result.ok) {
        setContent(prev => prev.map(c => c.id === item.id ? { ...c, isVisibleInApp: next } : c))
        toast.success(next ? 'Now visible in app' : 'Hidden from app')
      } else {
        toast.error(result.error.message)
      }
    })
  }

  function handleQuickApprove(item: Content) {
    startRefreshTransition(async () => {
      const result = await transitionContent({ contentId: item.id, toStatus: ContentStatus.PUBLISHED })
      if (result.ok) {
        toast.success('Published')
        setContent(prev => prev.map(c => c.id === item.id ? { ...c, status: ContentStatus.PUBLISHED } : c))
      } else {
        toast.error(result.error.message)
      }
    })
  }

  function handleSubmitReview(item: Content) {
    startRefreshTransition(async () => {
      const result = await transitionContent({ contentId: item.id, toStatus: ContentStatus.UNDER_REVIEW })
      if (result.ok) {
        toast.success('Submitted for review')
        setContent(prev => prev.map(c => c.id === item.id ? { ...c, status: ContentStatus.UNDER_REVIEW } : c))
      } else {
        toast.error(result.error.message)
      }
    })
  }

  function handleDirectPublish(item: Content) {
    startRefreshTransition(async () => {
      const result = await transitionContent({ contentId: item.id, toStatus: ContentStatus.PUBLISHED })
      if (result.ok) {
        toast.success('Published directly')
        setContent(prev => prev.map(c => c.id === item.id ? { ...c, status: ContentStatus.PUBLISHED } : c))
      } else {
        toast.error(result.error.message)
      }
    })
  }

  function handleDelete(item: Content) {
    toast(`Delete "${item.title}"?`, {
      action: {
        label: 'Delete',
        onClick: () => {
          startRefreshTransition(async () => {
            const result = await deleteContent(item.id)
            if (result.ok) {
              toast.success('Draft deleted')
              setContent(prev => prev.filter(c => c.id !== item.id))
            } else {
              toast.error(result.error.message)
            }
          })
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    })
  }

  function openReject(item: Content) {
    const toStatus = item.status === ContentStatus.NEEDS_CLARIFICATION
      ? ContentStatus.DRAFT
      : ContentStatus.NEEDS_CLARIFICATION
    setRejectTarget({ item, toStatus })
  }

  function handleRejectConfirm(note: string) {
    if (!rejectTarget) return
    const { item, toStatus } = rejectTarget
    startRejectTransition(async () => {
      const result = await transitionContent({ contentId: item.id, toStatus, note })
      if (result.ok) {
        toast.success(`Moved to ${contentStatusLabel(toStatus)}`)
        setContent(prev => prev.map(c =>
          c.id === item.id
            ? { ...c, status: toStatus, rejectionNote: toStatus === ContentStatus.NEEDS_CLARIFICATION ? note : null }
            : c
        ))
        setRejectTarget(null)
      } else {
        toast.error(result.error.message)
      }
    })
  }

  const hasFilters = !!(search || typeFilter || categoryFilter || locationFilter)
  function clearFilters() { setSearch(''); setTypeFilter(''); setCategoryFilter(''); setLocationFilter(''); setPage(1) }

  function openPreview(item: Content) {
    setPreviewItem({
      type: item.type, thumbnailUrl: item.thumbnailUrl, mediaUrl: item.mediaUrl,
      title: item.title, excerpt: item.excerpt, tags: item.tags,
      categoryName: item.categoryName, locationId: item.locationId,
      languageName: item.languageName, reporterName: item.reporterName,
      reporterPhotoUrl: item.reporterPhotoUrl, reporterRole: item.reporterRole,
      status: item.status, scheduledAt: item.scheduledAt,
      isBreakingNews: item.isBreakingNews, isTrending: item.isTrending, isFeatured: item.isFeatured,
      rejectionNote: item.rejectionNote,
    })
  }

  return (
    <>
      <div className="flex flex-col gap-0">

        {/* Header */}
        <div className="flex items-center justify-between px-1 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Content</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage all content across types and workflows.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm">
              <Download className="h-3.5 w-3.5" />Export
            </Button>
            <Button size="sm" className="h-9 gap-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push('/dashboard/content/new')}>
              <Plus className="h-3.5 w-3.5" />Add Content
            </Button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-0 border-b border-border mb-4 overflow-x-auto">
          {STATUS_TABS.map(tab => {
            const active = activeTab === tab.value
            const count  = counts[tab.value] ?? 0
            return (
              <button key={String(tab.value)} onClick={() => switchTab(tab.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
                  ${active ? 'border-red-600 text-red-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none
                  ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input placeholder="Search content…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-8 h-8 text-sm" />
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Types</option>
            {VISIBLE_TYPES.map(t => <option key={t} value={t}>{TYPE_CFG[t].label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Categories</option>
            {categories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(1) }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Locations</option>
            {locations.filter(l => l.active).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={clearFilters}>
              <SlidersHorizontal className="h-3 w-3 mr-1" />Clear
            </Button>
          )}
          {/* Column config button */}
          <div className="relative ml-auto">
            <Button variant="outline" size="sm"
              className={`h-8 gap-1.5 text-xs ${showColPanel ? 'border-red-500 text-red-600' : ''}`}
              onClick={() => setShowColPanel(p => !p)}>
              <Columns3 className="h-3.5 w-3.5" />Columns
            </Button>
            {showColPanel && (
              <ColumnConfigPanel
                columns={columns}
                onChange={setColumns}
                onClose={() => setShowColPanel(false)}
              />
            )}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border bg-card flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No content found</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {hasFilters ? 'Try adjusting your filters.' : 'No content in this status yet.'}
            </p>
            {!hasFilters && (
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push('/dashboard/content/new')}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Add Content
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {columns.filter(c => c.visible).map(col => {
                      const base = 'py-3 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide'
                      switch (col.id) {
                        case 'sno':       return <th key={col.id} className={`${base} text-center w-10`}>S.No</th>
                        case 'content':   return <th key={col.id} className={base} style={{ minWidth: 380 }}>Content</th>
                        case 'type':      return <th key={col.id} className={`${base} whitespace-nowrap`}>Type</th>
                        case 'category':  return <th key={col.id} className={`${base} whitespace-nowrap`}>Category</th>
                        case 'location':  return <th key={col.id} className={base}>Location</th>
                        case 'contributor': return <th key={col.id} className={base}>Contributor</th>
                        case 'status':    return <th key={col.id} className={`${base} whitespace-nowrap`}>Status</th>
                        case 'reason':    return <th key={col.id} className={base}>Reason</th>
                        case 'scheduled': return <th key={col.id} className={`${base} whitespace-nowrap`}>Scheduled At</th>
                        case 'uploaded':  return <th key={col.id} className={`${base} whitespace-nowrap`}>Uploaded</th>
                        case 'actions':   return <th key={col.id} className={base} style={{ minWidth: 96, width: 96 }}>Actions</th>
                        default: return null
                      }
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((item, idx) => (
                    <ContentRow
                      key={item.id}
                      item={item}
                      locations={locations}
                      columns={columns}
                      pageIndex={(safePage - 1) * PAGE_SIZE + idx + 1}
                      onEdit={() => router.push(`/dashboard/content/${item.id}/edit`)}
                      onApprove={() => handleQuickApprove(item)}
                      onReject={() => openReject(item)}
                      onPreview={() => openPreview(item)}
                      onSocialPublish={() => setSocialTarget(item)}
                      onToggleVisibility={() => handleToggleVisibility(item)}
                      onActivity={() => setActivityTarget({ id: item.id, title: item.title })}
                      onSubmitReview={() => handleSubmitReview(item)}
                      onDirectPublish={() => handleDirectPublish(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{' '}
                of <span className="font-medium text-foreground">{filtered.length}</span>
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                    label="Previous" icon={<ChevronLeft className="h-3.5 w-3.5" />} />
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
                  <PageBtn onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount}
                    label="Next" icon={<ChevronRight className="h-3.5 w-3.5" />} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectDialog
          content={rejectTarget.item}
          toStatus={rejectTarget.toStatus}
          pending={rejectPending}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {previewItem && (
        <PreviewModal item={previewItem} locations={locations} onClose={() => setPreviewItem(null)} />
      )}

      {socialTarget && (
        <SocialPublishModal item={socialTarget} onClose={() => setSocialTarget(null)} />
      )}

      {activityTarget && (
        <ActivityModal
          contentId={activityTarget.id}
          contentTitle={activityTarget.title}
          onClose={() => setActivityTarget(null)}
        />
      )}
    </>
  )
}

// ── Pagination button ─────────────────────────────────────────────────────────

function PageBtn({ onClick, disabled, label, icon }: {
  onClick: () => void; disabled: boolean; label: string; icon: React.ReactNode
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {icon}
    </button>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface ContentRowProps {
  item: Content
  locations: Location[]
  columns: ColDef[]
  pageIndex: number
  onEdit: () => void
  onApprove: () => void
  onReject: () => void
  onPreview: () => void
  onSocialPublish: () => void
  onToggleVisibility: () => void
  onActivity: () => void
  onSubmitReview: () => void
  onDirectPublish: () => void
  onDelete: () => void
}

function ContentRow({ item, locations, columns, pageIndex, onEdit, onApprove, onReject, onPreview, onSocialPublish, onToggleVisibility, onActivity, onSubmitReview, onDirectPublish, onDelete }: ContentRowProps) {
  const d    = new Date(item.createdAt)
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const s           = item.status
  const isDraft     = s === ContentStatus.DRAFT
  const isReview    = s === ContentStatus.UNDER_REVIEW
  const isRejected  = s === ContentStatus.NEEDS_CLARIFICATION
  const isScheduled = s === ContentStatus.SCHEDULED
  const isPublished = s === ContentStatus.PUBLISHED
  const isVisible   = item.isVisibleInApp !== false
  const locationPath = buildLocationPath(item.locationId, locations)

  function renderCell(col: ColDef) {
    switch (col.id) {

      case 'sno':
        return (
          <td key="sno" className="py-3 px-3 text-center text-xs text-muted-foreground tabular-nums w-10">
            {pageIndex}
          </td>
        )

      case 'content':
        return (
          <td key="content" className="py-3 px-3">
            <div className="flex items-center gap-3">
              <div className="w-[72px] shrink-0">
                <Thumbnail type={item.type} url={item.thumbnailUrl} title={item.title} onPreview={onPreview} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-sm leading-snug cursor-default" title={item.title}>
                  {item.title}
                </p>
                <div className="mt-1">
                  <FlagBadge isBreakingNews={item.isBreakingNews} isTrending={item.isTrending} isFeatured={item.isFeatured} />
                </div>
              </div>
            </div>
          </td>
        )

      case 'type':
        return <td key="type" className="py-3 px-3 whitespace-nowrap"><TypeBadge type={item.type} /></td>

      case 'category':
        return (
          <td key="category" className="py-3 px-3 whitespace-nowrap">
            {item.categoryName
              ? <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${catColor(item.categoryName)}`}>{item.categoryName}</span>
              : <span className="text-xs text-muted-foreground">—</span>}
          </td>
        )

      case 'location':
        return (
          <td key="location" className="py-3 px-3">
            {locationPath !== '—' ? (
              <div className="flex items-start gap-1 text-xs text-muted-foreground max-w-[160px]">
                <MapPin className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{locationPath}</span>
              </div>
            ) : <span className="text-xs text-muted-foreground">—</span>}
          </td>
        )

      case 'contributor':
        return (
          <td key="contributor" className="py-3 px-3">
            {item.reporterName
              ? <ReporterCell name={item.reporterName} photoUrl={item.reporterPhotoUrl} role={item.reporterRole} />
              : <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">P</div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-foreground font-medium leading-none">PuraLocal Official</span>
                    <span className="text-[9px] font-semibold bg-blue-100 text-blue-700 rounded px-1.5 py-px uppercase tracking-wide w-fit">ORG</span>
                  </div>
                </div>}
          </td>
        )

      case 'status':
        return <td key="status" className="py-3 px-3 whitespace-nowrap"><StatusBadge status={item.status} /></td>

      case 'reason':
        return (
          <td key="reason" className="py-3 px-3">
            {item.rejectionNote ? (
              <div className="flex items-start gap-1.5 max-w-[180px]" title={item.rejectionNote}>
                <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs text-red-600 leading-snug line-clamp-2">{item.rejectionNote}</span>
              </div>
            ) : <span className="text-xs text-muted-foreground">—</span>}
          </td>
        )

      case 'scheduled':
        return (
          <td key="scheduled" className="py-3 px-3 whitespace-nowrap">
            {item.scheduledAt ? (
              <div className="text-xs">
                <div className="text-amber-700 font-medium flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(item.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-muted-foreground text-[11px] ml-3.5">
                  {new Date(item.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ) : <span className="text-xs text-muted-foreground">—</span>}
          </td>
        )

      case 'uploaded':
        return (
          <td key="uploaded" className="py-3 px-3 whitespace-nowrap">
            <div className="text-xs text-muted-foreground">
              <div>{date}</div>
              <div className="text-[11px]">{time}</div>
            </div>
          </td>
        )

      case 'actions':
        return (
          <td key="actions" className="py-3 px-1" style={{ minWidth: 96, width: 96 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 28px)', gap: '2px' }}>
              {isDraft && <>
                <ActionIcon onClick={onEdit} title="Edit" icon={<Pencil className="h-3.5 w-3.5" />} cls="text-amber-500 hover:bg-amber-50" />
                <ActionIcon onClick={onSubmitReview} title="Submit for Review" icon={<SendHorizonal className="h-3.5 w-3.5" />} cls="text-primary hover:bg-primary/10" />
                <ActionIcon onClick={onActivity} title="Activity" icon={<History className="h-3.5 w-3.5" />} cls="text-violet-500 hover:bg-violet-50" />
                <ActionIcon onClick={onDirectPublish} title="Publish Directly" icon={<CheckCircle className="h-3.5 w-3.5" />} cls="text-emerald-500 hover:bg-emerald-50" />
                <ActionIcon onClick={onDelete} title="Delete Draft" icon={<Trash2 className="h-3.5 w-3.5" />} cls="text-red-400 hover:bg-red-50 hover:text-red-600" />
              </>}
              {isReview && <>
                <ActionIcon onClick={onPreview} title="Preview" icon={<Eye className="h-3.5 w-3.5" />} cls="text-muted-foreground hover:text-foreground hover:bg-muted" />
                <ActionIcon onClick={onEdit} title="Edit" icon={<Pencil className="h-3.5 w-3.5" />} cls="text-amber-500 hover:bg-amber-50" />
                <ActionIcon onClick={onActivity} title="Activity" icon={<History className="h-3.5 w-3.5" />} cls="text-violet-500 hover:bg-violet-50" />
                <ActionIcon onClick={onApprove} title="Approve & Publish" icon={<CheckCircle className="h-3.5 w-3.5" />} cls="text-emerald-500 hover:bg-emerald-50" />
                <ActionIcon onClick={onReject} title="Needs Clarification" icon={<XCircle className="h-3.5 w-3.5" />} cls="text-orange-500 hover:bg-orange-50" />
              </>}
              {isRejected && <>
                <ActionIcon onClick={onPreview} title="Preview" icon={<Eye className="h-3.5 w-3.5" />} cls="text-muted-foreground hover:text-foreground hover:bg-muted" />
                <ActionIcon onClick={onEdit} title="Edit" icon={<Pencil className="h-3.5 w-3.5" />} cls="text-amber-500 hover:bg-amber-50" />
                <ActionIcon onClick={onActivity} title="Activity" icon={<History className="h-3.5 w-3.5" />} cls="text-violet-500 hover:bg-violet-50" />
                <ActionIcon onClick={onApprove} title="Approve & Publish" icon={<CheckCircle className="h-3.5 w-3.5" />} cls="text-emerald-500 hover:bg-emerald-50" />
                <ActionIcon onClick={onReject} title="Send Back to Draft" icon={<Undo2 className="h-3.5 w-3.5" />} cls="text-orange-400 hover:bg-orange-50" />
              </>}
              {isScheduled && <>
                <ActionIcon onClick={onPreview} title="Preview" icon={<Eye className="h-3.5 w-3.5" />} cls="text-muted-foreground hover:text-foreground hover:bg-muted" />
                <ActionIcon onClick={onEdit} title="Edit" icon={<Pencil className="h-3.5 w-3.5" />} cls="text-amber-500 hover:bg-amber-50" />
                <ActionIcon onClick={onActivity} title="Activity" icon={<History className="h-3.5 w-3.5" />} cls="text-violet-500 hover:bg-violet-50" />
                <ActionIcon onClick={onApprove} title="Publish Now" icon={<CheckCircle className="h-3.5 w-3.5" />} cls="text-emerald-500 hover:bg-emerald-50" />
              </>}
              {isPublished && <>
                <ActionIcon onClick={onPreview} title="Preview" icon={<Eye className="h-3.5 w-3.5" />} cls="text-muted-foreground hover:text-foreground hover:bg-muted" />
                <ActionIcon onClick={onActivity} title="Activity" icon={<History className="h-3.5 w-3.5" />} cls="text-violet-500 hover:bg-violet-50" />
                <ActionIcon onClick={onToggleVisibility}
                  title={isVisible ? 'Hide from app' : 'Make visible in app'}
                  icon={isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  cls={isVisible ? 'text-emerald-500 hover:bg-emerald-50' : 'text-orange-500 hover:bg-orange-50'} />
                <ActionIcon onClick={onSocialPublish} title="Publish to Social Media" icon={<Share2 className="h-3.5 w-3.5" />} cls="text-sky-500 hover:bg-sky-50" />
              </>}
            </div>
          </td>
        )

      default: return null
    }
  }

  return (
    <tr className="hover:bg-muted/20 transition-colors align-middle">
      {columns.filter(c => c.visible).map(col => renderCell(col))}
    </tr>
  )
}

// ── Action icon button ────────────────────────────────────────────────────────

function ActionIcon({ onClick, title, icon, cls }: {
  onClick: () => void; title: string; icon: React.ReactNode; cls: string
}) {
  return (
    <button onClick={onClick} title={title}
      className={`h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground transition-colors ${cls}`}>
      {icon}
    </button>
  )
}
