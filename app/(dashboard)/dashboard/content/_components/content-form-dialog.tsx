'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import type { Content, Category, Location, Language } from '@/types/domain'
import { ContentType, ContentSource, ContentStatus } from '@/types/domain'
import { contentStatusLabel } from '@/components/shared/status-badge'
import { createContent, updateContent } from '@/app/actions/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTimeLocal(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Native select helper (matches existing pattern) ───────────────────────────

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
    categoryId: content?.categoryId ?? '',
    locationId: content?.locationId ?? '',
    languageId: content?.languageId ?? '',
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
      categoryId: form.categoryId || undefined,
      locationId: form.locationId || undefined,
      languageId: form.languageId || undefined,
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
          <DialogTitle>{isEdit ? 'Edit Content' : 'New Content'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Type + Source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-type">Type</Label>
              <select
                id="cf-type"
                value={form.type}
                onChange={e => set('type', e.target.value as ContentType)}
                disabled={pending}
                className={selectClass}
              >
                {Object.values(ContentType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-source">Source</Label>
              <select
                id="cf-source"
                value={form.source}
                onChange={e => set('source', e.target.value as ContentSource)}
                disabled={pending || isEdit}
                className={selectClass}
              >
                {Object.values(ContentSource).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial status (create only) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="cf-status">Initial status</Label>
              {form.source === ContentSource.CMS ? (
                <select
                  id="cf-status"
                  value={form.status}
                  onChange={e => set('status', e.target.value as ContentStatus)}
                  disabled={pending}
                  className={selectClass}
                >
                  {CMS_INITIAL_STATUSES.map(s => (
                    <option key={s} value={s}>{contentStatusLabel(s)}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted-foreground py-1">
                  App submissions always enter <strong>Under Review</strong>.
                </p>
              )}
            </div>
          )}

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
            <textarea
              id="cf-excerpt"
              rows={2}
              placeholder="Short summary…"
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              disabled={pending}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="cf-body">Body</Label>
            <textarea
              id="cf-body"
              rows={4}
              placeholder="Full content body… (optional)"
              value={form.body}
              onChange={e => set('body', e.target.value)}
              disabled={pending}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Category / Location / Language */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-category">Category</Label>
              <select
                id="cf-category"
                value={form.categoryId}
                onChange={e => set('categoryId', e.target.value)}
                disabled={pending}
                className={selectClass}
              >
                <option value="">None</option>
                {categories.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-location">Location</Label>
              <select
                id="cf-location"
                value={form.locationId}
                onChange={e => set('locationId', e.target.value)}
                disabled={pending}
                className={selectClass}
              >
                <option value="">None</option>
                {locations.filter(l => l.active).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-language">Language</Label>
              <select
                id="cf-language"
                value={form.languageId}
                onChange={e => set('languageId', e.target.value)}
                disabled={pending}
                className={selectClass}
              >
                <option value="">None</option>
                {languages.filter(l => l.active).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

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
              <Label htmlFor="cf-scheduled">Scheduled publish date (optional)</Label>
              <Input
                id="cf-scheduled"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)}
                disabled={pending}
              />
            </div>
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
              {pending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create content')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
