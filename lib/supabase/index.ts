import type { Backend } from '@/lib/backend'
import type { RoleDefinitionRepository, CreateRoleParams, UpdateRoleParams, NotificationRepository, NotificationTemplateRepository, NotificationListOptions, CreateNotificationParams } from '@/lib/data/repositories'
import type { RoleDefinition, NotificationRecord, NotificationTemplate, NotificationStats, NotificationStatus } from '@/types/domain'
import { getPrismaClient } from './prisma'
import { SupabaseAuthProvider } from './supabase-auth'
import {
  SupabaseOrganizationRepository,
  SupabaseUserRepository,
  SupabaseRoleAssignmentRepository,
  SupabaseAuditLogRepository,
  SupabaseCategoryRepository,
  SupabaseLocationRepository,
  SupabaseLanguageRepository,
  SupabaseContentRepository,
  lookupUserForAuth,
} from './supabase-repositories'

// Stub — real implementation deferred to the Supabase swap slice
class SupabaseRoleDefinitionRepository implements RoleDefinitionRepository {
  async list(_orgId: string): Promise<RoleDefinition[]> { return [] }
  async findById(_id: string, _orgId: string): Promise<RoleDefinition | null> { return null }
  async create(_p: CreateRoleParams): Promise<RoleDefinition> { throw new Error('Not implemented') }
  async update(_id: string, _orgId: string, _p: UpdateRoleParams): Promise<RoleDefinition> { throw new Error('Not implemented') }
  async delete(_id: string, _orgId: string): Promise<void> { throw new Error('Not implemented') }
}

// Stubs — deferred to the Supabase swap slice
class SupabaseNotificationRepository implements NotificationRepository {
  async list(_orgId: string, _opts?: NotificationListOptions): Promise<NotificationRecord[]> { return [] }
  async findById(_id: string, _orgId: string): Promise<NotificationRecord | null> { return null }
  async create(_p: CreateNotificationParams): Promise<NotificationRecord> { throw new Error('Not implemented') }
  async updateStatus(_id: string, _orgId: string, _status: NotificationStatus, _sentAt?: Date): Promise<NotificationRecord> { throw new Error('Not implemented') }
  async delete(_id: string, _orgId: string): Promise<void> { throw new Error('Not implemented') }
  async getStats(_orgId: string): Promise<NotificationStats> { return { totalSent: 0, totalScheduled: 0, totalDraft: 0, totalFailed: 0, totalRecipients: 0, totalDelivered: 0, totalOpened: 0, openRate: 0, deliveryRate: 0 } }
}

class SupabaseNotificationTemplateRepository implements NotificationTemplateRepository {
  async list(_orgId: string): Promise<NotificationTemplate[]> { return [] }
  async findById(_id: string, _orgId: string): Promise<NotificationTemplate | null> { return null }
}

export function createSupabaseBackend(): Backend {
  const prisma = getPrismaClient()

  const auth = new SupabaseAuthProvider(
    (supabaseUserId) => lookupUserForAuth(prisma, supabaseUserId),
  )

  return {
    auth,
    data: {
      organizations: new SupabaseOrganizationRepository(prisma),
      users: new SupabaseUserRepository(prisma),
      roleAssignments: new SupabaseRoleAssignmentRepository(prisma),
      roleDefinitions: new SupabaseRoleDefinitionRepository(),
      auditLog: new SupabaseAuditLogRepository(prisma),
      categories: new SupabaseCategoryRepository(prisma),
      locations: new SupabaseLocationRepository(prisma),
      languages: new SupabaseLanguageRepository(prisma),
      content: new SupabaseContentRepository(prisma),
      notifications: new SupabaseNotificationRepository(),
      notificationTemplates: new SupabaseNotificationTemplateRepository(),
    },
  }
}
