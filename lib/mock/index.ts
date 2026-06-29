import type { Backend } from '@/lib/backend'
import { MockAuthProvider } from './mock-auth'
import {
  MockOrganizationRepository,
  MockUserRepository,
  MockRoleAssignmentRepository,
  MockRoleDefinitionRepository,
  MockAuditLogRepository,
  MockCategoryRepository,
  MockLocationRepository,
  MockLanguageRepository,
  MockContentRepository,
  MockNotificationRepository,
  MockNotificationTemplateRepository,
} from './mock-repositories'
import {
  SEEDED_ORG,
  SEEDED_USERS,
  SEEDED_CATEGORIES,
  SEEDED_LOCATIONS,
  SEEDED_LANGUAGES,
  SEEDED_CONTENT,
  SEED_ROLE_DEFINITIONS,
  SEEDED_NOTIFICATIONS,
  SEEDED_NOTIFICATION_TEMPLATES,
  SEEDED_AUDIT_ENTRIES,
} from './seed'

export function createMockBackend(): Backend {
  const users = structuredClone(SEEDED_USERS)

  return {
    auth: new MockAuthProvider(users),
    data: {
      organizations: new MockOrganizationRepository([structuredClone(SEEDED_ORG)]),
      users: new MockUserRepository(users),
      roleAssignments: new MockRoleAssignmentRepository([]),
      roleDefinitions: new MockRoleDefinitionRepository(structuredClone(SEED_ROLE_DEFINITIONS)),
      auditLog: new MockAuditLogRepository(structuredClone(SEEDED_AUDIT_ENTRIES)),
      categories: new MockCategoryRepository(structuredClone(SEEDED_CATEGORIES)),
      locations: new MockLocationRepository(structuredClone(SEEDED_LOCATIONS)),
      languages: new MockLanguageRepository(structuredClone(SEEDED_LANGUAGES)),
      content: new MockContentRepository(structuredClone(SEEDED_CONTENT)),
      notifications: new MockNotificationRepository(structuredClone(SEEDED_NOTIFICATIONS)),
      notificationTemplates: new MockNotificationTemplateRepository(structuredClone(SEEDED_NOTIFICATION_TEMPLATES)),
    },
  }
}
