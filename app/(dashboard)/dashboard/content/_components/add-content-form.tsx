'use client'

import { useState, useTransition, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Image, Video, Upload, X, Zap, TrendingUp, Star,
  Mic, MicOff, Check, Monitor, ImageIcon, Smartphone,
  Calendar, Clock, MapPin, Tag, Globe, AlignLeft,
  Play, Volume2, VolumeX, Plus,
} from 'lucide-react'

import type { Category, Location, Language, Content } from '@/types/domain'
import { ContentType, ContentSource, ContentStatus, LocationLevel } from '@/types/domain'
import { createContent, updateContent } from '@/app/actions/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS: { label: string; sub: string }[] = [
  { label: 'Add Content',      sub: 'Post type & media'   },
  { label: 'Organize Content', sub: 'Category & location' },
  { label: 'Source & AI',      sub: 'Source & scheduling' },
]
type Step = 1 | 2 | 3

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm px-8 py-5 mb-6">
      <div className="flex items-center">
        {STEPS.map(({ label, sub }, i) => {
          const idx    = (i + 1) as Step
          const done   = idx < current
          const active = idx === current
          return (
            <div key={label} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all
                  ${done || active ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
                  {done ? <Check className="h-4 w-4" /> : idx}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className={`text-sm font-semibold leading-tight truncate ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{sub}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 rounded ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Shared style constants ────────────────────────────────────────────────────

const selectCls = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
const inputCls  = 'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
        ${value ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('')
  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || tags.includes(tag) || tags.length >= 20) return
    onChange([...tags, tag])
    setInput('')
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-9 rounded-md border border-input bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-medium">
          #{tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-destructive ml-0.5">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
        onBlur={() => addTag(input)}
        placeholder={tags.length === 0 ? 'Add tags and press enter…' : ''}
        className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
    </div>
  )
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void
}) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange}
      className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
        ${checked || indeterminate ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background'}`}>
      {checked && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
      {!checked && indeterminate && <div className="h-0.5 w-2 bg-white rounded-full" />}
    </button>
  )
}

// ── Language multi-select ─────────────────────────────────────────────────────

function LanguageSelect({ languages, selected, onChange }: {
  languages: Language[]; selected: string[]; onChange: (ids: string[]) => void
}) {
  const active = languages.filter(l => l.active)
  const allSelected = selected.length === active.length && active.length > 0

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      <label className="flex items-center gap-2.5 px-3 py-2 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors">
        <Checkbox checked={allSelected} indeterminate={selected.length > 0 && !allSelected}
          onChange={() => onChange(allSelected ? [] : active.map(l => l.id))} />
        <span className="text-sm font-medium text-foreground">Select All</span>
        {selected.length > 0 && <span className="ml-auto text-xs text-muted-foreground">{selected.length} selected</span>}
      </label>
      <div className="divide-y divide-border max-h-48 overflow-y-auto">
        {active.map(lang => (
          <label key={lang.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <Checkbox checked={selected.includes(lang.id)} onChange={() => toggle(lang.id)} />
            <span className="text-sm text-foreground">{lang.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Cascading location (4-level: State → District → Mandal → Village) ────────

interface LocationState {
  stateId:    string
  districtId: string
  mandalId:   string
  locationId: string
}

function LocationCascade({ locations, loc, onChange }: {
  locations:  Location[]
  loc:        LocationState
  onChange:   (next: LocationState) => void
}) {
  const states    = locations.filter(l => l.level === LocationLevel.STATE    && l.active)
  const districts = locations.filter(l => l.level === LocationLevel.DISTRICT && l.active && l.parentId === loc.stateId)
  const mandals   = locations.filter(l => l.level === LocationLevel.MANDAL   && l.active && l.parentId === loc.districtId)
  const villages  = locations.filter(l => l.level === LocationLevel.VILLAGE  && l.active && l.parentId === loc.mandalId)

  return (
    <div className="flex flex-col gap-3">
      <Field label="State" required>
        <select value={loc.stateId}
          onChange={e => onChange({ stateId: e.target.value, districtId: '', mandalId: '', locationId: '' })}
          className={selectCls}>
          <option value="">Select State</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>

      {loc.stateId && districts.length > 0 && (
        <Field label="District">
          <select value={loc.districtId}
            onChange={e => onChange({ ...loc, districtId: e.target.value, mandalId: '', locationId: '' })}
            className={selectCls}>
            <option value="">Select District</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      )}

      {loc.districtId && mandals.length > 0 && (
        <Field label="Mandal">
          <select value={loc.mandalId}
            onChange={e => onChange({ ...loc, mandalId: e.target.value, locationId: '' })}
            className={selectCls}>
            <option value="">Select Mandal</option>
            {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
      )}

      {loc.mandalId && villages.length > 0 && (
        <Field label="Village">
          <select value={loc.locationId}
            onChange={e => onChange({ ...loc, locationId: e.target.value })}
            className={selectCls}>
            <option value="">Select Village</option>
            {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
      )}
    </div>
  )
}

// ── Flags (deselectable radio buttons) ───────────────────────────────────────

type Flag = 'BREAKING_NEWS' | 'TRENDING' | 'FEATURED' | ''

const FLAG_OPTIONS: { value: Flag; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'BREAKING_NEWS', label: 'Breaking News', icon: Zap,       color: 'text-red-500'    },
  { value: 'TRENDING',      label: 'Trending',      icon: TrendingUp, color: 'text-orange-500' },
  { value: 'FEATURED',      label: 'Featured',      icon: Star,       color: 'text-yellow-500' },
]

function FlagRadio({ selected, onChange }: { selected: Flag; onChange: (v: Flag) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {FLAG_OPTIONS.map(({ value, label, icon: Icon, color }) => {
        const active = selected === value
        return (
          <button key={value} type="button"
            onClick={() => onChange(active ? '' : value)}
            className={`flex items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-left select-none transition-all
              ${active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/30'}`}>
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
              ${active ? 'border-primary' : 'border-muted-foreground/40'}`}>
              {active && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
            <span className="text-sm font-medium text-foreground">{label}</span>
            {active && <span className="ml-auto text-[10px] text-muted-foreground">click to remove</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Multi-image upload ────────────────────────────────────────────────────────

function MultiImageUploadArea({ urls, onFiles }: {
  urls:    string[]
  onFiles: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function acceptFiles(fileList: FileList) {
    const MAX_AT_ONCE = 4
    const remaining = 10 - urls.length
    if (remaining <= 0) { toast.error('Maximum 10 images'); return }
    const files = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, Math.min(MAX_AT_ONCE, remaining))
    if (!files.length) { toast.error('Please select image files (JPG, PNG, WebP)'); return }
    setUploading(true)
    const newUrls: string[] = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10 MB, skipped`); continue }
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'thumbnails')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error()
        const { url } = await res.json() as { url: string }
        newUrls.push(url)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    if (newUrls.length) onFiles([...urls, ...newUrls])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void acceptFiles(e.target.files)
  }

  function remove(idx: number) {
    onFiles(urls.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        multiple className="sr-only" onChange={handleChange} />

      {urls.length === 0 && !uploading ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 py-10 text-center cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors">
          <div className="h-12 w-12 rounded-full border border-border bg-background flex items-center justify-center shadow-sm">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Drag &amp; drop or click to upload</p>
            <p className="text-xs text-muted-foreground mt-0.5">Select up to 4 at once · Max 10 images total · JPG, PNG, WebP</p>
          </div>
          <Button type="button" variant="outline" size="sm">Upload Image</Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-semibold bg-primary/80 text-primary-foreground py-0.5">
                  Cover
                </span>
              )}
              <button type="button" onClick={() => remove(idx)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          {!uploading && urls.length < 10 && (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="h-20 w-20 rounded-lg border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground">
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Add</span>
            </button>
          )}
        </div>
      )}

      {urls.length > 0 && (
        <p className="text-[11px] text-muted-foreground">{urls.length}/10 image{urls.length > 1 ? 's' : ''} · first image is the cover</p>
      )}
    </div>
  )
}

// ── Video upload area ─────────────────────────────────────────────────────────

type ThumbnailMode = 'default' | 'screen' | 'upload'

function VideoUploadArea({ orientation, thumbnailMode, onThumbnailMode, onFile, initialVideoUrl, initialThumbUrl }: {
  orientation:     'PORTRAIT' | 'LANDSCAPE' | ''
  thumbnailMode:   ThumbnailMode
  onThumbnailMode: (m: ThumbnailMode) => void
  onFile:          (videoUrl: string | null, thumbUrl: string | null) => void
  initialVideoUrl?: string | null
  initialThumbUrl?: string | null
}) {
  const [videoUrl, setVideoUrl]   = useState<string | null>(initialVideoUrl ?? null)
  const [thumbUrl, setThumbUrl]   = useState<string | null>(initialThumbUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [muted, setMuted]         = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)

  const isPortrait  = orientation === 'PORTRAIT'
  const aspectClass = isPortrait ? 'aspect-[9/16] max-w-[180px]' : 'aspect-video w-full'

  async function acceptVideo(file: File) {
    if (!file.type.startsWith('video/')) { toast.error('Please select a video file'); return }
    if (file.size > 1024 * 1024 * 1024) { toast.error('Video must be under 1 GB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'videos')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const { url } = await res.json() as { url: string }
      setVideoUrl(url); onFile(url, thumbUrl)
    } catch {
      toast.error('Failed to upload video. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function acceptThumb(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return }
    const reader = new FileReader()
    reader.onload = e => {
      const url = e.target?.result as string
      setThumbUrl(url); onFile(videoUrl, url)
    }
    reader.readAsDataURL(file)
  }

  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) void acceptVideo(file)
  }

  function captureFrame() {
    const video = videoRef.current; if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const url = canvas.toDataURL('image/jpeg', 0.9)
    setThumbUrl(url); onThumbnailMode('screen'); onFile(videoUrl, url)
    toast.success('Frame captured as thumbnail')
  }

  function removeVideo() {
    setVideoUrl(null); setThumbUrl(null); onFile(null, null)
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  if (uploading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-12 text-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-foreground">Uploading video…</p>
        <p className="text-xs text-muted-foreground">This may take a moment for large files</p>
      </div>
    )
  }

  if (videoUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div className={`relative bg-black rounded-xl overflow-hidden border border-border ${isPortrait ? 'flex justify-center' : ''}`}>
          <div className={aspectClass}>
            <video ref={videoRef} src={videoUrl} controls muted={muted}
              className="w-full h-full object-contain" preload="metadata"
              onError={() => setVideoUrl(null)} />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button type="button" onClick={() => setMuted(m => !m)}
              className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors">
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={removeVideo}
              className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-foreground mb-2">Thumbnail</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {([
              { mode: 'default' as ThumbnailMode, label: 'Auto',    icon: ImageIcon, desc: 'First frame'   },
              { mode: 'screen'  as ThumbnailMode, label: 'Capture', icon: Monitor,   desc: 'Current frame' },
              { mode: 'upload'  as ThumbnailMode, label: 'Upload',  icon: Upload,    desc: 'Custom image'  },
            ] as const).map(({ mode, label, icon: Icon, desc }) => {
              const active = thumbnailMode === mode
              return (
                <button key={mode} type="button"
                  onClick={() => { onThumbnailMode(mode); if (mode === 'screen') captureFrame() }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all
                    ${active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/30'}`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </button>
              )
            })}
          </div>
          {thumbnailMode === 'upload' && (
            <div>
              <input ref={thumbInputRef} type="file" accept="image/*" className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) acceptThumb(f) }} />
              {thumbUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl} alt="Thumbnail" className="w-full aspect-video object-cover" />
                  <button type="button" onClick={() => { setThumbUrl(null); onFile(videoUrl, null) }}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => thumbInputRef.current?.click()}>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">JPG, PNG · Max 2 MB</p>
                  <Button type="button" variant="outline" size="sm" onClick={e => { e.stopPropagation(); thumbInputRef.current?.click() }}>Browse</Button>
                </div>
              )}
            </div>
          )}
          {thumbnailMode === 'screen' && thumbUrl && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl} alt="Captured frame" className="w-full aspect-video object-cover" />
              <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5">Captured frame</span>
            </div>
          )}
          {thumbnailMode === 'default' && (
            <div className="flex items-center justify-center rounded-xl border border-border bg-muted/10 py-2.5">
              <p className="text-xs text-muted-foreground">First frame used as thumbnail</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleVideoDrop}
      onClick={() => videoInputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 text-center cursor-pointer transition-colors
        ${dragging ? 'border-primary/60 bg-primary/5' : 'border-border bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/30'}`}>
      <input ref={videoInputRef} type="file" accept="video/mp4,video/mov,video/quicktime,video/webm"
        className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) void acceptVideo(f) }} />
      <div className={`h-12 w-12 rounded-full border flex items-center justify-center shadow-sm transition-colors
        ${dragging ? 'bg-primary/10 border-primary/40' : 'bg-background border-border'}`}>
        {isPortrait
          ? <Smartphone className={`h-5 w-5 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
          : <Video className={`h-5 w-5 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {isPortrait ? 'Upload Portrait Video' : 'Upload Video'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isPortrait ? '9:16 vertical · ' : '16:9 landscape · '}MP4, MOV · Max 1 GB
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={e => { e.stopPropagation(); videoInputRef.current?.click() }}>
        Choose File
      </Button>
    </div>
  )
}

// ── Preview card (Step 3 right panel) ────────────────────────────────────────

const TYPE_COLORS: Record<ContentType, string> = {
  [ContentType.IMAGE]:   'bg-blue-100 text-blue-700',
  [ContentType.VIDEO]:   'bg-purple-100 text-purple-700',
  [ContentType.SHORT]:   'bg-pink-100 text-pink-700',
  [ContentType.LIVE]:    'bg-red-100 text-red-700',
  [ContentType.YOUTUBE]: 'bg-red-100 text-red-700',
}

function PreviewCard({ form, categories, locations, resolvedLocationId, scheduleEnabled, scheduleDate, scheduleTime }: {
  form:                FormState
  categories:          Category[]
  locations:           Location[]
  resolvedLocationId:  string
  scheduleEnabled:     boolean
  scheduleDate:        string
  scheduleTime:        string
}) {
  const categoryName = categories.find(c => c.id === form.categoryId)?.name
  const locationName = locations.find(l => l.id === resolvedLocationId)?.name
  const flagOption   = FLAG_OPTIONS.find(f => f.value === form.flag)
  const isVideo      = form.type === ContentType.VIDEO || form.type === ContentType.SHORT
  const coverUrl     = form.type === ContentType.IMAGE ? (form.imageUrls[0] ?? null) : form.thumbnailUrl || null
  const typeLabel    = form.type === ContentType.SHORT
    ? (form.orientation === 'PORTRAIT' ? 'Short · Portrait' : form.orientation === 'LANDSCAPE' ? 'Short · Landscape' : 'Short')
    : form.type === ContentType.IMAGE ? 'Image Post' : 'Video Post'

  return (
    <div className="flex flex-col gap-3 h-full">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Live Preview</p>
      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col">
        <div className={`relative bg-muted flex items-center justify-center ${form.type === ContentType.SHORT && form.orientation === 'PORTRAIT' ? 'aspect-[9/16] max-h-52 overflow-hidden' : 'aspect-video'}`}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={form.title || 'Preview'} className="w-full h-full object-cover" />
          ) : (
            <Image className="h-10 w-10 text-muted-foreground/40" />
          )}
          <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[form.type]}`}>
            {typeLabel}
          </span>
          {flagOption && (
            <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold bg-background/90 rounded-full px-2 py-0.5 border border-border">
              <flagOption.icon className={`h-2.5 w-2.5 ${flagOption.color}`} />
              {flagOption.label}
            </span>
          )}
          {isVideo && form.mediaUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="h-10 w-10 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="h-5 w-5 text-white ml-0.5" />
              </div>
            </div>
          )}
          {form.type === ContentType.IMAGE && form.imageUrls.length > 1 && (
            <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded-full px-2 py-0.5">
              +{form.imageUrls.length - 1} more
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2.5">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {form.title || <span className="text-muted-foreground italic">No title yet…</span>}
          </h3>
          {form.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{form.excerpt}</p>}
          <div className="flex flex-col gap-1.5 pt-1">
            {categoryName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlignLeft className="h-3 w-3 shrink-0" /><span>{categoryName}</span>
              </div>
            )}
            {locationName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" /><span>{locationName}</span>
              </div>
            )}
            {form.languageIds.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3 shrink-0" />
                <span>{form.languageIds.length} language{form.languageIds.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {form.tags.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <Tag className="h-3 w-3 shrink-0" />
                {form.tags.slice(0, 3).map(t => <span key={t} className="bg-muted rounded px-1.5 py-0.5">#{t}</span>)}
                {form.tags.length > 3 && <span>+{form.tags.length - 3}</span>}
              </div>
            )}
            {scheduleEnabled && scheduleDate && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>Scheduled: {scheduleDate}{scheduleTime ? ` at ${scheduleTime}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-1
            ${scheduleEnabled && scheduleDate ? 'bg-amber-100 text-amber-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
            {scheduleEnabled && scheduleDate ? 'Scheduled' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/10 p-3 flex flex-col gap-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Checklist</p>
        {[
          { label: 'Title',    ok: form.title.trim().length > 0 },
          { label: 'Media',    ok: form.type === ContentType.IMAGE ? form.imageUrls.length > 0 : form.mediaUrl !== '' },
          { label: 'Category', ok: !!form.categoryId },
          { label: 'Location', ok: !!resolvedLocationId },
          { label: 'Language', ok: form.languageIds.length > 0 },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`}>
              {ok && <Check className="h-2 w-2 text-white stroke-[3]" />}
            </div>
            <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  type:            ContentType
  orientation:     'PORTRAIT' | 'LANDSCAPE' | ''
  title:           string
  excerpt:         string
  categoryId:      string
  languageIds:     string[]
  tags:            string[]
  flag:            Flag
  aiTranscription: boolean
  transcription:   string
  voice:           string
  mediaUrl:        string
  thumbnailUrl:    string
  imageUrls:       string[]
}

const initialForm: FormState = {
  type:            ContentType.IMAGE,
  orientation:     '',
  title:           '',
  excerpt:         '',
  categoryId:      '',
  languageIds:     [],
  tags:            [],
  flag:            '',
  aiTranscription: false,
  transcription:   '',
  voice:           '',
  mediaUrl:        '',
  thumbnailUrl:    '',
  imageUrls:       [],
}

// ── Resolve location cascade for edit pre-population ─────────────────────────

function resolveLocationCascade(locationId: string | null | undefined, locations: Location[]): LocationState {
  if (!locationId) return { stateId: '', districtId: '', mandalId: '', locationId: '' }
  const loc = locations.find(l => l.id === locationId)
  if (!loc) return { stateId: '', districtId: '', mandalId: '', locationId: '' }
  if (loc.level === LocationLevel.STATE)    return { stateId: loc.id, districtId: '', mandalId: '', locationId: '' }
  if (loc.level === LocationLevel.DISTRICT) {
    return { stateId: loc.parentId ?? '', districtId: loc.id, mandalId: '', locationId: '' }
  }
  if (loc.level === LocationLevel.MANDAL) {
    const district = locations.find(l => l.id === loc.parentId)
    return { stateId: district?.parentId ?? '', districtId: loc.parentId ?? '', mandalId: loc.id, locationId: '' }
  }
  // VILLAGE
  const mandal   = locations.find(l => l.id === loc.parentId)
  const district = locations.find(l => l.id === mandal?.parentId)
  return { stateId: district?.parentId ?? '', districtId: mandal?.parentId ?? '', mandalId: loc.parentId ?? '', locationId: loc.id }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddContentFormProps {
  categories:   Category[]
  locations:    Location[]
  languages:    Language[]
  editContent?: Content
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddContentForm({ categories, locations, languages, editContent }: AddContentFormProps) {
  const router = useRouter()
  const isEdit = Boolean(editContent)

  const initForm = (): FormState => editContent ? {
    type:            editContent.type,
    orientation:     (editContent.orientation ?? '') as 'PORTRAIT' | 'LANDSCAPE' | '',
    title:           editContent.title,
    excerpt:         editContent.excerpt ?? '',
    categoryId:      editContent.categoryId ?? '',
    languageIds:     editContent.languageId ? [editContent.languageId] : [],
    tags:            editContent.tags ?? [],
    flag:            editContent.isBreakingNews ? 'BREAKING_NEWS' : editContent.isTrending ? 'TRENDING' : editContent.isFeatured ? 'FEATURED' : '',
    aiTranscription: false,
    transcription:   '',
    voice:           '',
    mediaUrl:        editContent.mediaUrl ?? '',
    thumbnailUrl:    editContent.thumbnailUrl ?? '',
    imageUrls:       editContent.imageUrls ?? [],
  } : initialForm

  const initSchedule = () => {
    if (!editContent?.scheduledAt) return { enabled: false, date: '', time: '09:00' }
    const d = new Date(editContent.scheduledAt)
    const pad = (n: number) => String(n).padStart(2, '0')
    return { enabled: true, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
  }

  const [form, setForm]           = useState<FormState>(initForm)
  const [loc, setLoc]             = useState<LocationState>(() => resolveLocationCascade(editContent?.locationId, locations))
  const [thumbMode, setThumbMode] = useState<ThumbnailMode>('default')
  const [step, setStep]           = useState<Step>(1)
  // 'home' tab = IMAGE | VIDEO; 'shorts' tab = SHORT
  const [activeTab, setActiveTab] = useState<'home' | 'shorts'>(
    editContent?.type === ContentType.SHORT ? 'shorts' : 'home'
  )

  const initSched = initSchedule()
  const [scheduleEnabled, setScheduleEnabled] = useState(initSched.enabled)
  const [scheduleDate, setScheduleDate]       = useState(initSched.date)
  const [scheduleTime, setScheduleTime]       = useState(initSched.time)
  const [pending, start] = useTransition()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function selectType(type: ContentType, orientation: 'PORTRAIT' | 'LANDSCAPE' | '') {
    setForm(prev => ({ ...prev, type, orientation, mediaUrl: '', thumbnailUrl: '', imageUrls: [] }))
  }

  const resolvedLocationId = loc.locationId || loc.mandalId || loc.districtId || loc.stateId

  const mediaOk = form.type === ContentType.IMAGE
    ? form.imageUrls.length > 0
    : form.mediaUrl !== ''

  const canAdvance = step === 1
    ? form.title.trim().length > 0 && mediaOk
    : true

  function next() { if (step < 3) setStep((step + 1) as Step) }
  function back() {
    if (step > 1) setStep((step - 1) as Step)
    else router.push('/dashboard/content')
  }

  function submit(submitStatus: ContentStatus) {
    start(async () => {
      const thumbnailUrl = form.type === ContentType.IMAGE
        ? form.imageUrls[0]
        : form.thumbnailUrl || undefined

      const payload = {
        title:          form.title.trim(),
        excerpt:        form.excerpt.trim() || undefined,
        categoryId:     form.categoryId || undefined,
        locationId:     resolvedLocationId || undefined,
        languageId:     form.languageIds[0] || undefined,
        tags:           form.tags.length ? form.tags : undefined,
        isBreakingNews: form.flag === 'BREAKING_NEWS',
        isTrending:     form.flag === 'TRENDING',
        isFeatured:     form.flag === 'FEATURED',
        mediaUrl:       form.mediaUrl || undefined,
        thumbnailUrl,
        imageUrls:      form.imageUrls.length ? form.imageUrls : undefined,
        orientation:    form.orientation || undefined,
        scheduledAt:    scheduleEnabled && scheduleDate ? `${scheduleDate}T${scheduleTime}` : undefined,
      }

      if (isEdit && editContent) {
        const result = await updateContent(editContent.id, payload)
        if (result.ok) { toast.success(`"${result.data.title}" updated`); router.push('/dashboard/content') }
        else toast.error(result.error.message)
        return
      }

      const result = await createContent({ ...payload, type: form.type, source: ContentSource.CMS, status: submitStatus })
      if (result.ok) {
        const msg = submitStatus === ContentStatus.DRAFT ? `"${result.data.title}" saved as draft`
          : submitStatus === ContentStatus.SCHEDULED ? `"${result.data.title}" scheduled`
          : `"${result.data.title}" submitted for review`
        toast.success(msg); router.push('/dashboard/content')
      } else {
        toast.error(result.error.message)
      }
    })
  }

  const titleLeft   = 120 - form.title.length
  const excerptLeft = 600 - form.excerpt.length

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto w-full px-6 py-10">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{isEdit ? 'Edit Content' : 'Add Content'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? 'Update the details of your content.' : 'Fill in the details to publish your content.'}
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-muted/20">
            <div className="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center">
              {step === 1 && <Image className="h-3.5 w-3.5 text-primary" />}
              {step === 2 && <Star className="h-3.5 w-3.5 text-primary" />}
              {step === 3 && <Mic className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{STEPS[step - 1]!.label}</h2>
              <p className="text-xs text-muted-foreground">{STEPS[step - 1]!.sub}</p>
            </div>
          </div>

          <div>
            <div className="p-6">

              {/* ══ STEP 1 ══ */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-6">

                    {/* Tab toggle — Home / Shorts */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-1 rounded-lg border border-border bg-muted/20 p-1 w-fit">
                        {(['home', 'shorts'] as const).map(tab => (
                          <button key={tab} type="button"
                            disabled={isEdit}
                            onClick={() => {
                              setActiveTab(tab)
                              if (tab === 'home') selectType(ContentType.IMAGE, '')
                              else selectType(ContentType.SHORT, 'PORTRAIT')
                            }}
                            className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-all
                              ${activeTab === tab
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'}
                              ${isEdit ? 'opacity-80 cursor-default' : ''}`}>
                            {tab === 'home' ? 'Home' : 'Shorts'}
                          </button>
                        ))}
                      </div>

                      {/* Type cards — Home tab only (Shorts goes straight to upload) */}
                      {activeTab === 'home' && (
                        <div className="flex flex-wrap gap-3">
                          {[
                            { type: ContentType.IMAGE, label: 'Image Post', icon: ImageIcon, desc: 'Single or multiple images' },
                            { type: ContentType.VIDEO, label: 'Video Post',  icon: Video,     desc: 'Landscape video content'  },
                          ].map(opt => {
                            const active = form.type === opt.type
                            return (
                              <button key={opt.type} type="button"
                                disabled={isEdit}
                                onClick={() => selectType(opt.type, '')}
                                className={`flex items-center gap-3 rounded-xl border-2 px-5 py-3.5 text-left transition-all min-w-[180px]
                                  ${active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-muted-foreground/40 hover:bg-muted/20'}
                                  ${isEdit ? 'opacity-80 cursor-default' : ''}`}>
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors
                                  ${active ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'}`}>
                                  <opt.icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                                  <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Shorts tab — show info pill instead of sub-type cards */}
                      {activeTab === 'shorts' && (
                        <div className="flex items-center gap-3 rounded-xl border border-border bg-pink-50/50 px-4 py-3">
                          <div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200 shrink-0">
                            <Smartphone className="h-4 w-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Short Video</p>
                            <p className="text-[11px] text-muted-foreground">Plays in 9:16 portrait container · 16:9 videos get letterboxed</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title + Description + Media */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="flex flex-col gap-4">
                        <Field label="Title" required>
                          <div className="relative">
                            <Input placeholder="Enter title (max 120 characters)"
                              value={form.title} onChange={e => set('title', e.target.value.slice(0, 120))}
                              className="pr-16" />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums
                              ${titleLeft < 20 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {form.title.length}/120
                            </span>
                          </div>
                        </Field>

                        <Field label="Description">
                          <div className="relative">
                            <textarea rows={7}
                              placeholder="Enter description (max 600 characters)"
                              value={form.excerpt} onChange={e => set('excerpt', e.target.value.slice(0, 600))}
                              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none pb-7" />
                            <span className={`absolute right-3 bottom-2 text-xs tabular-nums
                              ${excerptLeft < 60 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {form.excerpt.length}/600
                            </span>
                          </div>
                        </Field>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-foreground mb-2 block">
                          Upload Media <span className="text-red-500">*</span>
                        </Label>
                        {form.type === ContentType.IMAGE
                          ? <MultiImageUploadArea
                              urls={form.imageUrls}
                              onFiles={urls => set('imageUrls', urls)}
                            />
                          : <VideoUploadArea
                              orientation={form.orientation}
                              thumbnailMode={thumbMode}
                              onThumbnailMode={setThumbMode}
                              initialVideoUrl={form.mediaUrl || null}
                              initialThumbUrl={form.thumbnailUrl || null}
                              onFile={(vUrl, tUrl) => {
                                setForm(prev => ({ ...prev, mediaUrl: vUrl ?? '', thumbnailUrl: tUrl ?? '' }))
                              }}
                            />
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 2 ══ */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">

                    {/* LEFT */}
                    <div className="flex flex-col gap-5">
                      <Field label="Category" required>
                        <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={selectCls}>
                          <option value="">Select Category</option>
                          {categories.filter(c => c.active).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </Field>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium text-foreground">
                          Location <span className="text-red-500">*</span>
                        </Label>
                        <LocationCascade
                          locations={locations}
                          loc={loc}
                          onChange={setLoc}
                        />
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col gap-5">
                      <Field label="Language" required hint="Select all languages this content is available in">
                        <LanguageSelect languages={languages} selected={form.languageIds} onChange={ids => set('languageIds', ids)} />
                      </Field>

                      <Field label="Tags" hint="Press Enter or comma to add · max 20 tags">
                        <TagInput tags={form.tags} onChange={tags => set('tags', tags)} />
                      </Field>

                      <div>
                        <Label className="text-xs font-medium text-foreground mb-2.5 block">
                          Flag <span className="text-muted-foreground font-normal">(select one, click again to remove)</span>
                        </Label>
                        <FlagRadio selected={form.flag} onChange={v => set('flag', v)} />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ══ STEP 3 ══ */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-[1fr_340px] gap-8 items-start">

                    {/* LEFT */}
                    <div className="flex flex-col gap-5">

                      <Field label="Account" required>
                        <div className="flex items-center gap-2.5 h-9 rounded-md border border-input bg-muted/30 px-3">
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold shrink-0">P</div>
                          <span className="text-sm font-medium flex-1">PuraLocal Official</span>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 uppercase tracking-wide">Org</span>
                        </div>
                      </Field>

                      <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 bg-muted/10">
                        <div>
                          <p className="text-sm font-medium text-foreground">AI Transcription</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Generate transcription and select a voice</p>
                        </div>
                        <Toggle value={form.aiTranscription} onChange={v => set('aiTranscription', v)} />
                      </div>

                      {form.aiTranscription && (
                        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                          <Field label="Transcription" hint="Max 5000 characters">
                            <div className="relative">
                              <textarea rows={4} placeholder="Paste or type the transcription here…"
                                value={form.transcription} onChange={e => set('transcription', e.target.value.slice(0, 5000))}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none pb-7" />
                              <span className="absolute right-3 bottom-2 text-xs text-muted-foreground tabular-nums">
                                {form.transcription.length}/5000
                              </span>
                            </div>
                          </Field>
                          <div className="grid grid-cols-2 gap-3 items-end">
                            <Field label="Voice Selection">
                              <select value={form.voice} onChange={e => set('voice', e.target.value)} className={selectCls}>
                                <option value="">Select Voice</option>
                                <option value="female-te">Female · Telugu</option>
                                <option value="male-te">Male · Telugu</option>
                                <option value="female-hi">Female · Hindi</option>
                                <option value="male-hi">Male · Hindi</option>
                              </select>
                            </Field>
                            <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" disabled>
                              <MicOff className="h-3.5 w-3.5" />
                              Preview Voice
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between gap-4 px-4 py-3.5 bg-muted/10">
                          <div className="flex items-center gap-2.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Schedule for Later</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Set a publish date and time</p>
                            </div>
                          </div>
                          <Toggle value={scheduleEnabled} onChange={v => { setScheduleEnabled(v); if (!v) setScheduleDate('') }} />
                        </div>

                        {scheduleEnabled && (
                          <div className="border-t border-border px-4 py-4 flex flex-col gap-3 animate-in fade-in duration-200">
                            <div className="grid grid-cols-2 gap-3">
                              <Field label="Publish Date" required>
                                <input type="date" value={scheduleDate}
                                  min={new Date().toISOString().split('T')[0]}
                                  onChange={e => setScheduleDate(e.target.value)}
                                  className={inputCls} />
                              </Field>
                              <Field label="Publish Time" required>
                                <div className="relative flex items-center">
                                  <Clock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                  <input type="time" value={scheduleTime}
                                    onChange={e => setScheduleTime(e.target.value)}
                                    className={inputCls + ' pl-9'} />
                                </div>
                              </Field>
                            </div>
                            {scheduleDate && (
                              <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" />
                                Will publish on {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: preview */}
                    <PreviewCard
                      form={form} categories={categories} locations={locations}
                      resolvedLocationId={resolvedLocationId}
                      scheduleEnabled={scheduleEnabled} scheduleDate={scheduleDate} scheduleTime={scheduleTime}
                    />

                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/10">
              <Button type="button" variant="outline" onClick={back} disabled={pending}>
                {step === 1 ? 'Cancel' : '← Back'}
              </Button>

              <div className="flex items-center gap-3">
                {step === 1 && !canAdvance && (
                  <span className="text-xs text-muted-foreground">
                    {!form.title.trim() && !mediaOk
                      ? 'Enter a title and upload media to continue'
                      : !form.title.trim()
                        ? 'Enter a title to continue'
                        : 'Upload required media to continue'}
                  </span>
                )}
                {step < 3 ? (
                  <Button type="button" onClick={next} disabled={!canAdvance}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px] gap-1">
                    Next →
                  </Button>
                ) : isEdit ? (
                  <Button type="button" disabled={pending || !form.title.trim()}
                    onClick={() => submit(editContent!.status)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]">
                    {pending ? 'Saving…' : 'Save Changes'}
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" disabled={pending || !form.title.trim()}
                      onClick={() => submit(ContentStatus.DRAFT)}>
                      {pending ? 'Saving…' : 'Save as Draft'}
                    </Button>
                    {scheduleEnabled && scheduleDate ? (
                      <Button type="button" disabled={pending || !form.title.trim()}
                        onClick={() => submit(ContentStatus.SCHEDULED)}
                        className="bg-amber-600 hover:bg-amber-700 text-white">
                        {pending ? 'Scheduling…' : `Schedule · ${scheduleDate}`}
                      </Button>
                    ) : (
                      <Button type="button" disabled={pending || !form.title.trim()}
                        onClick={() => submit(ContentStatus.UNDER_REVIEW)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {pending ? 'Submitting…' : 'Submit for Review'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
