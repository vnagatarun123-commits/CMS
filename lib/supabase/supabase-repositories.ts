import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  Profile,
  Organization,
  RoleAssignment as PrismaRoleAssignment,
  AuditLog,
  Category as PrismaCategory,
  Location as PrismaLocation,
  Language as PrismaLanguage,
  Content as PrismaContent,
  ContentTransition as PrismaContentTransition,
} from '@prisma/client'
import type {
  OrganizationRepository,
  UserRepository,
  RoleAssignmentRepository,
  AuditLogRepository,
  CategoryRepository,
  LocationRepository,
  LanguageRepository,
  ContentRepository,
  InviteUserParams,
  AssignRoleParams,
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
} from '@/lib/data/repositories'
import type {
  Organization as DomainOrg,
  UserWithRole,
  RoleAssignment,
  AuditEntry,
  Category,
  Location,
  Language,
  Content,
  ContentTransition,
  ContentStatus,
  ContentType,
  ContentSource,
  LocationLevel,
} from '@/types/domain'
import type { Role } from '@/lib/rbac/permissions'
import type { AuditAction, AuditTargetType } from '@/types/domain'
import { MissingOrgContextError, NotFoundError, WrongOrgError } from '@/lib/errors'

// ── App-layer guard (first line of defense; RLS is the second) ────────────────

function assertOrg(organizationId: string): void {
  if (!organizationId) throw new MissingOrgContextError()
}

// ── Path B: withOrgContext ────────────────────────────────────────────────────
// Runs the callback with the org ID asserted. Every query also carries an
// explicit `organizationId` WHERE clause as the primary isolation fence.
//
// NOTE: PgBouncer transaction mode (port 6543) does NOT support Prisma
// interactive transactions ($transaction callback form). We therefore skip
// SET LOCAL ROLE / set_config here and rely on the app-layer WHERE filter.
// RLS via set_config can be re-enabled when the direct connection is used.

async function withOrgContext<T>(
  prisma: PrismaClient,
  organizationId: string,
  fn: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return fn(prisma)
}

// ── Domain mappers ────────────────────────────────────────────────────────────

type ProfileWithRole = Profile & { roleAssignments: PrismaRoleAssignment[] }

function toUserWithRole(p: ProfileWithRole): UserWithRole {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: (p.roleAssignments[0]?.role ?? 'REPORTER') as Role,
    organizationId: p.organizationId,
    invitedAt: p.invitedAt,
    joinedAt: p.joinedAt,
  }
}

function toOrganization(o: Organization): DomainOrg {
  return { id: o.id, name: o.name, slug: o.slug, createdAt: o.createdAt }
}

function toRoleAssignment(ra: PrismaRoleAssignment): RoleAssignment {
  return {
    userId: ra.userId,
    role: ra.role as Role,
    organizationId: ra.organizationId,
    assignedAt: ra.assignedAt,
    assignedBy: ra.assignedById ?? '',
  }
}

function toAuditEntry(log: AuditLog): AuditEntry {
  return {
    id: log.id,
    organizationId: log.organizationId,
    actorId: log.actorId,
    actorName: log.actorName,
    action: log.action as AuditAction,
    targetType: (log.targetType ?? 'user') as AuditTargetType,
    targetId: log.targetId ?? '',
    targetLabel: log.targetLabel ?? '',
    metadata: (log.metadata ?? {}) as Record<string, unknown>,
    createdAt: log.createdAt,
  }
}

// ── OrganizationRepository ────────────────────────────────────────────────────

export class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(organizationId: string): Promise<DomainOrg | null> {
    assertOrg(organizationId)
    const org = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.organization.findUnique({ where: { id: organizationId } }),
    )
    return org ? toOrganization(org) : null
  }
}

// ── UserRepository ────────────────────────────────────────────────────────────

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByOrg(organizationId: string): Promise<UserWithRole[]> {
    assertOrg(organizationId)
    const profiles = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.profile.findMany({
        where: { organizationId },
        include: { roleAssignments: { where: { organizationId } } },
      }),
    )
    return profiles.map(toUserWithRole)
  }

  async findById(userId: string, organizationId: string): Promise<UserWithRole | null> {
    assertOrg(organizationId)
    const profile = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.profile.findFirst({
        where: { id: userId, organizationId },
        include: { roleAssignments: { where: { organizationId } } },
      }),
    )
    return profile ? toUserWithRole(profile) : null
  }

  async findByEmail(email: string, organizationId: string): Promise<UserWithRole | null> {
    assertOrg(organizationId)
    const profile = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.profile.findFirst({
        where: { email, organizationId },
        include: { roleAssignments: { where: { organizationId } } },
      }),
    )
    return profile ? toUserWithRole(profile) : null
  }

  async invite(params: InviteUserParams): Promise<UserWithRole> {
    assertOrg(params.organizationId)
    const id = crypto.randomUUID()
    const now = new Date()
    const profile = await withOrgContext(this.prisma, params.organizationId, async (tx) => {
      const created = await tx.profile.create({
        data: {
          id,
          email: params.email,
          name: params.name,
          organizationId: params.organizationId,
          invitedAt: now,
        },
      })
      await tx.roleAssignment.create({
        data: {
          userId: id,
          organizationId: params.organizationId,
          role: params.role,
          assignedById: params.invitedById,
        },
      })
      return tx.profile.findUniqueOrThrow({
        where: { id: created.id },
        include: { roleAssignments: { where: { organizationId: params.organizationId } } },
      })
    })
    return toUserWithRole(profile)
  }

  async remove(userId: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    await withOrgContext(this.prisma, organizationId, async (tx) => {
      const profile = await tx.profile.findFirst({ where: { id: userId } })
      if (!profile) throw new NotFoundError('User')
      if (profile.organizationId !== organizationId) throw new WrongOrgError()
      await tx.roleAssignment.deleteMany({ where: { userId, organizationId } })
      await tx.profile.delete({ where: { id: userId } })
    })
  }
}

// ── RoleAssignmentRepository ──────────────────────────────────────────────────

export class SupabaseRoleAssignmentRepository implements RoleAssignmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async assign(params: AssignRoleParams): Promise<RoleAssignment> {
    assertOrg(params.organizationId)
    const ra = await withOrgContext(this.prisma, params.organizationId, (tx) =>
      tx.roleAssignment.upsert({
        where: {
          userId_organizationId: {
            userId: params.userId,
            organizationId: params.organizationId,
          },
        },
        update: { role: params.role, assignedById: params.assignedById },
        create: {
          userId: params.userId,
          organizationId: params.organizationId,
          role: params.role,
          assignedById: params.assignedById,
        },
      }),
    )
    return toRoleAssignment(ra)
  }

  async remove(userId: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    await withOrgContext(this.prisma, organizationId, async (tx) => {
      const ra = await tx.roleAssignment.findFirst({ where: { userId, organizationId } })
      if (!ra) throw new NotFoundError('RoleAssignment')
      await tx.roleAssignment.delete({
        where: { userId_organizationId: { userId, organizationId } },
      })
    })
  }

  async findByUser(userId: string, organizationId: string): Promise<RoleAssignment | null> {
    assertOrg(organizationId)
    const ra = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.roleAssignment.findFirst({ where: { userId, organizationId } }),
    )
    return ra ? toRoleAssignment(ra) : null
  }
}

// ── AuditLogRepository ────────────────────────────────────────────────────────

export class SupabaseAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: AuditListOptions): Promise<AuditEntry[]> {
    assertOrg(organizationId)
    const entries = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.auditLog.findMany({
        where: {
          organizationId,
          ...(opts?.targetType ? { targetType: opts.targetType } : {}),
          ...(opts?.targetId   ? { targetId:   opts.targetId   } : {}),
          ...(opts?.actorId    ? { actorId:     opts.actorId    } : {}),
          ...(opts?.before     ? { createdAt: { lt: opts.before } } : {}),
          ...(opts?.after      ? { createdAt: { gt: opts.after  } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        ...(opts?.limit ? { take: opts.limit } : {}),
      }),
    )
    return entries.map(toAuditEntry)
  }

  async append(params: AppendAuditParams): Promise<AuditEntry> {
    assertOrg(params.organizationId)
    const entry = await withOrgContext(this.prisma, params.organizationId, (tx) =>
      tx.auditLog.create({
        data: {
          organizationId: params.organizationId,
          actorId: params.actorId,
          actorName: params.actorName,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          targetLabel: params.targetLabel,
          metadata: (params.metadata ?? {}) as unknown as Prisma.InputJsonValue,
        },
      }),
    )
    return toAuditEntry(entry)
  }
}

// ── Domain mappers: reference data ───────────────────────────────────────────

function toCategory(r: PrismaCategory): Category {
  return {
    id: r.id,
    organizationId: r.organizationId,
    code: r.code,
    name: r.name,
    slug: r.slug,
    active: r.active,
    deletedAt: r.deletedAt,
    createdAt: r.createdAt,
  }
}

const locationIncludes = { parent: { select: { name: true } } } as const
type LocationWithParent = Prisma.LocationGetPayload<{ include: typeof locationIncludes }>

function toLocation(r: LocationWithParent): Location {
  return {
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    slug: r.slug,
    level: r.level as LocationLevel,
    parentId: r.parentId ?? null,
    parentName: r.parent?.name ?? null,
    active: r.active,
    deletedAt: r.deletedAt,
    createdAt: r.createdAt,
  }
}

function toLanguage(r: PrismaLanguage): Language {
  return {
    id: r.id,
    organizationId: r.organizationId,
    code: r.code,
    name: r.name,
    slug: r.slug,
    active: r.active,
    deletedAt: r.deletedAt,
    createdAt: r.createdAt,
  }
}

type ContentWithJoins = Prisma.ContentGetPayload<{ include: typeof contentIncludes }>

function toContent(r: ContentWithJoins): Content {
  return {
    id: r.id,
    organizationId: r.organizationId,
    type: r.type as ContentType,
    status: r.status as ContentStatus,
    source: r.source as ContentSource,
    title: r.title,
    slug: r.slug,
    body: r.body,
    excerpt: r.excerpt,
    mediaUrl: r.mediaUrl,
    thumbnailUrl: r.thumbnailUrl ?? null,
    imageUrls: r.imageUrls ?? [],
    orientation: r.orientation ?? null,
    youtubeUrl: r.youtubeUrl,
    categoryId: r.categoryId,
    locationId: r.locationId,
    languageId: r.languageId,
    reporterId: r.reporterId,
    tags: (r as { tags?: string[] }).tags ?? [],
    isBreakingNews: (r as { isBreakingNews?: boolean }).isBreakingNews ?? false,
    isTrending: (r as { isTrending?: boolean }).isTrending ?? false,
    isFeatured: (r as { isFeatured?: boolean }).isFeatured ?? false,
    scheduledAt: r.scheduledAt,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    categoryName: r.category?.name ?? null,
    locationName: r.location?.name ?? null,
    languageName: r.language?.name ?? null,
    reporterName: r.reporter?.name ?? null,
    reporterRole: (r.reporter as { roleAssignments?: { role: string }[] } | null)?.roleAssignments?.[0]?.role ?? null,
  }
}

function toContentTransition(r: PrismaContentTransition): ContentTransition {
  return {
    id: r.id,
    contentId: r.contentId,
    fromStatus: (r.fromStatus ?? null) as ContentStatus | null,
    toStatus: r.toStatus as ContentStatus,
    actorId: r.actorId,
    actorName: r.actorName,
    note: r.note,
    createdAt: r.createdAt,
  }
}

const contentIncludes = {
  category: true,
  location: true,
  language: true,
  reporter: { include: { roleAssignments: true } },
} as const

// ── SupabaseCategoryRepository ────────────────────────────────────────────────

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: RefListOptions): Promise<Category[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const where: Prisma.CategoryWhereInput = { organizationId }
      if (opts?.activeOnly) { where.active = true; where.deletedAt = null }
      else if (!opts?.includeDeleted) where.deletedAt = null
      const rows = await tx.category.findMany({ where, orderBy: { name: 'asc' } })
      return rows.map(toCategory)
    })
  }

  async findById(id: string, organizationId: string): Promise<Category | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.category.findFirst({ where: { id, organizationId } }),
    )
    return row ? toCategory(row) : null
  }

  async findBySlug(slug: string, organizationId: string): Promise<Category | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.category.findFirst({ where: { slug, organizationId } }),
    )
    return row ? toCategory(row) : null
  }

  async create(params: CreateCategoryParams): Promise<Category> {
    assertOrg(params.organizationId)
    const row = await withOrgContext(this.prisma, params.organizationId, (tx) =>
      tx.category.create({
        data: { id: crypto.randomUUID(), organizationId: params.organizationId, code: params.code, name: params.name, slug: params.slug },
      }),
    )
    return toCategory(row)
  }

  async update(id: string, organizationId: string, params: UpdateCategoryParams): Promise<Category> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.category.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Category')
      const updated = await tx.category.update({ where: { id }, data: params })
      return toCategory(updated)
    })
  }

  async toggleActive(id: string, organizationId: string): Promise<Category> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.category.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Category')
      const updated = await tx.category.update({ where: { id }, data: { active: !row.active } })
      return toCategory(updated)
    })
  }

  async softDelete(id: string, organizationId: string): Promise<Category> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.category.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Category')
      const updated = await tx.category.update({ where: { id }, data: { deletedAt: new Date() } })
      return toCategory(updated)
    })
  }

  async restore(id: string, organizationId: string): Promise<Category> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.category.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Category')
      const updated = await tx.category.update({ where: { id }, data: { deletedAt: null } })
      return toCategory(updated)
    })
  }
}

// ── SupabaseLocationRepository ────────────────────────────────────────────────

export class SupabaseLocationRepository implements LocationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: LocationListOptions): Promise<Location[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const where: Prisma.LocationWhereInput = { organizationId }
      if (opts?.activeOnly) { where.active = true; where.deletedAt = null }
      else if (!opts?.includeDeleted) where.deletedAt = null
      if (opts?.level) where.level = opts.level
      if (opts?.parentId !== undefined) where.parentId = opts.parentId ?? null
      const rows = await tx.location.findMany({ where, include: locationIncludes, orderBy: { name: 'asc' } })
      return rows.map(toLocation)
    })
  }

  async listByLevel(organizationId: string, level: LocationLevel, opts?: RefListOptions): Promise<Location[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const where: Prisma.LocationWhereInput = { organizationId, level }
      if (opts?.activeOnly) { where.active = true; where.deletedAt = null }
      else if (!opts?.includeDeleted) where.deletedAt = null
      const rows = await tx.location.findMany({ where, include: locationIncludes, orderBy: { name: 'asc' } })
      return rows.map(toLocation)
    })
  }

  async listByParent(parentId: string, organizationId: string): Promise<Location[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const rows = await tx.location.findMany({
        where: { parentId, organizationId, deletedAt: null },
        include: locationIncludes,
        orderBy: { name: 'asc' },
      })
      return rows.map(toLocation)
    })
  }

  async findById(id: string, organizationId: string): Promise<Location | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.location.findFirst({ where: { id, organizationId }, include: locationIncludes }),
    )
    return row ? toLocation(row) : null
  }

  async findBySlug(slug: string, organizationId: string): Promise<Location | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.location.findFirst({ where: { slug, organizationId }, include: locationIncludes }),
    )
    return row ? toLocation(row) : null
  }

  async create(params: CreateLocationParams): Promise<Location> {
    assertOrg(params.organizationId)
    const row = await withOrgContext(this.prisma, params.organizationId, (tx) =>
      tx.location.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: params.organizationId,
          name: params.name,
          slug: params.slug,
          level: params.level,
          parentId: params.parentId ?? null,
        },
        include: locationIncludes,
      }),
    )
    return toLocation(row)
  }

  async update(id: string, organizationId: string, params: UpdateRefItemParams): Promise<Location> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.location.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Location')
      const updated = await tx.location.update({ where: { id }, data: params, include: locationIncludes })
      return toLocation(updated)
    })
  }

  async toggleActive(id: string, organizationId: string): Promise<Location> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.location.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Location')
      const updated = await tx.location.update({ where: { id }, data: { active: !row.active }, include: locationIncludes })
      return toLocation(updated)
    })
  }

  async setActive(id: string, organizationId: string, active: boolean): Promise<Location> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.location.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Location')
      const updated = await tx.location.update({ where: { id }, data: { active }, include: locationIncludes })
      return toLocation(updated)
    })
  }

  async softDelete(id: string, organizationId: string): Promise<Location> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.location.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Location')
      const updated = await tx.location.update({ where: { id }, data: { deletedAt: new Date() }, include: locationIncludes })
      return toLocation(updated)
    })
  }

  async restore(id: string, organizationId: string): Promise<Location> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.location.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Location')
      const updated = await tx.location.update({ where: { id }, data: { deletedAt: null }, include: locationIncludes })
      return toLocation(updated)
    })
  }
}

// ── SupabaseLanguageRepository ────────────────────────────────────────────────

export class SupabaseLanguageRepository implements LanguageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: RefListOptions): Promise<Language[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const where: Prisma.LanguageWhereInput = { organizationId }
      if (opts?.activeOnly) { where.active = true; where.deletedAt = null }
      else if (!opts?.includeDeleted) where.deletedAt = null
      const rows = await tx.language.findMany({ where, orderBy: { name: 'asc' } })
      return rows.map(toLanguage)
    })
  }

  async findById(id: string, organizationId: string): Promise<Language | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.language.findFirst({ where: { id, organizationId } }),
    )
    return row ? toLanguage(row) : null
  }

  async findBySlug(slug: string, organizationId: string): Promise<Language | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.language.findFirst({ where: { slug, organizationId } }),
    )
    return row ? toLanguage(row) : null
  }

  async create(params: CreateLanguageParams): Promise<Language> {
    assertOrg(params.organizationId)
    const row = await withOrgContext(this.prisma, params.organizationId, (tx) =>
      tx.language.create({
        data: { id: crypto.randomUUID(), organizationId: params.organizationId, code: params.code, name: params.name, slug: params.slug },
      }),
    )
    return toLanguage(row)
  }

  async update(id: string, organizationId: string, params: UpdateLanguageParams): Promise<Language> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.language.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Language')
      const updated = await tx.language.update({ where: { id }, data: params })
      return toLanguage(updated)
    })
  }

  async toggleActive(id: string, organizationId: string): Promise<Language> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.language.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Language')
      const updated = await tx.language.update({ where: { id }, data: { active: !row.active } })
      return toLanguage(updated)
    })
  }

  async softDelete(id: string, organizationId: string): Promise<Language> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.language.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Language')
      const updated = await tx.language.update({ where: { id }, data: { deletedAt: new Date() } })
      return toLanguage(updated)
    })
  }

  async restore(id: string, organizationId: string): Promise<Language> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const row = await tx.language.findFirst({ where: { id, organizationId } })
      if (!row) throw new NotFoundError('Language')
      const updated = await tx.language.update({ where: { id }, data: { deletedAt: null } })
      return toLanguage(updated)
    })
  }
}

// ── SupabaseContentRepository ─────────────────────────────────────────────────

export class SupabaseContentRepository implements ContentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: ContentListOptions): Promise<Content[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const where: Prisma.ContentWhereInput = {
        organizationId,
        deletedAt: null,
        ...(opts?.type ? { type: opts.type } : {}),
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
        ...(opts?.locationId ? { locationId: opts.locationId } : {}),
        ...(opts?.languageId ? { languageId: opts.languageId } : {}),
        ...(opts?.reporterId ? { reporterId: opts.reporterId } : {}),
        ...(opts?.search ? { title: { contains: opts.search, mode: 'insensitive' } } : {}),
      }
      const rows = await tx.content.findMany({
        where,
        include: contentIncludes,
        orderBy: { createdAt: 'desc' },
        skip: opts?.offset ?? 0,
        take: opts?.limit ?? 50,
      })
      return rows.map(toContent)
    })
  }

  async findById(id: string, organizationId: string): Promise<Content | null> {
    assertOrg(organizationId)
    const row = await withOrgContext(this.prisma, organizationId, (tx) =>
      tx.content.findFirst({ where: { id, organizationId, deletedAt: null }, include: contentIncludes }),
    )
    return row ? toContent(row) : null
  }

  async create(params: CreateContentParams): Promise<Content> {
    assertOrg(params.organizationId)
    const row = await withOrgContext(this.prisma, params.organizationId, (tx) =>
      tx.content.create({
        data: {
          id: crypto.randomUUID(),
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
          imageUrls: params.imageUrls ?? [],
          orientation: params.orientation ?? null,
          youtubeUrl: params.youtubeUrl ?? null,
          categoryId: params.categoryId ?? null,
          locationId: params.locationId ?? null,
          languageId: params.languageId ?? null,
          reporterId: params.reporterId ?? null,
          scheduledAt: params.scheduledAt ?? null,
        },
        include: contentIncludes,
      }),
    )
    return toContent(row)
  }

  async update(id: string, organizationId: string, params: UpdateContentParams): Promise<Content> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const existing = await tx.content.findFirst({ where: { id, organizationId } })
      if (!existing) throw new NotFoundError('Content')
      const row = await tx.content.update({
        where: { id },
        data: params,
        include: contentIncludes,
      })
      return toContent(row)
    })
  }

  async updateStatus(id: string, organizationId: string, status: ContentStatus): Promise<Content> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const existing = await tx.content.findFirst({ where: { id, organizationId } })
      if (!existing) throw new NotFoundError('Content')
      const row = await tx.content.update({
        where: { id },
        data: {
          status,
          publishedAt: status === 'PUBLISHED' ? new Date() : existing.publishedAt,
        },
        include: contentIncludes,
      })
      return toContent(row)
    })
  }

  async toggleVisibility(id: string, organizationId: string, visible: boolean): Promise<Content> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const existing = await tx.content.findFirst({ where: { id, organizationId } })
      if (!existing) throw new NotFoundError('Content')
      // isVisibleInApp will be added to Prisma schema when Supabase layer lands
      const row = await tx.content.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { isVisibleInApp: visible } as any,
        include: contentIncludes,
      })
      return { ...toContent(row as Parameters<typeof toContent>[0]), isVisibleInApp: visible }
    })
  }

  async softDelete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    await withOrgContext(this.prisma, organizationId, async (tx) => {
      const existing = await tx.content.findFirst({ where: { id, organizationId } })
      if (!existing) throw new NotFoundError('Content')
      await tx.content.update({ where: { id }, data: { deletedAt: new Date() } })
    })
  }

  async addTransition(params: AddTransitionParams): Promise<ContentTransition> {
    const row = await this.prisma.contentTransition.create({
      data: {
        id: crypto.randomUUID(),
        contentId: params.contentId,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus,
        actorId: params.actorId,
        actorName: params.actorName,
        note: params.note ?? null,
      },
    })
    return toContentTransition(row)
  }

  async listTransitions(contentId: string, organizationId: string): Promise<ContentTransition[]> {
    assertOrg(organizationId)
    return withOrgContext(this.prisma, organizationId, async (tx) => {
      const content = await tx.content.findFirst({ where: { id: contentId, organizationId } })
      if (!content) return []
      const rows = await tx.contentTransition.findMany({
        where: { contentId },
        orderBy: { createdAt: 'desc' },
      })
      return rows.map(toContentTransition)
    })
  }
}

// ── lookupUser helper (used by SupabaseAuthProvider) ─────────────────────────

export async function lookupUserForAuth(
  prisma: PrismaClient,
  supabaseUserId: string,
): Promise<{ userWithRole: UserWithRole; organization: DomainOrg } | null> {
  // No org context yet — use the postgres superuser to find the user's org first.
  // This is the ONLY query allowed without org context (it's the auth bootstrap).
  const profile = await prisma.profile.findUnique({
    where: { id: supabaseUserId },
    include: {
      organization: true,
      roleAssignments: true,
    },
  })
  if (!profile) return null
  return {
    userWithRole: toUserWithRole(profile),
    organization: toOrganization(profile.organization),
  }
}
