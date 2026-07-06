import type { Backend } from '@/lib/backend'
import type { PrismaClient, Prisma } from '@prisma/client'
import type {
  RoleDefinitionRepository, CreateRoleParams, UpdateRoleParams,
  NotificationRepository, NotificationTemplateRepository,
  NotificationListOptions, CreateNotificationParams,
  CommissionRuleRepository, ReporterRepository, ContributorRepository,
  ReporterListOptions, ContributorListOptions,
} from '@/lib/data/repositories'
import type { RoleDefinition, NotificationRecord, NotificationTemplate, NotificationStats, NotificationStatus } from '@/types/domain'
import type { CommissionRule } from '@/types/earnings'
import type { Reporter } from '@/types/reporter'
import type { Contributor } from '@/lib/mock/contributors-store'
import type { Capability } from '@/lib/rbac/permissions'
import { getPrismaClient } from './prisma'
import { SupabaseAuthProvider } from './supabase-auth'
import { NotFoundError, MissingOrgContextError } from '@/lib/errors'
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

function assertOrg(organizationId: string): void {
  if (!organizationId) throw new MissingOrgContextError()
}

// ── SupabaseRoleDefinitionRepository ─────────────────────────────────────────

class SupabaseRoleDefinitionRepository implements RoleDefinitionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string): Promise<RoleDefinition[]> {
    assertOrg(organizationId)
    const rows = await this.prisma.roleDefinition.findMany({ where: { organizationId }, orderBy: { name: 'asc' } })
    return rows.map(r => ({ id: r.id, organizationId: r.organizationId, name: r.name, permissions: r.permissions as Capability[], isSystem: r.isSystem, createdAt: r.createdAt }))
  }

  async findById(id: string, organizationId: string): Promise<RoleDefinition | null> {
    assertOrg(organizationId)
    const r = await this.prisma.roleDefinition.findFirst({ where: { id, organizationId } })
    if (!r) return null
    return { id: r.id, organizationId: r.organizationId, name: r.name, permissions: r.permissions as Capability[], isSystem: r.isSystem, createdAt: r.createdAt }
  }

  async create(params: CreateRoleParams): Promise<RoleDefinition> {
    assertOrg(params.organizationId)
    const r = await this.prisma.roleDefinition.create({
      data: { id: params.id, organizationId: params.organizationId, name: params.name, permissions: params.permissions, isSystem: params.isSystem },
    })
    return { id: r.id, organizationId: r.organizationId, name: r.name, permissions: r.permissions as Capability[], isSystem: r.isSystem, createdAt: r.createdAt }
  }

  async update(id: string, organizationId: string, params: UpdateRoleParams): Promise<RoleDefinition> {
    assertOrg(organizationId)
    const existing = await this.prisma.roleDefinition.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('RoleDefinition')
    const r = await this.prisma.roleDefinition.update({ where: { id }, data: { name: params.name, permissions: params.permissions } })
    return { id: r.id, organizationId: r.organizationId, name: r.name, permissions: r.permissions as Capability[], isSystem: r.isSystem, createdAt: r.createdAt }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const existing = await this.prisma.roleDefinition.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('RoleDefinition')
    await this.prisma.roleDefinition.delete({ where: { id } })
  }
}

// ── SupabaseNotificationRepository ───────────────────────────────────────────

function toNotificationRecord(r: {
  id: string; organizationId: string; title: string; body: string
  imageUrl: string | null; deepLink: string | null; channels: string[]
  audience: string; audienceValue: string | null; priority: string; status: string
  templateId: string | null; scheduledAt: Date | null; sentAt: Date | null
  sentBy: string; sentByName: string; estimatedRecipients: number
  deliveredCount: number; openedCount: number; failedCount: number
  createdAt: Date; updatedAt: Date
}): NotificationRecord {
  return {
    id: r.id, organizationId: r.organizationId, title: r.title, body: r.body,
    imageUrl: r.imageUrl, deepLink: r.deepLink,
    channels: r.channels as NotificationRecord['channels'],
    audience: r.audience as NotificationRecord['audience'],
    audienceValue: r.audienceValue, priority: r.priority as NotificationRecord['priority'],
    status: r.status as NotificationStatus, templateId: r.templateId,
    scheduledAt: r.scheduledAt, sentAt: r.sentAt, sentBy: r.sentBy,
    sentByName: r.sentByName, estimatedRecipients: r.estimatedRecipients,
    deliveredCount: r.deliveredCount, openedCount: r.openedCount,
    failedCount: r.failedCount, createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: NotificationListOptions): Promise<NotificationRecord[]> {
    assertOrg(organizationId)
    const where: Prisma.NotificationWhereInput = {
      organizationId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.search ? { OR: [{ title: { contains: opts.search, mode: 'insensitive' } }, { body: { contains: opts.search, mode: 'insensitive' } }] } : {}),
    }
    const rows = await this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: opts?.offset ?? 0, take: opts?.limit ?? 50 })
    return rows.map(toNotificationRecord)
  }

  async findById(id: string, organizationId: string): Promise<NotificationRecord | null> {
    assertOrg(organizationId)
    const r = await this.prisma.notification.findFirst({ where: { id, organizationId } })
    return r ? toNotificationRecord(r) : null
  }

  async create(params: CreateNotificationParams): Promise<NotificationRecord> {
    assertOrg(params.organizationId)
    const r = await this.prisma.notification.create({
      data: {
        organizationId: params.organizationId, title: params.title, body: params.body,
        imageUrl: params.imageUrl ?? null, deepLink: params.deepLink ?? null,
        channels: params.channels, audience: params.audience,
        audienceValue: params.audienceValue ?? null, priority: params.priority,
        status: params.status, templateId: params.templateId ?? null,
        scheduledAt: params.scheduledAt ?? null, sentBy: params.sentBy,
        sentByName: params.sentByName, estimatedRecipients: params.estimatedRecipients,
      },
    })
    return toNotificationRecord(r)
  }

  async updateStatus(id: string, organizationId: string, status: NotificationStatus, sentAt?: Date): Promise<NotificationRecord> {
    assertOrg(organizationId)
    const existing = await this.prisma.notification.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('Notification')
    const r = await this.prisma.notification.update({ where: { id }, data: { status, ...(sentAt ? { sentAt } : {}) } })
    return toNotificationRecord(r)
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const existing = await this.prisma.notification.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('Notification')
    await this.prisma.notification.delete({ where: { id } })
  }

  async getStats(organizationId: string): Promise<NotificationStats> {
    assertOrg(organizationId)
    const all = await this.prisma.notification.findMany({ where: { organizationId } })
    const sent = all.filter(n => n.status === 'SENT')
    const totalRecipients = sent.reduce((s, n) => s + n.estimatedRecipients, 0)
    const totalDelivered = sent.reduce((s, n) => s + n.deliveredCount, 0)
    const totalOpened = sent.reduce((s, n) => s + n.openedCount, 0)
    return {
      totalSent: sent.length,
      totalScheduled: all.filter(n => n.status === 'SCHEDULED').length,
      totalDraft: all.filter(n => n.status === 'DRAFT').length,
      totalFailed: all.filter(n => n.status === 'FAILED').length,
      totalRecipients, totalDelivered, totalOpened,
      openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
      deliveryRate: totalRecipients > 0 ? Math.round((totalDelivered / totalRecipients) * 100) : 0,
    }
  }
}

// ── SupabaseNotificationTemplateRepository ────────────────────────────────────

class SupabaseNotificationTemplateRepository implements NotificationTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string): Promise<NotificationTemplate[]> {
    assertOrg(organizationId)
    const rows = await this.prisma.notificationTemplate.findMany({ where: { organizationId } })
    return rows.map(r => ({
      id: r.id, organizationId: r.organizationId, name: r.name,
      description: r.description, title: r.title, body: r.body,
      channels: r.channels as NotificationTemplate['channels'],
      audience: r.audience as NotificationTemplate['audience'],
      priority: r.priority as NotificationTemplate['priority'],
      category: r.category as NotificationTemplate['category'],
    }))
  }

  async findById(id: string, organizationId: string): Promise<NotificationTemplate | null> {
    assertOrg(organizationId)
    const r = await this.prisma.notificationTemplate.findFirst({ where: { id, organizationId } })
    if (!r) return null
    return {
      id: r.id, organizationId: r.organizationId, name: r.name,
      description: r.description, title: r.title, body: r.body,
      channels: r.channels as NotificationTemplate['channels'],
      audience: r.audience as NotificationTemplate['audience'],
      priority: r.priority as NotificationTemplate['priority'],
      category: r.category as NotificationTemplate['category'],
    }
  }
}

// ── SupabaseCommissionRuleRepository ─────────────────────────────────────────

function toCommissionRule(r: {
  id: string; organizationId: string; name: string; description: string | null
  isDefault: boolean; earningMode: string
  imagePostRateInr: number; videoPostRateInr: number; shortPostRateInr: number; liveSessionRateInr: number
  imageCpmInr: number; videoCpmInr: number; shortCpmInr: number; liveCpmInr: number
  reachBonusThreshold: number; reachBonusAmountInr: number
  viralBonusThreshold: number; viralBonusAmountInr: number
  volumeBonusThreshold: number; volumeBonusAmountInr: number
  streakBonusMonths: number; streakBonusAmountInr: number
  tdsApplicable: boolean; tdsThresholdInr: number; tdsRatePercent: number
  createdAt: Date; updatedAt: Date
}): CommissionRule {
  return {
    id: r.id, organizationId: r.organizationId, name: r.name,
    description: r.description ?? '', isDefault: r.isDefault,
    earningMode: r.earningMode as CommissionRule['earningMode'],
    imagePostRateInr: r.imagePostRateInr, videoPostRateInr: r.videoPostRateInr,
    shortPostRateInr: r.shortPostRateInr, liveSessionRateInr: r.liveSessionRateInr,
    imageCpmInr: r.imageCpmInr, videoCpmInr: r.videoCpmInr,
    shortCpmInr: r.shortCpmInr, liveCpmInr: r.liveCpmInr,
    reachBonusThreshold: r.reachBonusThreshold, reachBonusAmountInr: r.reachBonusAmountInr,
    viralBonusThreshold: r.viralBonusThreshold, viralBonusAmountInr: r.viralBonusAmountInr,
    volumeBonusThreshold: r.volumeBonusThreshold, volumeBonusAmountInr: r.volumeBonusAmountInr,
    streakBonusMonths: r.streakBonusMonths, streakBonusAmountInr: r.streakBonusAmountInr,
    tdsApplicable: r.tdsApplicable, tdsThresholdInr: r.tdsThresholdInr,
    tdsRatePercent: r.tdsRatePercent, createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

class SupabaseCommissionRuleRepository implements CommissionRuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string): Promise<CommissionRule[]> {
    assertOrg(organizationId)
    const rows = await this.prisma.commissionRule.findMany({ where: { organizationId }, orderBy: { createdAt: 'asc' } })
    return rows.map(toCommissionRule)
  }

  async findById(id: string, organizationId: string): Promise<CommissionRule | null> {
    assertOrg(organizationId)
    const r = await this.prisma.commissionRule.findFirst({ where: { id, organizationId } })
    return r ? toCommissionRule(r) : null
  }

  async create(params: CommissionRule): Promise<CommissionRule> {
    assertOrg(params.organizationId)
    const r = await this.prisma.commissionRule.create({
      data: {
        id: params.id, organizationId: params.organizationId, name: params.name,
        description: params.description ?? null, isDefault: params.isDefault,
        earningMode: params.earningMode,
        imagePostRateInr: params.imagePostRateInr, videoPostRateInr: params.videoPostRateInr,
        shortPostRateInr: params.shortPostRateInr, liveSessionRateInr: params.liveSessionRateInr,
        imageCpmInr: params.imageCpmInr, videoCpmInr: params.videoCpmInr,
        shortCpmInr: params.shortCpmInr, liveCpmInr: params.liveCpmInr,
        reachBonusThreshold: params.reachBonusThreshold ?? undefined, reachBonusAmountInr: params.reachBonusAmountInr ?? undefined,
        viralBonusThreshold: params.viralBonusThreshold ?? undefined, viralBonusAmountInr: params.viralBonusAmountInr ?? undefined,
        volumeBonusThreshold: params.volumeBonusThreshold ?? undefined, volumeBonusAmountInr: params.volumeBonusAmountInr ?? undefined,
        streakBonusMonths: params.streakBonusMonths ?? undefined, streakBonusAmountInr: params.streakBonusAmountInr ?? undefined,
        tdsApplicable: params.tdsApplicable, tdsThresholdInr: params.tdsThresholdInr,
        tdsRatePercent: params.tdsRatePercent,
        createdAt: params.createdAt, updatedAt: params.updatedAt,
      },
    })
    return toCommissionRule(r)
  }

  async update(id: string, organizationId: string, params: Partial<CommissionRule>): Promise<CommissionRule> {
    assertOrg(organizationId)
    const existing = await this.prisma.commissionRule.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('CommissionRule')
    const { id: _id, organizationId: _orgId, createdAt: _ca, updatedAt: _ua, ...safeParams } = params
    const cleanData = Object.fromEntries(
      Object.entries(safeParams).map(([k, v]) => [k, v === null ? undefined : v])
    ) as Prisma.CommissionRuleUncheckedUpdateInput
    if (safeParams.description !== undefined) cleanData['description'] = safeParams.description ?? null
    const r = await this.prisma.commissionRule.update({ where: { id }, data: cleanData })
    return toCommissionRule(r)
  }

  async setDefault(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    await this.prisma.$transaction([
      this.prisma.commissionRule.updateMany({ where: { organizationId }, data: { isDefault: false } }),
      this.prisma.commissionRule.update({ where: { id }, data: { isDefault: true } }),
    ])
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const existing = await this.prisma.commissionRule.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('CommissionRule')
    await this.prisma.commissionRule.delete({ where: { id } })
  }
}

// ── SupabaseReporterRepository ────────────────────────────────────────────────

function toReporter(r: {
  id: string; contributorId: string; organizationId: string; name: string
  photoUrl: string | null; mobile: string; email: string; designation: string
  district: string; state: string | null; reporterType: string; language: string | null
  coverageAreas: string[]; newsGenres: string[]; status: string
  approvedAt: Date | null; approvedBy: string | null; commissionRuleId: string | null
  payment: Prisma.JsonValue; stats: Prisma.JsonValue
  lifetimeEarnedInr: number; lifetimeSettledInr: number; pendingEarningsInr: number
  currentMonthEarningsInr: number; annualEarnedInr: number; tdsDeductedInr: number
  adminNotes: string | null; flaggedForReview: boolean; createdAt: Date; updatedAt: Date
}): Reporter {
  return {
    id: r.id, contributorId: r.contributorId, organizationId: r.organizationId,
    name: r.name, photoUrl: r.photoUrl, mobile: r.mobile, email: r.email,
    designation: r.designation as Reporter['designation'], district: r.district,
    state: r.state ?? '', reporterType: r.reporterType as Reporter['reporterType'],
    language: r.language ?? '', coverageAreas: r.coverageAreas,
    newsGenres: r.newsGenres, status: r.status as Reporter['status'],
    approvedAt: r.approvedAt ?? new Date(), approvedBy: r.approvedBy ?? '',
    commissionRuleId: r.commissionRuleId ?? 'default',
    payment: (r.payment as unknown) as Reporter['payment'],
    stats: (r.stats as unknown) as Reporter['stats'],
    lifetimeEarnedInr: r.lifetimeEarnedInr, lifetimeSettledInr: r.lifetimeSettledInr,
    pendingEarningsInr: r.pendingEarningsInr, currentMonthEarningsInr: r.currentMonthEarningsInr,
    annualEarnedInr: r.annualEarnedInr, tdsDeductedInr: r.tdsDeductedInr,
    adminNotes: r.adminNotes ?? null, flaggedForReview: r.flaggedForReview,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

class SupabaseReporterRepository implements ReporterRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: ReporterListOptions): Promise<Reporter[]> {
    assertOrg(organizationId)
    const where: Prisma.ReporterWhereInput = {
      organizationId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.search ? { OR: [{ name: { contains: opts.search, mode: 'insensitive' } }, { email: { contains: opts.search, mode: 'insensitive' } }] } : {}),
    }
    const rows = await this.prisma.reporter.findMany({ where, orderBy: { createdAt: 'desc' }, skip: opts?.offset ?? 0, take: opts?.limit ?? 100 })
    return rows.map(toReporter)
  }

  async findById(id: string, organizationId: string): Promise<Reporter | null> {
    assertOrg(organizationId)
    const r = await this.prisma.reporter.findFirst({ where: { id, organizationId } })
    return r ? toReporter(r) : null
  }

  async create(params: Omit<Reporter, 'createdAt' | 'updatedAt'>): Promise<Reporter> {
    assertOrg(params.organizationId)
    const r = await this.prisma.reporter.create({
      data: {
        id: params.id, contributorId: params.contributorId, organizationId: params.organizationId,
        name: params.name, photoUrl: params.photoUrl ?? null, mobile: params.mobile,
        email: params.email, designation: params.designation, district: params.district,
        state: params.state ?? null, reporterType: params.reporterType,
        language: params.language ?? null, coverageAreas: params.coverageAreas,
        newsGenres: params.newsGenres, status: params.status,
        approvedAt: params.approvedAt ?? null, approvedBy: params.approvedBy ?? null,
        commissionRuleId: params.commissionRuleId ?? null,
        payment: (params.payment ?? {}) as unknown as Prisma.InputJsonValue,
        stats: (params.stats ?? {}) as unknown as Prisma.InputJsonValue,
        lifetimeEarnedInr: params.lifetimeEarnedInr, lifetimeSettledInr: params.lifetimeSettledInr,
        pendingEarningsInr: params.pendingEarningsInr, currentMonthEarningsInr: params.currentMonthEarningsInr,
        annualEarnedInr: params.annualEarnedInr, tdsDeductedInr: params.tdsDeductedInr,
        adminNotes: params.adminNotes ?? null, flaggedForReview: params.flaggedForReview,
      },
    })
    return toReporter(r)
  }

  async update(id: string, organizationId: string, params: Partial<Reporter>): Promise<Reporter> {
    assertOrg(organizationId)
    const existing = await this.prisma.reporter.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('Reporter')
    const r = await this.prisma.reporter.update({
      where: { id },
      data: {
        ...(params.name !== undefined ? { name: params.name } : {}),
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.commissionRuleId !== undefined ? { commissionRuleId: params.commissionRuleId ?? null } : {}),
        ...(params.adminNotes !== undefined ? { adminNotes: params.adminNotes } : {}),
        ...(params.flaggedForReview !== undefined ? { flaggedForReview: params.flaggedForReview } : {}),
        ...(params.payment !== undefined ? { payment: params.payment as unknown as Prisma.InputJsonValue } : {}),
        ...(params.stats !== undefined ? { stats: params.stats as unknown as Prisma.InputJsonValue } : {}),
      },
    })
    return toReporter(r)
  }

  async updateStatus(id: string, organizationId: string, status: string): Promise<Reporter> {
    return this.update(id, organizationId, { status: status as Reporter['status'] })
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const existing = await this.prisma.reporter.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('Reporter')
    await this.prisma.reporter.delete({ where: { id } })
  }
}

// ── SupabaseContributorRepository ─────────────────────────────────────────────

function toContributor(r: {
  id: string; contributorId: string; organizationId: string; name: string
  photoUrl: string | null; status: string; contributorSource: string
  mobile: string; alternateMobile: string | null; email: string; dob: string | null
  gender: string | null; occupation: string | null; education: string | null
  language: string | null; languagesKnown: string[]; bio: string | null
  address: string | null; houseNumber: string | null; street: string | null
  area: string | null; village: string | null; mandal: string | null
  district: string; state: string | null; pincode: string | null
  designation: string; reporterType: string; experience: string | null
  contributorType: string | null; registrationSource: string | null; source: string | null
  recruitedBy: string | null; referralBy: string | null; referralCode: string | null
  registrationDate: Date | null; appliedOn: Date; approvedOn: Date | null
  approvedBy: string | null; rejectedOn: Date | null; remarks: string | null
  verificationStatus: string | null; verifiedBy: string | null; verificationDate: Date | null
  aadhaarMasked: string | null; panMasked: string | null
  coverageAreas: string[]; newsGenres: string[]; assignedMandal: string | null
  assignedVillage: string | null; coveragePriorityLevel: string | null
  accountHolderName: string | null; bankName: string | null; accountNumberMasked: string | null
  ifscCode: string | null; branch: string | null; upiId: string | null
  paymentMethod: string | null; panNumber: string | null; deviceInfo: Prisma.JsonValue
  createdAt: Date; updatedAt: Date
}): Contributor {
  const di = (r.deviceInfo ?? {}) as Record<string, unknown>
  return {
    id: r.id, contributorId: r.contributorId, organizationId: r.organizationId,
    name: r.name, photoUrl: r.photoUrl, status: r.status as Contributor['status'],
    contributorSource: r.contributorSource as Contributor['contributorSource'],
    mobile: r.mobile, alternateMobile: r.alternateMobile ?? undefined,
    email: r.email, dob: r.dob ?? undefined, gender: r.gender ?? undefined,
    occupation: r.occupation ?? undefined, education: r.education ?? undefined,
    language: r.language ?? undefined, languagesKnown: r.languagesKnown,
    bio: r.bio ?? undefined, address: r.address ?? undefined,
    houseNumber: r.houseNumber ?? undefined, street: r.street ?? undefined,
    area: r.area ?? undefined, village: r.village ?? undefined,
    mandal: r.mandal ?? undefined, district: r.district,
    state: r.state ?? undefined, pincode: r.pincode ?? undefined,
    designation: r.designation, reporterType: r.reporterType as Contributor['reporterType'],
    experience: r.experience ?? '', contributorType: r.contributorType as Contributor['contributorType'] ?? undefined,
    registrationSource: r.registrationSource as Contributor['registrationSource'] ?? undefined,
    source: r.source ?? undefined, recruitedBy: r.recruitedBy ?? undefined,
    referralBy: r.referralBy ?? undefined, referralCode: r.referralCode ?? undefined,
    registrationDate: r.registrationDate ?? undefined, appliedOn: r.appliedOn,
    approvedOn: r.approvedOn ?? null, approvedBy: r.approvedBy ?? undefined,
    rejectedOn: r.rejectedOn ?? null, remarks: r.remarks ?? undefined,
    verificationStatus: r.verificationStatus as Contributor['verificationStatus'] ?? undefined,
    verifiedBy: r.verifiedBy ?? undefined, verificationDate: r.verificationDate ?? null,
    aadhaarMasked: r.aadhaarMasked ?? undefined, panMasked: r.panMasked ?? undefined,
    coverageAreas: r.coverageAreas, newsGenres: r.newsGenres,
    assignedMandal: r.assignedMandal ?? undefined, assignedVillage: r.assignedVillage ?? undefined,
    coveragePriorityLevel: r.coveragePriorityLevel as Contributor['coveragePriorityLevel'] ?? undefined,
    accountHolderName: r.accountHolderName ?? undefined, bankName: r.bankName ?? undefined,
    accountNumberMasked: r.accountNumberMasked ?? undefined, ifscCode: r.ifscCode ?? undefined,
    branch: r.branch ?? undefined, upiId: r.upiId ?? undefined,
    devicePlatform: (di['devicePlatform'] as Contributor['devicePlatform']) ?? undefined,
    deviceManufacturer: (di['deviceManufacturer'] as string | undefined) ?? undefined,
    deviceModel: (di['deviceModel'] as string | undefined) ?? undefined,
    deviceOsVersion: (di['deviceOsVersion'] as string | undefined) ?? undefined,
    deviceAppVersion: (di['deviceAppVersion'] as string | undefined) ?? undefined,
    networkType: (di['networkType'] as Contributor['networkType']) ?? undefined,
    connectionType: (di['connectionType'] as Contributor['connectionType']) ?? undefined,
    isp: (di['isp'] as string | undefined) ?? undefined,
    pushNotificationEnabled: (di['pushNotificationEnabled'] as boolean | undefined) ?? undefined,
    cameraPermission: (di['cameraPermission'] as boolean | undefined) ?? undefined,
    micPermission: (di['micPermission'] as boolean | undefined) ?? undefined,
    storagePermission: (di['storagePermission'] as boolean | undefined) ?? undefined,
    locationPermission: (di['locationPermission'] as boolean | undefined) ?? undefined,
    loginCount: (di['loginCount'] as number | undefined) ?? undefined,
    lastLogin: di['lastLogin'] ? new Date(di['lastLogin'] as string) : undefined,
    appInstallDate: di['appInstallDate'] ? new Date(di['appInstallDate'] as string) : undefined,
    crashCount: (di['crashCount'] as number | undefined) ?? undefined,
    isOnline: (di['isOnline'] as boolean | undefined) ?? undefined,
    lastActive: di['lastActive'] ? new Date(di['lastActive'] as string) : undefined,
    // stats fields stored in deviceInfo for simplicity
    preferredPaymentMethod: (di['preferredPaymentMethod'] as Contributor['preferredPaymentMethod']) ?? undefined,
    payoutStatus: (di['payoutStatus'] as Contributor['payoutStatus']) ?? undefined,
    totalEarnings: (di['totalEarnings'] as number | undefined) ?? undefined,
    currentMonthEarnings: (di['currentMonthEarnings'] as number | undefined) ?? undefined,
    pendingEarnings: (di['pendingEarnings'] as number | undefined) ?? undefined,
    lastPaymentAmount: (di['lastPaymentAmount'] as number | undefined) ?? undefined,
    lastPaymentDate: di['lastPaymentDate'] ? new Date(di['lastPaymentDate'] as string) : undefined,
    totalContentSubmitted: (di['totalContentSubmitted'] as number | undefined) ?? undefined,
    contentPublished: (di['contentPublished'] as number | undefined) ?? undefined,
    pendingStories: (di['pendingStories'] as number | undefined) ?? undefined,
    rejectedStories: (di['rejectedStories'] as number | undefined) ?? undefined,
    draftStories: (di['draftStories'] as number | undefined) ?? undefined,
    imageStories: (di['imageStories'] as number | undefined) ?? undefined,
    videoStories: (di['videoStories'] as number | undefined) ?? undefined,
    liveSessions: (di['liveSessions'] as number | undefined) ?? undefined,
    avgApprovalTime: (di['avgApprovalTime'] as string | undefined) ?? undefined,
    lastStoryPublished: di['lastStoryPublished'] ? new Date(di['lastStoryPublished'] as string) : undefined,
    mostActiveCategory: (di['mostActiveCategory'] as string | undefined) ?? undefined,
    contentViews: (di['contentViews'] as number | undefined) ?? undefined,
    totalLikes: (di['totalLikes'] as number | undefined) ?? undefined,
    totalShares: (di['totalShares'] as number | undefined) ?? undefined,
    totalComments: (di['totalComments'] as number | undefined) ?? undefined,
    followers: (di['followers'] as number | undefined) ?? undefined,
    avgStoryReach: (di['avgStoryReach'] as number | undefined) ?? undefined,
    accuracyRate: (di['accuracyRate'] as number | undefined) ?? undefined,
    adminNotes: (di['adminNotes'] as string | undefined) ?? undefined,
    tags: (di['tags'] as string[] | undefined) ?? undefined,
    documents: (di['documents'] as Contributor['documents']) ?? [],
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

function contributorToDeviceInfo(c: Omit<Contributor, 'createdAt' | 'updatedAt'> | Partial<Contributor>): Prisma.InputJsonValue {
  return {
    devicePlatform: c.devicePlatform, deviceManufacturer: c.deviceManufacturer,
    deviceModel: c.deviceModel, deviceOsVersion: c.deviceOsVersion,
    deviceAppVersion: c.deviceAppVersion, networkType: c.networkType,
    connectionType: c.connectionType, isp: c.isp,
    pushNotificationEnabled: c.pushNotificationEnabled,
    cameraPermission: c.cameraPermission, micPermission: c.micPermission,
    storagePermission: c.storagePermission, locationPermission: c.locationPermission,
    loginCount: c.loginCount, lastLogin: c.lastLogin?.toISOString(),
    appInstallDate: c.appInstallDate?.toISOString(), crashCount: c.crashCount,
    isOnline: c.isOnline, lastActive: c.lastActive?.toISOString(),
    preferredPaymentMethod: c.preferredPaymentMethod, payoutStatus: c.payoutStatus,
    totalEarnings: c.totalEarnings, currentMonthEarnings: c.currentMonthEarnings,
    pendingEarnings: c.pendingEarnings, lastPaymentAmount: c.lastPaymentAmount,
    lastPaymentDate: c.lastPaymentDate?.toISOString(),
    totalContentSubmitted: c.totalContentSubmitted, contentPublished: c.contentPublished,
    pendingStories: c.pendingStories, rejectedStories: c.rejectedStories,
    draftStories: c.draftStories, imageStories: c.imageStories,
    videoStories: c.videoStories, liveSessions: c.liveSessions,
    avgApprovalTime: c.avgApprovalTime, lastStoryPublished: c.lastStoryPublished?.toISOString(),
    mostActiveCategory: c.mostActiveCategory, contentViews: c.contentViews,
    totalLikes: c.totalLikes, totalShares: c.totalShares, totalComments: c.totalComments,
    followers: c.followers, avgStoryReach: c.avgStoryReach, accuracyRate: c.accuracyRate,
    adminNotes: c.adminNotes, tags: c.tags, documents: c.documents,
  } as Prisma.InputJsonValue
}

class SupabaseContributorRepository implements ContributorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string, opts?: ContributorListOptions): Promise<Contributor[]> {
    assertOrg(organizationId)
    const where: Prisma.ContributorWhereInput = {
      organizationId,
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.search ? { OR: [{ name: { contains: opts.search, mode: 'insensitive' } }, { email: { contains: opts.search, mode: 'insensitive' } }] } : {}),
    }
    const rows = await this.prisma.contributor.findMany({ where, orderBy: { appliedOn: 'desc' }, skip: opts?.offset ?? 0, take: opts?.limit ?? 100 })
    return rows.map(toContributor)
  }

  async findById(id: string, organizationId: string): Promise<Contributor | null> {
    assertOrg(organizationId)
    const r = await this.prisma.contributor.findFirst({ where: { id, organizationId } })
    return r ? toContributor(r) : null
  }

  async create(params: Omit<Contributor, 'createdAt' | 'updatedAt'>): Promise<Contributor> {
    assertOrg(params.organizationId)
    const r = await this.prisma.contributor.create({
      data: {
        organizationId: params.organizationId, contributorId: params.contributorId,
        name: params.name, photoUrl: params.photoUrl ?? null,
        status: params.status, contributorSource: params.contributorSource,
        mobile: params.mobile, alternateMobile: params.alternateMobile ?? null,
        email: params.email, dob: params.dob ?? null, gender: params.gender ?? null,
        occupation: params.occupation ?? null, education: params.education ?? null,
        language: params.language ?? null, languagesKnown: params.languagesKnown ?? [],
        bio: params.bio ?? null, address: params.address ?? null,
        houseNumber: params.houseNumber ?? null, street: params.street ?? null,
        area: params.area ?? null, village: params.village ?? null,
        mandal: params.mandal ?? null, district: params.district,
        state: params.state ?? null, pincode: params.pincode ?? null,
        designation: params.designation, reporterType: params.reporterType,
        experience: params.experience ?? null,
        contributorType: params.contributorType ?? null,
        registrationSource: params.registrationSource ?? null,
        source: params.source ?? null, recruitedBy: params.recruitedBy ?? null,
        referralBy: params.referralBy ?? null, referralCode: params.referralCode ?? null,
        registrationDate: params.registrationDate ?? null,
        appliedOn: params.appliedOn, approvedOn: params.approvedOn ?? null,
        approvedBy: params.approvedBy ?? null, rejectedOn: params.rejectedOn ?? null,
        remarks: params.remarks ?? null,
        verificationStatus: params.verificationStatus ?? null,
        verifiedBy: params.verifiedBy ?? null, verificationDate: params.verificationDate ?? null,
        aadhaarMasked: params.aadhaarMasked ?? null, panMasked: params.panMasked ?? null,
        coverageAreas: params.coverageAreas ?? [], newsGenres: params.newsGenres ?? [],
        assignedMandal: params.assignedMandal ?? null, assignedVillage: params.assignedVillage ?? null,
        coveragePriorityLevel: params.coveragePriorityLevel ?? null,
        accountHolderName: params.accountHolderName ?? null, bankName: params.bankName ?? null,
        accountNumberMasked: params.accountNumberMasked ?? null, ifscCode: params.ifscCode ?? null,
        branch: params.branch ?? null, upiId: params.upiId ?? null,
        paymentMethod: params.preferredPaymentMethod ?? null,
        deviceInfo: contributorToDeviceInfo(params),
      },
    })
    return toContributor(r)
  }

  async update(id: string, organizationId: string, params: Partial<Contributor>): Promise<Contributor> {
    assertOrg(organizationId)
    const existing = await this.prisma.contributor.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('Contributor')
    const r = await this.prisma.contributor.update({
      where: { id },
      data: {
        ...(params.name !== undefined ? { name: params.name } : {}),
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.approvedOn !== undefined ? { approvedOn: params.approvedOn } : {}),
        ...(params.approvedBy !== undefined ? { approvedBy: params.approvedBy ?? null } : {}),
        ...(params.rejectedOn !== undefined ? { rejectedOn: params.rejectedOn } : {}),
        ...(params.remarks !== undefined ? { remarks: params.remarks ?? null } : {}),
        ...(params.verificationStatus !== undefined ? { verificationStatus: params.verificationStatus ?? null } : {}),
        deviceInfo: contributorToDeviceInfo({ ...toContributor(existing), ...params }),
      },
    })
    return toContributor(r)
  }

  async updateStatus(id: string, organizationId: string, status: string, meta?: { approvedBy?: string; rejectedOn?: Date; remarks?: string }): Promise<Contributor> {
    return this.update(id, organizationId, {
      status: status as Contributor['status'],
      ...(meta?.approvedBy ? { approvedBy: meta.approvedBy, approvedOn: new Date() } : {}),
      ...(meta?.rejectedOn ? { rejectedOn: meta.rejectedOn } : {}),
      ...(meta?.remarks ? { remarks: meta.remarks } : {}),
    })
  }

  async delete(id: string, organizationId: string): Promise<void> {
    assertOrg(organizationId)
    const existing = await this.prisma.contributor.findFirst({ where: { id, organizationId } })
    if (!existing) throw new NotFoundError('Contributor')
    await this.prisma.contributor.delete({ where: { id } })
  }
}

// ── Backend factory ───────────────────────────────────────────────────────────

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
      roleDefinitions: new SupabaseRoleDefinitionRepository(prisma),
      auditLog: new SupabaseAuditLogRepository(prisma),
      categories: new SupabaseCategoryRepository(prisma),
      locations: new SupabaseLocationRepository(prisma),
      languages: new SupabaseLanguageRepository(prisma),
      content: new SupabaseContentRepository(prisma),
      notifications: new SupabaseNotificationRepository(prisma),
      notificationTemplates: new SupabaseNotificationTemplateRepository(prisma),
      commissionRules: new SupabaseCommissionRuleRepository(prisma),
      reporters: new SupabaseReporterRepository(prisma),
      contributors: new SupabaseContributorRepository(prisma),
    },
  }
}
