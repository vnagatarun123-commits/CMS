import type {
  Organization,
  UserWithRole,
  RoleAssignment,
  AuditEntry,
  AuditAction,
  AuditTargetType,
  Category,
  Location,
  Language,
  Content,
  ContentTransition,
  ContentStatus,
  ContentType,
  ContentSource,
  LocationLevel,
  Tag,
  NotificationRecord,
  NotificationTemplate,
  NotificationStats,
  NotificationChannel,
  NotificationAudience,
  NotificationPriority,
  NotificationStatus,
} from '@/types/domain'
import type { Capability } from '@/lib/rbac/permissions'

// Every repository method requires an explicit organizationId.
// Implementations throw MissingOrgContextError if absent,
// WrongOrgError if a resolved record belongs to a different org.

// ── Phase 0 repositories ─────────────────────────────────────────────────────

export interface OrganizationRepository {
  findById(organizationId: string): Promise<Organization | null>
}

export interface UpdateProfileParams {
  name?: string
  phone?: string | null
  bio?: string | null
  timezone?: string | null
  language?: string | null
  photoUrl?: string | null
}

export interface UserRepository {
  listByOrg(organizationId: string): Promise<UserWithRole[]>
  findById(userId: string, organizationId: string): Promise<UserWithRole | null>
  findByEmail(email: string, organizationId: string): Promise<UserWithRole | null>
  invite(params: InviteUserParams): Promise<UserWithRole>
  remove(userId: string, organizationId: string): Promise<void>
  updateProfile(userId: string, organizationId: string, params: UpdateProfileParams): Promise<UserWithRole>
}

export interface RoleAssignmentRepository {
  assign(params: AssignRoleParams): Promise<RoleAssignment>
  remove(userId: string, organizationId: string): Promise<void>
  findByUser(userId: string, organizationId: string): Promise<RoleAssignment | null>
}

export interface AuditLogRepository {
  list(organizationId: string, opts?: AuditListOptions): Promise<AuditEntry[]>
  append(entry: AppendAuditParams): Promise<AuditEntry>
}

// ── Phase 1: Reference data repositories ────────────────────────────────────

export interface CategoryRepository {
  list(organizationId: string, opts?: RefListOptions): Promise<Category[]>
  findById(id: string, organizationId: string): Promise<Category | null>
  findBySlug(slug: string, organizationId: string): Promise<Category | null>
  create(params: CreateCategoryParams): Promise<Category>
  update(id: string, organizationId: string, params: UpdateCategoryParams): Promise<Category>
  toggleActive(id: string, organizationId: string): Promise<Category>
  softDelete(id: string, organizationId: string): Promise<Category>
  restore(id: string, organizationId: string): Promise<Category>
}

export interface LocationRepository {
  list(organizationId: string, opts?: LocationListOptions): Promise<Location[]>
  listByLevel(organizationId: string, level: LocationLevel, opts?: RefListOptions): Promise<Location[]>
  listByParent(parentId: string, organizationId: string): Promise<Location[]>
  findById(id: string, organizationId: string): Promise<Location | null>
  create(params: CreateLocationParams): Promise<Location>
  update(id: string, organizationId: string, params: UpdateRefItemParams): Promise<Location>
  toggleActive(id: string, organizationId: string): Promise<Location>
  setActive(id: string, organizationId: string, active: boolean): Promise<Location>
  softDelete(id: string, organizationId: string): Promise<Location>
  restore(id: string, organizationId: string): Promise<Location>
}

export interface LanguageRepository {
  list(organizationId: string, opts?: RefListOptions): Promise<Language[]>
  findById(id: string, organizationId: string): Promise<Language | null>
  findBySlug(slug: string, organizationId: string): Promise<Language | null>
  create(params: CreateLanguageParams): Promise<Language>
  update(id: string, organizationId: string, params: UpdateLanguageParams): Promise<Language>
  toggleActive(id: string, organizationId: string): Promise<Language>
  softDelete(id: string, organizationId: string): Promise<Language>
  restore(id: string, organizationId: string): Promise<Language>
}

export interface TagRepository {
  list(organizationId: string, opts?: RefListOptions): Promise<Tag[]>
  findById(id: string, organizationId: string): Promise<Tag | null>
  create(params: CreateTagParams): Promise<Tag>
  update(id: string, organizationId: string, params: UpdateTagParams): Promise<Tag>
  toggleActive(id: string, organizationId: string): Promise<Tag>
  softDelete(id: string, organizationId: string): Promise<Tag>
}

// ── Phase 1: Content repository ──────────────────────────────────────────────

export interface ContentRepository {
  list(organizationId: string, opts?: ContentListOptions): Promise<Content[]>
  findById(id: string, organizationId: string): Promise<Content | null>
  create(params: CreateContentParams): Promise<Content>
  update(id: string, organizationId: string, params: UpdateContentParams): Promise<Content>
  updateStatus(id: string, organizationId: string, status: ContentStatus, note?: string | null): Promise<Content>
  toggleVisibility(id: string, organizationId: string, visible: boolean): Promise<Content>
  softDelete(id: string, organizationId: string): Promise<void>
  addTransition(params: AddTransitionParams): Promise<ContentTransition>
  listTransitions(contentId: string, organizationId: string): Promise<ContentTransition[]>
}

// ── Parameter shapes ─────────────────────────────────────────────────────────

export interface InviteUserParams {
  email: string
  name: string
  role: string
  organizationId: string
  invitedById: string
}

export interface AssignRoleParams {
  userId: string
  role: string
  organizationId: string
  assignedById: string
}

export interface CreateRoleParams {
  id: string
  organizationId: string
  name: string
  permissions: Capability[]
  isSystem: boolean
}

export interface UpdateRoleParams {
  name: string
  permissions: Capability[]
}

export interface AppendAuditParams {
  organizationId: string
  actorId: string
  actorName: string
  action: AuditAction
  targetType: 'user' | 'organization' | 'category' | 'location' | 'language' | 'tag' | 'content'
  targetId: string
  targetLabel: string
  metadata?: Record<string, unknown>
}

export interface AuditListOptions {
  limit?: number
  offset?: number
  before?: Date
  after?: Date
  action?: AuditAction | AuditAction[]
  targetType?: AuditTargetType
  targetId?: string
  actorId?: string
  search?: string        // searches actorName + targetLabel
  category?: AuditCategory
}

export type AuditCategory = 'auth' | 'user' | 'content' | 'notification' | 'reporter' | 'data' | 'org'

export const AUDIT_CATEGORY_ACTIONS: Record<AuditCategory, AuditAction[]> = {
  auth:         ['auth.login', 'auth.logout', 'auth.password_changed'],
  user:         ['user.invited', 'user.role_assigned', 'user.role_removed', 'user.removed'],
  content:      ['content.created', 'content.updated', 'content.transitioned', 'content.deleted', 'content.scheduled', 'content.published'],
  notification: ['notification.sent', 'notification.scheduled', 'notification.cancelled', 'notification.deleted'],
  reporter:     ['reporter.approved', 'reporter.rejected', 'reporter.earnings_released', 'reporter.commission_updated'],
  data:         ['category.created', 'category.updated', 'category.toggled', 'category.deleted', 'category.restored', 'location.created', 'location.updated', 'location.toggled', 'location.deleted', 'location.restored', 'language.created', 'language.updated', 'language.toggled', 'language.deleted', 'language.restored'],
  org:          ['org.settings_updated', 'org.role_created', 'org.role_updated', 'org.role_deleted'],
}

export interface RefListOptions {
  includeDeleted?: boolean
  activeOnly?: boolean
}

export interface LocationListOptions extends RefListOptions {
  level?: LocationLevel
  parentId?: string | null
}

export interface CreateCategoryParams {
  organizationId: string
  code: string
  name: string
  slug: string
}

export interface UpdateCategoryParams {
  code?: string
  name?: string
  slug?: string
}

export interface CreateLocationParams {
  organizationId: string
  name: string
  slug: string
  level: LocationLevel
  parentId?: string | null
}

export interface CreateLanguageParams {
  organizationId: string
  code: string
  name: string
  slug: string
}

export interface UpdateLanguageParams {
  code?: string
  name?: string
  slug?: string
}

export interface CreateTagParams {
  organizationId: string
  name: string
  slug: string
}

export interface UpdateTagParams {
  name?: string
  slug?: string
}

// kept for backward compat on generic ref helpers
export interface CreateRefItemParams {
  organizationId: string
  name: string
  slug: string
}

export interface UpdateRefItemParams {
  name?: string
  slug?: string
}

export interface ContentListOptions {
  type?: ContentType
  status?: ContentStatus
  categoryId?: string
  locationId?: string
  languageId?: string
  reporterId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export interface CreateContentParams {
  organizationId: string
  type: ContentType
  status: ContentStatus
  source: ContentSource
  title: string
  slug: string
  body?: string | null
  excerpt?: string | null
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  imageUrls?: string[]
  orientation?: string | null
  youtubeUrl?: string | null
  categoryId?: string | null
  locationId?: string | null
  languageId?: string | null
  reporterId?: string | null
  tags?: string[]
  isBreakingNews?: boolean
  isTrending?: boolean
  isFeatured?: boolean
  isVisibleInApp?: boolean
  scheduledAt?: Date | null
}

export interface UpdateContentParams {
  title?: string
  slug?: string
  body?: string | null
  excerpt?: string | null
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  imageUrls?: string[]
  orientation?: string | null
  youtubeUrl?: string | null
  categoryId?: string | null
  locationId?: string | null
  languageId?: string | null
  reporterId?: string | null
  tags?: string[]
  isBreakingNews?: boolean
  isTrending?: boolean
  isFeatured?: boolean
  scheduledAt?: Date | null
}

export interface AddTransitionParams {
  contentId: string
  fromStatus: ContentStatus | null
  toStatus: ContentStatus
  actorId: string
  actorName: string
  note?: string | null
}

// ── Notification repositories ─────────────────────────────────────────────────

export interface NotificationRepository {
  list(organizationId: string, opts?: NotificationListOptions): Promise<NotificationRecord[]>
  findById(id: string, organizationId: string): Promise<NotificationRecord | null>
  create(params: CreateNotificationParams): Promise<NotificationRecord>
  updateStatus(id: string, organizationId: string, status: NotificationStatus, sentAt?: Date): Promise<NotificationRecord>
  delete(id: string, organizationId: string): Promise<void>
  getStats(organizationId: string): Promise<NotificationStats>
}

export interface NotificationTemplateRepository {
  list(organizationId: string): Promise<NotificationTemplate[]>
  findById(id: string, organizationId: string): Promise<NotificationTemplate | null>
}

// ── RoleDefinitionRepository ─────────────────────────────────────────────────

export interface RoleDefinitionRepository {
  list(organizationId: string): Promise<import('@/types/domain').RoleDefinition[]>
  findById(id: string, organizationId: string): Promise<import('@/types/domain').RoleDefinition | null>
  create(params: CreateRoleParams): Promise<import('@/types/domain').RoleDefinition>
  update(id: string, organizationId: string, params: UpdateRoleParams): Promise<import('@/types/domain').RoleDefinition>
  delete(id: string, organizationId: string): Promise<void>
}

// ── Aggregate backend shape ──────────────────────────────────────────────────

export interface DataBackend {
  organizations: OrganizationRepository
  users: UserRepository
  roleAssignments: RoleAssignmentRepository
  roleDefinitions: RoleDefinitionRepository
  auditLog: AuditLogRepository
  categories: CategoryRepository
  locations: LocationRepository
  languages: LanguageRepository
  tags: TagRepository
  content: ContentRepository
  notifications: NotificationRepository
  notificationTemplates: NotificationTemplateRepository
  commissionRules: CommissionRuleRepository
  reporters: ReporterRepository
  contributors: ContributorRepository
}

// ── CommissionRule repository ─────────────────────────────────────────────────

export interface CommissionRuleRepository {
  list(organizationId: string): Promise<import('@/types/earnings').CommissionRule[]>
  findById(id: string, organizationId: string): Promise<import('@/types/earnings').CommissionRule | null>
  create(params: import('@/types/earnings').CommissionRule): Promise<import('@/types/earnings').CommissionRule>
  update(id: string, organizationId: string, params: Partial<import('@/types/earnings').CommissionRule>): Promise<import('@/types/earnings').CommissionRule>
  setDefault(id: string, organizationId: string): Promise<void>
  delete(id: string, organizationId: string): Promise<void>
}

// ── Reporter repository ───────────────────────────────────────────────────────

export interface ReporterListOptions {
  status?: string
  search?: string
  limit?: number
  offset?: number
}

export interface ReporterRepository {
  list(organizationId: string, opts?: ReporterListOptions): Promise<import('@/types/reporter').Reporter[]>
  findById(id: string, organizationId: string): Promise<import('@/types/reporter').Reporter | null>
  create(params: Omit<import('@/types/reporter').Reporter, 'createdAt' | 'updatedAt'>): Promise<import('@/types/reporter').Reporter>
  update(id: string, organizationId: string, params: Partial<import('@/types/reporter').Reporter>): Promise<import('@/types/reporter').Reporter>
  updateStatus(id: string, organizationId: string, status: string): Promise<import('@/types/reporter').Reporter>
  delete(id: string, organizationId: string): Promise<void>
}

// ── Contributor repository ────────────────────────────────────────────────────

export interface ContributorListOptions {
  status?: string
  search?: string
  limit?: number
  offset?: number
}

export interface ContributorRepository {
  list(organizationId: string, opts?: ContributorListOptions): Promise<import('@/lib/mock/contributors-store').Contributor[]>
  findById(id: string, organizationId: string): Promise<import('@/lib/mock/contributors-store').Contributor | null>
  create(params: Omit<import('@/lib/mock/contributors-store').Contributor, 'createdAt' | 'updatedAt'>): Promise<import('@/lib/mock/contributors-store').Contributor>
  update(id: string, organizationId: string, params: Partial<import('@/lib/mock/contributors-store').Contributor>): Promise<import('@/lib/mock/contributors-store').Contributor>
  updateStatus(id: string, organizationId: string, status: string, meta?: { approvedBy?: string; rejectedOn?: Date; remarks?: string }): Promise<import('@/lib/mock/contributors-store').Contributor>
  delete(id: string, organizationId: string): Promise<void>
}

// ── Notification params ───────────────────────────────────────────────────────

export interface NotificationListOptions {
  status?: NotificationStatus
  search?: string
  limit?: number
  offset?: number
}

export interface CreateNotificationParams {
  organizationId: string
  title: string
  body: string
  imageUrl?: string | null
  deepLink?: string | null
  channels: NotificationChannel[]
  audience: NotificationAudience
  audienceValue?: string | null
  priority: NotificationPriority
  status: NotificationStatus
  templateId?: string | null
  scheduledAt?: Date | null
  sentBy: string
  sentByName: string
  estimatedRecipients: number
}
