import type {
  OrganizationRepository,
  UserRepository,
  RoleAssignmentRepository,
  RoleDefinitionRepository,
  AuditLogRepository,
  CategoryRepository,
  LocationRepository,
  LanguageRepository,
  ContentRepository,
  NotificationRepository,
  NotificationTemplateRepository,
  InviteUserParams,
  AssignRoleParams,
  CreateRoleParams,
  UpdateRoleParams,
  AppendAuditParams,
  AuditListOptions,
  RefListOptions,
  LocationListOptions,
  CreateCategoryParams,
  UpdateCategoryParams,
  CreateLocationParams,
  CreateLanguageParams,
  UpdateLanguageParams,
  UpdateRefItemParams,
  ContentListOptions,
  CreateContentParams,
  UpdateContentParams,
  AddTransitionParams,
  NotificationListOptions,
  CreateNotificationParams,
} from '@/lib/data/repositories'
import type {
  Organization,
  UserWithRole,
  RoleDefinition,
  RoleAssignment,
  AuditEntry,
  Category,
  Location,
  Language,
  Content,
  ContentTransition,
  ContentStatus,
  LocationLevel,
  NotificationRecord,
  NotificationTemplate,
  NotificationStats,
  NotificationStatus,
} from '@/types/domain'
import { setRolePermissions, deleteRolePermissions } from '@/lib/rbac/permissions'
import { MissingOrgContextError, WrongOrgError, NotFoundError } from '@/lib/errors'

// ── Guard ─────────────────────────────────────────────────────────────────────

function assertOrg(organizationId: string): void {
  // Runtime check — callers receive `string` from TypeScript, but server actions
  // can pass an empty/undefined value if org context was never set.
  if (!organizationId) throw new MissingOrgContextError()
}

// ── OrganizationRepository ────────────────────────────────────────────────────

export class MockOrganizationRepository implements OrganizationRepository {
  private orgs: Map<string, Organization>

  constructor(orgs: Organization[]) {
    this.orgs = new Map(orgs.map(o => [o.id, o]))
  }

  async findById(organizationId: string): Promise<Organization | null> {
    assertOrg(organizationId)
    return this.orgs.get(organizationId) ?? null
  }
}

// ── UserRepository ────────────────────────────────────────────────────────────

export class MockUserRepository implements UserRepository {
  private users: Map<string, UserWithRole>
  private nextSeq = 1

  constructor(users: UserWithRole[]) {
    this.users = new Map(users.map(u => [u.id, u]))
  }

  async listByOrg(organizationId: string): Promise<UserWithRole[]> {
    assertOrg(organizationId)
    return [...this.users.values()].filter(u => u.organizationId === organizationId)
  }

  async findById(userId: string, organizationId: string): Promise<UserWithRole | null> {
    assertOrg(organizationId)
    const user = this.users.get(userId)
    if (!user) return null
    if (user.organizationId !== organizationId) return null
    return user
  }

  async findByEmail(email: string, organizationId: string): Promise<UserWithRole | null> {
    assertOrg(organizationId)
    const user = [...this.users.values()].find(u => u.email === email)
    if (!user) return null
    if (user.organizationId !== organizationId) return null
    return user
  }

  async invite(params: InviteUserParams): Promise<UserWithRole> {
    assertOrg(params.organizationId)
    const user: UserWithRole = {
      id: `user_invited_${this.nextSeq++}`,
      email: params.email,
      name: params.name,
      role: params.role,
      organizationId: params.organizationId,
      invitedAt: new Date(),
      joinedAt: null,
    }
    this.users.set(user.id, user)
    return user
  }

  async remove(userId: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const user = this.users.get(userId)
    if (!user) throw new NotFoundError('User')
    if (user.organizationId !== organizationId) throw new WrongOrgError()
    this.users.delete(userId)
  }
}

// ── RoleAssignmentRepository ──────────────────────────────────────────────────

export class MockRoleAssignmentRepository implements RoleAssignmentRepository {
  private assignments: Map<string, RoleAssignment>

  constructor(assignments: RoleAssignment[]) {
    this.assignments = new Map(assignments.map(a => [a.userId, a]))
  }

  async assign(params: AssignRoleParams): Promise<RoleAssignment> {
    assertOrg(params.organizationId)
    const assignment: RoleAssignment = {
      userId: params.userId,
      role: params.role,
      organizationId: params.organizationId,
      assignedAt: new Date(),
      assignedBy: params.assignedById,
    }
    this.assignments.set(params.userId, assignment)
    return assignment
  }

  async remove(userId: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const a = this.assignments.get(userId)
    if (!a) throw new NotFoundError('RoleAssignment')
    if (a.organizationId !== organizationId) throw new WrongOrgError()
    this.assignments.delete(userId)
  }

  async findByUser(userId: string, organizationId: string): Promise<RoleAssignment | null> {
    assertOrg(organizationId)
    const a = this.assignments.get(userId)
    if (!a || a.organizationId !== organizationId) return null
    return a
  }
}

// ── AuditLogRepository ────────────────────────────────────────────────────────

export class MockAuditLogRepository implements AuditLogRepository {
  private entries: AuditEntry[]
  private nextSeq = 1

  constructor(entries: AuditEntry[]) {
    this.entries = [...entries]
  }

  async list(organizationId: string, opts?: AuditListOptions): Promise<AuditEntry[]> {
    assertOrg(organizationId)
    let results = this.entries.filter(e => e.organizationId === organizationId)
    if (opts?.before)    results = results.filter(e => e.createdAt < opts.before!)
    if (opts?.after)     results = results.filter(e => e.createdAt > opts.after!)
    if (opts?.actorId)    results = results.filter(e => e.actorId === opts.actorId)
    if (opts?.targetType) results = results.filter(e => e.targetType === opts.targetType)
    if (opts?.targetId)   results = results.filter(e => e.targetId === opts.targetId)
    if (opts?.action) {
      const actions = Array.isArray(opts.action) ? opts.action : [opts.action]
      results = results.filter(e => actions.includes(e.action))
    }
    if (opts?.category) {
      const { AUDIT_CATEGORY_ACTIONS } = await import('@/lib/data/repositories')
      const allowed = AUDIT_CATEGORY_ACTIONS[opts.category] ?? []
      results = results.filter(e => allowed.includes(e.action))
    }
    if (opts?.search) {
      const q = opts.search.toLowerCase()
      results = results.filter(e =>
        e.actorName.toLowerCase().includes(q) ||
        e.targetLabel.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q)
      )
    }
    results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const offset = opts?.offset ?? 0
    if (opts?.limit) results = results.slice(offset, offset + opts.limit)
    return results
  }

  async append(params: AppendAuditParams): Promise<AuditEntry> {
    assertOrg(params.organizationId)
    const entry: AuditEntry = {
      id: `audit_${this.nextSeq++}`,
      organizationId: params.organizationId,
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
    }
    this.entries.push(entry)
    return entry
  }
}

// ── Generic ref-data helpers ──────────────────────────────────────────────────

function applyRefListOpts<T extends { deletedAt: Date | null; active: boolean }>(
  items: T[],
  opts?: RefListOptions,
): T[] {
  if (opts?.activeOnly) return items.filter(i => i.active && !i.deletedAt)
  if (!opts?.includeDeleted) return items.filter(i => !i.deletedAt)
  return items
}

// ── MockCategoryRepository ────────────────────────────────────────────────────

export class MockCategoryRepository implements CategoryRepository {
  private items: Map<string, Category>
  private nextSeq = 1

  constructor(items: Category[]) {
    this.items = new Map(items.map(i => [i.id, i]))
  }

  async list(organizationId: string, opts?: RefListOptions): Promise<Category[]> {
    assertOrg(organizationId)
    const all = [...this.items.values()].filter(i => i.organizationId === organizationId)
    return applyRefListOpts(all, opts)
  }

  async findById(id: string, organizationId: string): Promise<Category | null> {
    assertOrg(organizationId)
    const item = this.items.get(id) ?? null
    if (!item || item.organizationId !== organizationId) return null
    return item
  }

  async findBySlug(slug: string, organizationId: string): Promise<Category | null> {
    assertOrg(organizationId)
    return [...this.items.values()].find(
      i => i.slug === slug && i.organizationId === organizationId,
    ) ?? null
  }

  async create(params: CreateCategoryParams): Promise<Category> {
    assertOrg(params.organizationId)
    const item: Category = {
      id: `cat_${this.nextSeq++}`,
      organizationId: params.organizationId,
      code: params.code,
      name: params.name,
      slug: params.slug,
      active: true,
      deletedAt: null,
      createdAt: new Date(),
    }
    this.items.set(item.id, item)
    return item
  }

  async update(id: string, organizationId: string, params: UpdateCategoryParams): Promise<Category> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Category')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, ...params }
    this.items.set(id, updated)
    return updated
  }

  async toggleActive(id: string, organizationId: string): Promise<Category> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Category')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, active: !item.active }
    this.items.set(id, updated)
    return updated
  }

  async softDelete(id: string, organizationId: string): Promise<Category> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Category')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, deletedAt: new Date() }
    this.items.set(id, updated)
    return updated
  }

  async restore(id: string, organizationId: string): Promise<Category> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Category')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, deletedAt: null }
    this.items.set(id, updated)
    return updated
  }
}

// ── MockLocationRepository ────────────────────────────────────────────────────

export class MockLocationRepository implements LocationRepository {
  private items: Map<string, Location>
  private nextSeq = 1

  constructor(items: Location[]) {
    this.items = new Map(items.map(i => [i.id, i]))
  }

  async list(organizationId: string, opts?: LocationListOptions): Promise<Location[]> {
    assertOrg(organizationId)
    let all = [...this.items.values()].filter(i => i.organizationId === organizationId)
    if (opts?.level) all = all.filter(i => i.level === opts.level)
    if (opts?.parentId !== undefined) all = all.filter(i => i.parentId === opts.parentId)
    return applyRefListOpts(all, opts)
  }

  async listByLevel(organizationId: string, level: LocationLevel, opts?: RefListOptions): Promise<Location[]> {
    assertOrg(organizationId)
    const all = [...this.items.values()].filter(
      i => i.organizationId === organizationId && i.level === level,
    )
    return applyRefListOpts(all, opts)
  }

  async listByParent(parentId: string, organizationId: string): Promise<Location[]> {
    assertOrg(organizationId)
    return [...this.items.values()].filter(
      i => i.organizationId === organizationId && i.parentId === parentId && !i.deletedAt,
    )
  }

  async findById(id: string, organizationId: string): Promise<Location | null> {
    assertOrg(organizationId)
    const item = this.items.get(id) ?? null
    if (!item || item.organizationId !== organizationId) return null
    return item
  }

  async findBySlug(slug: string, organizationId: string): Promise<Location | null> {
    assertOrg(organizationId)
    return [...this.items.values()].find(
      i => i.slug === slug && i.organizationId === organizationId,
    ) ?? null
  }

  async create(params: CreateLocationParams): Promise<Location> {
    assertOrg(params.organizationId)
    const parentName = params.parentId
      ? (this.items.get(params.parentId)?.name ?? null)
      : null
    const item: Location = {
      id: `loc_${this.nextSeq++}`,
      organizationId: params.organizationId,
      name: params.name,
      slug: params.slug,
      level: params.level,
      parentId: params.parentId ?? null,
      parentName,
      active: true,
      deletedAt: null,
      createdAt: new Date(),
    }
    this.items.set(item.id, item)
    return item
  }

  async update(id: string, organizationId: string, params: UpdateRefItemParams): Promise<Location> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Location')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, ...params }
    this.items.set(id, updated)
    return updated
  }

  async toggleActive(id: string, organizationId: string): Promise<Location> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Location')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, active: !item.active }
    this.items.set(id, updated)
    return updated
  }

  async setActive(id: string, organizationId: string, active: boolean): Promise<Location> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Location')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, active }
    this.items.set(id, updated)
    return updated
  }

  async softDelete(id: string, organizationId: string): Promise<Location> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Location')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, deletedAt: new Date() }
    this.items.set(id, updated)
    return updated
  }

  async restore(id: string, organizationId: string): Promise<Location> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Location')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, deletedAt: null }
    this.items.set(id, updated)
    return updated
  }
}

// ── MockLanguageRepository ────────────────────────────────────────────────────

export class MockLanguageRepository implements LanguageRepository {
  private items: Map<string, Language>
  private nextSeq = 1

  constructor(items: Language[]) {
    this.items = new Map(items.map(i => [i.id, i]))
  }

  async list(organizationId: string, opts?: RefListOptions): Promise<Language[]> {
    assertOrg(organizationId)
    const all = [...this.items.values()].filter(i => i.organizationId === organizationId)
    return applyRefListOpts(all, opts)
  }

  async findById(id: string, organizationId: string): Promise<Language | null> {
    assertOrg(organizationId)
    const item = this.items.get(id) ?? null
    if (!item || item.organizationId !== organizationId) return null
    return item
  }

  async findBySlug(slug: string, organizationId: string): Promise<Language | null> {
    assertOrg(organizationId)
    return [...this.items.values()].find(
      i => i.slug === slug && i.organizationId === organizationId,
    ) ?? null
  }

  async create(params: CreateLanguageParams): Promise<Language> {
    assertOrg(params.organizationId)
    const item: Language = {
      id: `lang_${this.nextSeq++}`,
      organizationId: params.organizationId,
      code: params.code,
      name: params.name,
      slug: params.slug,
      active: true,
      deletedAt: null,
      createdAt: new Date(),
    }
    this.items.set(item.id, item)
    return item
  }

  async update(id: string, organizationId: string, params: UpdateLanguageParams): Promise<Language> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Language')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, ...params }
    this.items.set(id, updated)
    return updated
  }

  async toggleActive(id: string, organizationId: string): Promise<Language> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Language')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, active: !item.active }
    this.items.set(id, updated)
    return updated
  }

  async softDelete(id: string, organizationId: string): Promise<Language> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Language')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, deletedAt: new Date() }
    this.items.set(id, updated)
    return updated
  }

  async restore(id: string, organizationId: string): Promise<Language> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Language')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, deletedAt: null }
    this.items.set(id, updated)
    return updated
  }
}

// ── MockContentRepository ─────────────────────────────────────────────────────

export class MockContentRepository implements ContentRepository {
  private items: Map<string, Content>
  private deletedIds = new Set<string>()
  private transitions: ContentTransition[]
  private nextContentSeq = 1
  private nextTransitionSeq = 1

  constructor(items: Content[]) {
    this.items = new Map(items.map(i => [i.id, i]))
    this.transitions = []
  }

  async list(organizationId: string, opts?: ContentListOptions): Promise<Content[]> {
    assertOrg(organizationId)
    let results = [...this.items.values()].filter(
      i => i.organizationId === organizationId && !this.deletedIds.has(i.id),
    )
    if (opts?.type) results = results.filter(i => i.type === opts.type)
    if (opts?.status) results = results.filter(i => i.status === opts.status)
    if (opts?.categoryId) results = results.filter(i => i.categoryId === opts.categoryId)
    if (opts?.locationId) results = results.filter(i => i.locationId === opts.locationId)
    if (opts?.languageId) results = results.filter(i => i.languageId === opts.languageId)
    if (opts?.reporterId) results = results.filter(i => i.reporterId === opts.reporterId)
    if (opts?.search) {
      const q = opts.search.toLowerCase()
      results = results.filter(
        i => i.title.toLowerCase().includes(q) || (i.excerpt ?? '').toLowerCase().includes(q),
      )
    }
    if (opts?.dateFrom) {
      const from = new Date(opts.dateFrom)
      results = results.filter(i => i.createdAt >= from)
    }
    if (opts?.dateTo) {
      const to = new Date(opts.dateTo)
      to.setHours(23, 59, 59, 999)
      results = results.filter(i => i.createdAt <= to)
    }
    results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const offset = opts?.offset ?? 0
    const limit = opts?.limit ?? 50
    return results.slice(offset, offset + limit)
  }

  async findById(id: string, organizationId: string): Promise<Content | null> {
    assertOrg(organizationId)
    const item = this.items.get(id) ?? null
    if (!item || item.organizationId !== organizationId) return null
    return item
  }

  async create(params: CreateContentParams): Promise<Content> {
    assertOrg(params.organizationId)
    const now = new Date()
    const item: Content = {
      id: `content_${this.nextContentSeq++}`,
      organizationId: params.organizationId,
      type: params.type,
      status: params.status,
      source: params.source,
      title: params.title,
      slug: params.slug,
      body: params.body ?? null,
      excerpt: params.excerpt ?? null,
      mediaUrl: params.mediaUrl ?? null,
      thumbnailUrl: params.thumbnailUrl ?? null,
      youtubeUrl: params.youtubeUrl ?? null,
      categoryId: params.categoryId ?? null,
      locationId: params.locationId ?? null,
      languageId: params.languageId ?? null,
      reporterId: params.reporterId ?? null,
      tags: params.tags ?? [],
      isBreakingNews: params.isBreakingNews ?? false,
      isTrending: params.isTrending ?? false,
      isFeatured: params.isFeatured ?? false,
      isVisibleInApp: params.isVisibleInApp ?? true,
      scheduledAt: params.scheduledAt ?? null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    this.items.set(item.id, item)
    return item
  }

  async update(id: string, organizationId: string, params: UpdateContentParams): Promise<Content> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Content')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, ...params, updatedAt: new Date() }
    this.items.set(id, updated)
    return updated
  }

  async updateStatus(id: string, organizationId: string, status: ContentStatus, note?: string | null): Promise<Content> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Content')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const publishedAt = status === 'PUBLISHED' ? new Date() : item.publishedAt
    const rejectionNote = status === 'NEEDS_CLARIFICATION' ? (note ?? item.rejectionNote ?? null) : item.rejectionNote
    const updated = { ...item, status, publishedAt, rejectionNote, updatedAt: new Date() }
    this.items.set(id, updated)
    return updated
  }

  async toggleVisibility(id: string, organizationId: string, visible: boolean): Promise<Content> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Content')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    const updated = { ...item, isVisibleInApp: visible, updatedAt: new Date() }
    this.items.set(id, updated)
    return updated
  }

  async softDelete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item) throw new NotFoundError('Content')
    if (item.organizationId !== organizationId) throw new WrongOrgError()
    this.deletedIds.add(id)
  }

  async addTransition(params: AddTransitionParams): Promise<ContentTransition> {
    const transition: ContentTransition = {
      id: `trans_${this.nextTransitionSeq++}`,
      contentId: params.contentId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      actorId: params.actorId,
      actorName: params.actorName,
      note: params.note ?? null,
      createdAt: new Date(),
    }
    this.transitions.push(transition)
    return transition
  }

  async listTransitions(contentId: string, organizationId: string): Promise<ContentTransition[]> {
    assertOrg(organizationId)
    // Verify content belongs to org
    const item = this.items.get(contentId)
    if (!item || item.organizationId !== organizationId) return []
    return this.transitions
      .filter(t => t.contentId === contentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}

// ── RoleDefinitionRepository ──────────────────────────────────────────────────

export class MockRoleDefinitionRepository implements RoleDefinitionRepository {
  private roles: Map<string, RoleDefinition>
  private nextSeq = 1

  constructor(roles: RoleDefinition[]) {
    this.roles = new Map(roles.map(r => [r.id, r]))
  }

  async list(organizationId: string): Promise<RoleDefinition[]> {
    assertOrg(organizationId)
    return [...this.roles.values()].filter(r => r.organizationId === organizationId)
      .sort((a, b) => (a.isSystem ? 0 : 1) - (b.isSystem ? 0 : 1) || a.name.localeCompare(b.name))
  }

  async findById(id: string, organizationId: string): Promise<RoleDefinition | null> {
    assertOrg(organizationId)
    const r = this.roles.get(id)
    if (!r || r.organizationId !== organizationId) return null
    return r
  }

  async create(params: CreateRoleParams): Promise<RoleDefinition> {
    assertOrg(params.organizationId)
    const id = params.id || `role_custom_${this.nextSeq++}`
    const role: RoleDefinition = {
      id,
      organizationId: params.organizationId,
      name: params.name,
      permissions: [...params.permissions],
      isSystem: params.isSystem,
      createdAt: new Date(),
    }
    this.roles.set(id, role)
    setRolePermissions(id, params.permissions)
    return role
  }

  async update(id: string, organizationId: string, params: UpdateRoleParams): Promise<RoleDefinition> {
    assertOrg(organizationId)
    const existing = this.roles.get(id)
    if (!existing || existing.organizationId !== organizationId) throw new NotFoundError('Role')
    const updated: RoleDefinition = { ...existing, name: params.name, permissions: [...params.permissions] }
    this.roles.set(id, updated)
    setRolePermissions(id, params.permissions)
    return updated
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const existing = this.roles.get(id)
    if (!existing || existing.organizationId !== organizationId) throw new NotFoundError('Role')
    if (existing.isSystem) throw new Error('System roles cannot be deleted')
    this.roles.delete(id)
    deleteRolePermissions(id)
  }
}

// ── MockNotificationRepository ────────────────────────────────────────────────

export class MockNotificationRepository implements NotificationRepository {
  private items: Map<string, NotificationRecord>
  private nextSeq = 1

  constructor(items: NotificationRecord[]) {
    this.items = new Map(items.map(i => [i.id, i]))
  }

  async list(organizationId: string, opts?: NotificationListOptions): Promise<NotificationRecord[]> {
    assertOrg(organizationId)
    let results = [...this.items.values()].filter(n => n.organizationId === organizationId)
    if (opts?.status) results = results.filter(n => n.status === opts.status)
    if (opts?.search) {
      const q = opts.search.toLowerCase()
      results = results.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
    }
    results = results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (opts?.limit) results = results.slice(opts.offset ?? 0, (opts.offset ?? 0) + opts.limit)
    return results
  }

  async findById(id: string, organizationId: string): Promise<NotificationRecord | null> {
    assertOrg(organizationId)
    const item = this.items.get(id) ?? null
    if (!item || item.organizationId !== organizationId) return null
    return item
  }

  async create(params: CreateNotificationParams): Promise<NotificationRecord> {
    assertOrg(params.organizationId)
    const now = new Date()
    const item: NotificationRecord = {
      id: `notif_${this.nextSeq++}`,
      organizationId: params.organizationId,
      title: params.title,
      body: params.body,
      imageUrl: params.imageUrl ?? null,
      deepLink: params.deepLink ?? null,
      channels: params.channels,
      audience: params.audience,
      audienceValue: params.audienceValue ?? null,
      priority: params.priority,
      status: params.status,
      templateId: params.templateId ?? null,
      scheduledAt: params.scheduledAt ?? null,
      sentAt: params.status === 'SENT' ? now : null,
      sentBy: params.sentBy,
      sentByName: params.sentByName,
      estimatedRecipients: params.estimatedRecipients,
      deliveredCount: params.status === 'SENT' ? Math.floor(params.estimatedRecipients * 0.94) : 0,
      openedCount: params.status === 'SENT' ? Math.floor(params.estimatedRecipients * 0.32) : 0,
      failedCount: params.status === 'SENT' ? Math.floor(params.estimatedRecipients * 0.06) : 0,
      createdAt: now,
      updatedAt: now,
    }
    this.items.set(item.id, item)
    return item
  }

  async updateStatus(id: string, organizationId: string, status: NotificationStatus, sentAt?: Date): Promise<NotificationRecord> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item || item.organizationId !== organizationId) throw new NotFoundError('Notification')
    const updated: NotificationRecord = {
      ...item,
      status,
      sentAt: sentAt ?? item.sentAt,
      updatedAt: new Date(),
    }
    this.items.set(id, updated)
    return updated
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const item = this.items.get(id)
    if (!item || item.organizationId !== organizationId) throw new NotFoundError('Notification')
    this.items.delete(id)
  }

  async getStats(organizationId: string): Promise<NotificationStats> {
    assertOrg(organizationId)
    const all = [...this.items.values()].filter(n => n.organizationId === organizationId)
    const sent = all.filter(n => n.status === 'SENT')
    const totalRecipients = sent.reduce((s, n) => s + n.estimatedRecipients, 0)
    const totalDelivered = sent.reduce((s, n) => s + n.deliveredCount, 0)
    const totalOpened = sent.reduce((s, n) => s + n.openedCount, 0)
    return {
      totalSent: sent.length,
      totalScheduled: all.filter(n => n.status === 'SCHEDULED').length,
      totalDraft: all.filter(n => n.status === 'DRAFT').length,
      totalFailed: all.filter(n => n.status === 'FAILED').length,
      totalRecipients,
      totalDelivered,
      totalOpened,
      openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
      deliveryRate: totalRecipients > 0 ? Math.round((totalDelivered / totalRecipients) * 100) : 0,
    }
  }
}

// ── MockNotificationTemplateRepository ───────────────────────────────────────

export class MockNotificationTemplateRepository implements NotificationTemplateRepository {
  private items: Map<string, NotificationTemplate>

  constructor(items: NotificationTemplate[]) {
    this.items = new Map(items.map(i => [i.id, i]))
  }

  async list(organizationId: string): Promise<NotificationTemplate[]> {
    assertOrg(organizationId)
    return [...this.items.values()].filter(t => t.organizationId === organizationId)
  }

  async findById(id: string, organizationId: string): Promise<NotificationTemplate | null> {
    assertOrg(organizationId)
    const item = this.items.get(id) ?? null
    if (!item || item.organizationId !== organizationId) return null
    return item
  }
}
