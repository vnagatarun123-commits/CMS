'use server'

import type { AuditEntry } from '@/types/domain'
import type { AuditListOptions } from '@/lib/data/repositories'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'

export const getAuditLog = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, opts: AuditListOptions = {}): Promise<AuditEntry[]> => {
    return getBackend().data.auditLog.list(session.orgContext.organizationId, opts)
  },
)
