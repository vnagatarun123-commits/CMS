import type { AuditEntry } from '@/types/domain'

export const AUDIT_PAGE_SIZE = 30

export interface AuditLogResult {
  entries: AuditEntry[]
  total: number
  page: number
  hasMore: boolean
}
