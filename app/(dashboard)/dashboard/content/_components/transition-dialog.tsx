'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { Content } from '@/types/domain'
import { ContentStatus } from '@/types/domain'
import type { Permission } from '@/lib/rbac/permissions'
import { Permission as PermissionValues } from '@/lib/rbac/permissions'
import { availableTransitions } from '@/lib/content/state-machine'
import { transitionContent } from '@/app/actions/content'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { StatusBadge, contentStatusLabel } from '@/components/shared/status-badge'
import {
  Dialog,
  DialogContent,
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
          <DialogTitle>Change Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Current:</span>
            <StatusBadge status={content.status} />
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-foreground truncate">{content.title}</p>

          {/* Transition options */}
          {displayTransitions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No transitions available from this status.
            </p>
          ) : (
            <fieldset className="space-y-2">
              <Label>Move to</Label>
              <div className="space-y-2 mt-1">
                {displayTransitions.map(status => (
                  <label
                    key={status}
                    className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="transition-status"
                      value={status}
                      checked={selected === status}
                      onChange={() => setSelected(status)}
                      disabled={pending}
                      className="accent-primary"
                    />
                    <StatusBadge status={status} />
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="transition-note">Note (optional)</Label>
            <textarea
              id="transition-note"
              rows={2}
              placeholder="Add a note about this transition…"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={pending}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
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
            disabled={pending || !selected || displayTransitions.length === 0}
          >
            {pending ? 'Applying…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
