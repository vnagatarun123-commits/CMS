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
  MockTagRepository,
  MockContentRepository,
  MockNotificationRepository,
  MockNotificationTemplateRepository,
  MockCommissionRuleRepository,
  MockReporterRepository,
  MockContributorRepository,
} from './mock-repositories'
import {
  SEEDED_ORG,
  SEEDED_USERS,
  SEEDED_CATEGORIES,
  SEEDED_LOCATIONS,
  SEEDED_LANGUAGES,
  SEEDED_TAGS,
  SEEDED_CONTENT,
  SEED_ROLE_DEFINITIONS,
  SEEDED_NOTIFICATIONS,
  SEEDED_NOTIFICATION_TEMPLATES,
  SEEDED_AUDIT_ENTRIES,
} from './seed'
import { RECENT_CONTENT } from './seed-recent'
import { COMMISSION_RULES, SEED_REPORTERS } from './seed-reporters'
import { getStoredContributors } from './contributors-store'

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
      tags: new MockTagRepository(structuredClone(SEEDED_TAGS)),
      content: new MockContentRepository(structuredClone([...RECENT_CONTENT, ...SEEDED_CONTENT])),
      notifications: new MockNotificationRepository(structuredClone(SEEDED_NOTIFICATIONS)),
      notificationTemplates: new MockNotificationTemplateRepository(structuredClone(SEEDED_NOTIFICATION_TEMPLATES)),
      commissionRules: new MockCommissionRuleRepository(structuredClone(COMMISSION_RULES)),
      reporters: new MockReporterRepository(structuredClone(SEED_REPORTERS)),
      contributors: new MockContributorRepository(structuredClone(getStoredContributors())),
    },
  }
}
