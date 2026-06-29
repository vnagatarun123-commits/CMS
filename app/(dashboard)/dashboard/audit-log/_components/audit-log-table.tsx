'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { AuditEntry } from '@/types/domain'
import { DataTable } from '@/components/shared/data-table'

const ACTION_LABELS: Record<string, string> = {
  'user.invited':      'User invited',
  'user.role_assigned':'Role assigned',
  'user.role_removed': 'Role removed',
  'user.removed':      'User removed',
  'org.settings_updated': 'Settings updated',
}

const columns: ColumnDef<AuditEntry>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ getValue }) => {
      const d = getValue<Date>()
      return (
        <span className="tabular-nums text-xs text-muted-foreground whitespace-nowrap">
          {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
  },
  {
    accessorKey: 'actorName',
    header: 'Actor',
    cell: ({ getValue }) => (
      <span className="font-medium text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ getValue }) => {
      const action = getValue<string>()
      return <span className="text-sm">{ACTION_LABELS[action] ?? action}</span>
    },
  },
  {
    accessorKey: 'targetLabel',
    header: 'Target',
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
    ),
  },
]

interface AuditLogTableProps {
  entries: AuditEntry[]
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  return <DataTable columns={columns} data={entries} pageSize={25} />
}
