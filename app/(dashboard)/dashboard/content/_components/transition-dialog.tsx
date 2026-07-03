'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Ban, Check, FileText, Loader2 } from 'lucide-react'
import type { Content } from '@/types/domain'
import { ContentStatus } from '@/types/domain'
import type { Permission } from '@/lib/rbac/permissions'
import { Permission as PermissionValues } from '@/lib/rbac/permissions'
import { availableTransitions } from '@/lib/content/state-machine'
import { transitionContent } from '@/app/actions/content'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge, contentStatusLabel } from '@/components/shared/status-badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// All permissions — used as fallback when actorPermissions not supplied
const ALL_PERMISSIONS = Object.values(PermissionValues) as Permission[]

// ── Props ─────────────────────────────────────────────────────────────────────

interface TransitionDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  content: Content
  /** Optional actor permissions — defaults to all permissions (liberal for UI) */
  actorPermissions?: readonly Permission[]
  onSuccess: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TransitionDialog({
  open,
  onOpenChange,
  content,
  actorPermissions,
  onSuccess,
}: TransitionDialogProps) {
  // If no permissions provided, show all structurally valid transitions
  // (the server action enforces the real permission check)
  const displayTransitions = availableTransitions(
    content.status,
    actorPermissions ?? ALL_PERMISSIONS,
  )

  const [selected, setSelected] = useState<ContentStatus | null>(
    displayTransitions[0] ?? null,
  )
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const hasTransitions = displayTransitions.length > 0

  function handleConfirm() {
    if (!selected) return
    startTransition(async () => {
      const result = await transitionContent({
        contentId: content.id,
        toStatus: selected,
        note: note.trim() || undefined,
      })
      if (result.ok) {
        toast.success(`Status changed to ${contentStatusLabel(selected)}`)
        setNote('')
        onSuccess()
      } else {
        toast.error(result.error.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-semibold tracking-tight">
            Change Status
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Move this content to a new stage in its workflow. Changes are
            recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Content context — title + current → target flow */}
          <div className="rounded-xl border bg-muted/30 px-4 py-3.5 ring-1 ring-border/50">
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary"
              >
                <FileText className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Content
                </p>
                <p
                  className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-foreground"
                  title={content.title}
                >
                  {content.title}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={content.status} />
              {selected && (
                <>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <StatusBadge status={selected} />
                </>
              )}
            </div>
          </div>

          {/* Transition options */}
          {!hasTransitions ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Ban className="size-5" aria-hidden="true" />
              </div>
              <p className="text-[14px] font-medium text-foreground">
                No transitions available
              </p>
              <p className="max-w-[16rem] text-[13px] text-muted-foreground">
                This content can&apos;t move to another status from its current
                stage.
              </p>
            </div>
          ) : (
            <fieldset className="space-y-2.5" disabled={pending}>
              <legend className="mb-2.5 text-[13px] font-medium text-muted-foreground">
                Move to
              </legend>
              <div
                role="radiogroup"
                aria-label="Target status"
                className="space-y-2"
              >
                {displayTransitions.map(status => {
                  const isSelected = selected === status
                  return (
                    <label
                      key={status}
                      className={cn(
                        'group flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition-colors',
                        'hover:bg-muted/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50',
                        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:disabled]:hover:bg-card',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'ring-1 ring-transparent',
                      )}
                    >
                      <input
                        type="radio"
                        name="transition-status"
                        value={status}
                        checked={isSelected}
                        onChange={() => setSelected(status)}
                        disabled={pending}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input bg-transparent text-transparent group-hover:border-muted-foreground/50',
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <StatusBadge status={status} />
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          {/* Note */}
          {hasTransitions && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="transition-note"
                  className="text-[13px] font-medium text-muted-foreground"
                >
                  Note{' '}
                  <span className="font-normal text-muted-foreground/70">
                    (optional)
                  </span>
                </Label>
                {note.length > 0 && (
                  <span className="text-[11px] tabular-nums text-muted-foreground/70">
                    {note.trim().length} chars
                  </span>
                )}
              </div>
              <Textarea
                id="transition-note"
                rows={3}
                placeholder="Add a note about this transition…"
                value={note}
                onChange={e => setNote(e.target.value)}
                disabled={pending}
                className="resize-none"
              />
              <p className="text-[12px] text-muted-foreground/70">
                Visible to reviewers and saved to the audit trail.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={pending || !selected || !hasTransitions}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Applying…
              </>
            ) : (
              <>
                <Check className="size-4" aria-hidden="true" />
                Confirm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
