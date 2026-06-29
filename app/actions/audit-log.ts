'use server'

import type { AuditEntry } from '@/types/domain'
import type { AuditListOptions, AuditCategory } from '@/lib/data/repositories'
import { AUDIT_PAGE_SIZE, type AuditLogResult } from '@/lib/audit-log-constants'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'

export const getAuditLog = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, opts: AuditListOptions = {}): Promise<AuditEntry[]> => {
    return getBackend().data.auditLog.list(session.orgContext.organizationId, opts)
  },
)

export const getContentActivity = withAuth(
  Permission.CONTENT_EDIT,
  async (session, contentId: string): Promise<AuditEntry[]> => {
    return getBackend().data.auditLog.list(session.orgContext.organizationId, {
      targetType: 'content',
      targetId: contentId,
      limit: 100,
    })
  },
)

export const getAuditLogPage = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, opts: {
    page?: number
    category?: AuditCategory
    search?: string
    after?: string
    before?: string
  } = {}): Promise<AuditLogResult> => {
    const orgId = session.orgContext.organizationId
    const page = opts.page ?? 0

    const listOpts: AuditListOptions = {
      category: opts.category,
      search: opts.search || undefined,
      after:  opts.after  ? new Date(opts.after)  : undefined,
      before: opts.before ? new Date(opts.before) : undefined,
    }

    const all = await getBackend().data.auditLog.list(orgId, listOpts)
    const total = all.length
    const entries = all.slice(page * AUDIT_PAGE_SIZE, (page + 1) * AUDIT_PAGE_SIZE)
    return { entries, total, page, hasMore: (page + 1) * AUDIT_PAGE_SIZE < total }
  },
)
