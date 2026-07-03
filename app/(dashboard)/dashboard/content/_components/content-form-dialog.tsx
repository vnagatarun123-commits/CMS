'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Info,
  Tags,
  FileText,
  Film,
  CalendarClock,
  ChevronDown,
} from 'lucide-react'
import type { Content, Category, Location, Language } from '@/types/domain'
import { ContentType, ContentSource, ContentStatus } from '@/types/domain'
import { contentStatusLabel } from '@/components/shared/status-badge'
import { createContent, updateContent } from '@/app/actions/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTimeLocal(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Section scaffolding ───────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContentFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  content?: Content | null
  categories: Category[]
  locations: Location[]
  languages: Language[]
  onSuccess: () => void
}

// ── Form state ────────────────────────────────────────────────────────────────

// Statuses available when creating via CMS
const CMS_INITIAL_STATUSES: ContentStatus[] = [
  ContentStatus.DRAFT,
  ContentStatus.UNDER_REVIEW,
  ContentStatus.SCHEDULED,
  ContentStatus.PUBLISHED,
]

interface FormState {
  type: ContentType
  source: ContentSource
  status: ContentStatus
  title: string
  body: string
  excerpt: string
  categoryId: string
  locationId: string
  languageId: string
  youtubeUrl: string
  scheduledAt: string
}

function defaultState(content?: Content | null): FormState {
  return {
    type: content?.type ?? ContentType.IMAGE,
    source: content?.source ?? ContentSource.CMS,
    status: content?.status ?? ContentStatus.DRAFT,
    title: content?.title ?? '',
    body: content?.body ?? '',
    excerpt: content?.excerpt ?? '',
    categoryId: content?.categoryId ?? 'none',
    locationId: content?.locationId ?? 'none',
    languageId: content?.languageId ?? 'none',
    youtubeUrl: content?.youtubeUrl ?? '',
    scheduledAt: formatDateTimeLocal(content?.scheduledAt ?? null),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContentFormDialog({
  open,
  onOpenChange,
  content,
  categories,
  locations,
  languages,
  onSuccess,
}: ContentFormDialogProps) {
  const isEdit = Boolean(content)
  const [form, setForm] = useState<FormState>(() => defaultState(content))
  const [pending, startTransition] = useTransition()

  // Reset form when dialog opens/content changes
  useEffect(() => {
    if (open) {
      setForm(defaultState(content))
    }
  }, [open, content])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      type: form.type,
      source: form.source,
      status: form.source === ContentSource.CMS ? form.status : undefined,
      title: form.title.trim(),
      body: form.body.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      categoryId: form.categoryId && form.categoryId !== 'none' ? form.categoryId : undefined,
      locationId: form.locationId && form.locationId !== 'none' ? form.locationId : undefined,
      languageId: form.languageId && form.languageId !== 'none' ? form.languageId : undefined,
      youtubeUrl: form.youtubeUrl.trim() || undefined,
      scheduledAt: form.scheduledAt || undefined,
    }

    startTransition(async () => {
      if (isEdit && content) {
        const result = await updateContent(content.id, payload)
        if (result.ok) {
          toast.success(`"${result.data.title}" updated`)
          onSuccess()
        } else {
          toast.error(result.error.message)
        }
      } else {
        const result = await createContent(payload)
        if (result.ok) {
          toast.success(`"${result.data.title}" created`)
          onSuccess()
        } else {
          toast.error(result.error.message)
        }
      }
    })
  }

  const showYoutubeUrl = form.type === ContentType.YOUTUBE
  const showScheduledAt = form.source === ContentSource.CMS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px] tracking-tight">
            {isEdit ? 'Edit content' : 'New content'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details for this content item.'
              : 'Create a content item and choose where it enters the workflow.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          {/* Classification ─────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel icon={Tags}>Classification</SectionLabel>

            {/* Type + Source */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={v => set('type', (v || '') as ContentType)}
                  disabled={pending}
                >
                  <SelectTrigger id="cf-type" className="w-full bg-background border-input text-foreground text-sm rounded-lg h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ContentType).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-source">Source</Label>
                <Select
                  value={form.source}
                  onValueChange={v => set('source', (v || '') as ContentSource)}
                  disabled={pending || isEdit}
                >
                  <SelectTrigger id="cf-source" className="w-full bg-background border-input text-foreground text-sm rounded-lg h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ContentSource).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Initial status (create only) */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="cf-status">Initial status</Label>
                {form.source === ContentSource.CMS ? (
                  <Select
                    value={form.status}
                    onValueChange={v => set('status', (v || '') as ContentStatus)}
                    disabled={pending}
                  >
                    <SelectTrigger id="cf-status" className="w-full bg-background border-input text-foreground text-sm rounded-lg h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CMS_INITIAL_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{contentStatusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-[13px] text-muted-foreground dark:bg-primary/10">
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>
                      App submissions always enter{' '}
                      <strong className="font-medium text-foreground">Under Review</strong> and cannot skip the review step.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="border-t border-border/60" />

          {/* Details ─────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel icon={FileText}>Details</SectionLabel>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="cf-title">Title</Label>
              <Input
                id="cf-title"
                placeholder="Article title…"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                required
                disabled={pending}
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label htmlFor="cf-excerpt">Excerpt</Label>
              <Textarea
                id="cf-excerpt"
                rows={2}
                placeholder="Short summary…"
                value={form.excerpt}
                onChange={e => set('excerpt', e.target.value)}
                disabled={pending}
                className="resize-none"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor="cf-body">
                Body{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="cf-body"
                rows={4}
                placeholder="Full content body…"
                value={form.body}
                onChange={e => set('body', e.target.value)}
                disabled={pending}
                className="resize-none"
              />
            </div>

            {/* Category / Location / Language */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={v => set('categoryId', v || '')}
                  disabled={pending}
                >
                  <SelectTrigger id="cf-category" className="w-full bg-background border-input text-foreground text-sm rounded-lg h-9">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.filter(c => c.active).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-location">Location</Label>
                <Select
                  value={form.locationId}
                  onValueChange={v => set('locationId', v || '')}
                  disabled={pending}
                >
                  <SelectTrigger id="cf-location" className="w-full bg-background border-input text-foreground text-sm rounded-lg h-9">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {locations.filter(l => l.active).map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-language">Language</Label>
                <Select
                  value={form.languageId}
                  onValueChange={v => set('languageId', v || '')}
                  disabled={pending}
                >
                  <SelectTrigger id="cf-language" className="w-full bg-background border-input text-foreground text-sm rounded-lg h-9">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {languages.filter(l => l.active).map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Media & Publishing ──────────────────────────────────────── */}
          {(showYoutubeUrl || showScheduledAt) && (
            <>
              <div className="border-t border-border/60" />
              <section className="space-y-3">
                <SectionLabel icon={showYoutubeUrl ? Film : CalendarClock}>
                  {showYoutubeUrl ? 'Media & publishing' : 'Publishing'}
                </SectionLabel>

                {/* YouTube URL (conditional) */}
                {showYoutubeUrl && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cf-youtube">YouTube URL</Label>
                    <Input
                      id="cf-youtube"
                      type="url"
                      placeholder="https://youtube.com/watch?v=…"
                      value={form.youtubeUrl}
                      onChange={e => set('youtubeUrl', e.target.value)}
                      disabled={pending}
                    />
                  </div>
                )}

                {/* Scheduled date (conditional) */}
                {showScheduledAt && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cf-scheduled">
                      Scheduled publish date{' '}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="cf-scheduled"
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={e => set('scheduledAt', e.target.value)}
                      disabled={pending}
                    />
                  </div>
                )}
              </section>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !form.title.trim()}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending
                ? (isEdit ? 'Saving…' : 'Creating…')
                : (isEdit ? 'Save changes' : 'Create content')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
