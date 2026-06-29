import { cn } from '@/lib/utils'
import type { ContentStatus } from '@/types/domain'

// Maps domain ContentStatus values to display config
const STATUS_STYLES: Record<ContentStatus, { label: string; textVar: string; bgVar: string }> = {
  DRAFT:               { label: 'Draft',               textVar: '--status-draft-text',               bgVar: '--status-draft-bg' },
  UNDER_REVIEW:        { label: 'Under Review',         textVar: '--status-under-review-text',        bgVar: '--status-under-review-bg' },
  NEEDS_CLARIFICATION: { label: 'Needs Clarification',  textVar: '--status-needs-clarification-text', bgVar: '--status-needs-clarification-bg' },
  SCHEDULED:           { label: 'Scheduled',            textVar: '--status-scheduled-text',           bgVar: '--status-scheduled-bg' },
  PUBLISHED:           { label: 'Published',            textVar: '--status-published-text',           bgVar: '--status-published-bg' },
}

interface StatusBadgeProps {
  status: ContentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_STYLES[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        color: `var(${config.textVar})`,
        backgroundColor: `var(${config.bgVar})`,
      }}
    >
      {config.label}
    </span>
  )
}

// Convenience: labels only (for filters, dropdowns)
export function contentStatusLabel(status: ContentStatus): string {
  return STATUS_STYLES[status].label
}
