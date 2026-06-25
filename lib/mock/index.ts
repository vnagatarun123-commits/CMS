import type { Backend } from '@/lib/backend'
import { MockAuthProvider } from './mock-auth'
import {
  MockOrganizationRepository,
  MockUserRepository,
  MockRoleAssignmentRepository,
  MockAuditLogRepository,
} from './mock-repositories'
import { SEEDED_ORG, SEEDED_USERS } from './seed'

export function createMockBackend(): Backend {
  const users = structuredClone(SEEDED_USERS)

  return {
    auth: new MockAuthProvider(users),
    data: {
      organizations: new MockOrganizationRepository([structuredClone(SEEDED_ORG)]),
      users: new MockUserRepository(users),
      roleAssignments: new MockRoleAssignmentRepository([]),
      auditLog: new MockAuditLogRepository([]),
    },
  }
}
