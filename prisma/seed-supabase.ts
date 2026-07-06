/**
 * Seed script for the Supabase (real DB) backend.
 * Creates the PuraLocal org, 11 auth users, profiles, role assignments,
 * reference data (categories, locations, languages), 12 content items,
 * and audit log entries — mirroring the mock seed data.
 *
 * Run with:
 *   DATA_BACKEND=supabase pnpm tsx prisma/seed-supabase.ts
 *
 * Requires .env with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * DATABASE_URL set.  Safe to run multiple times (upsert semantics).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// tsx doesn't auto-load .env — parse it manually
;(function loadEnv() {
  try {
    const content = readFileSync(join(process.cwd(), '.env'), 'utf-8')
    for (const raw of content.split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 0) continue
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      if (key && val && !process.env[key]) process.env[key] = val
    }
  } catch { /* .env not found, rely on shell env */ }
})()

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  SEEDED_ORG,
  SEEDED_USERS,
  SEEDED_CATEGORIES,
  SEEDED_LOCATIONS,
  SEEDED_LANGUAGES,
  SEEDED_CONTENT,
  SEEDED_AUDIT_ENTRIES,
  SEED_ROLE_DEFINITIONS,
  SEEDED_NOTIFICATION_TEMPLATES,
} from '../lib/mock/seed'
import { COMMISSION_RULES, SEED_REPORTERS } from '../lib/mock/seed-reporters'
import { INITIAL_SEED as SEED_CONTRIBUTORS } from '../lib/mock/contributors-store'

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertOrg() {
  await prisma.organization.upsert({
    where: { id: SEEDED_ORG.id },
    update: { name: SEEDED_ORG.name, slug: SEEDED_ORG.slug },
    create: {
      id: SEEDED_ORG.id,
      name: SEEDED_ORG.name,
      slug: SEEDED_ORG.slug,
      createdAt: SEEDED_ORG.createdAt,
    },
  })
  console.log(`✓ org: ${SEEDED_ORG.slug}`)
}

async function upsertUser(user: (typeof SEEDED_USERS)[number]) {
  // 1. Create or look up the Supabase auth user (service role, bypasses email verification).
  const { data: existingList } = await supabaseAdmin.auth.admin.listUsers()
  const existing = existingList?.users.find((u) => u.email === user.email)

  let authId: string
  if (existing) {
    authId = existing.id
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: 'password', // dev-only default — change before any real use
      email_confirm: true,
    })
    if (error || !data.user) throw new Error(`Auth create failed for ${user.email}: ${error?.message}`)
    authId = data.user.id
  }

  // 2. Upsert profile (id = Supabase auth.users.id).
  await prisma.profile.upsert({
    where: { id: authId },
    update: { email: user.email, name: user.name, photoUrl: (user as { photoUrl?: string | null }).photoUrl ?? null },
    create: {
      id: authId,
      email: user.email,
      name: user.name,
      organizationId: SEEDED_ORG.id,
      invitedAt: user.invitedAt,
      joinedAt: user.joinedAt,
      photoUrl: (user as { photoUrl?: string | null }).photoUrl ?? null,
    },
  })

  // 3. Upsert role assignment (one per user per org).
  await prisma.roleAssignment.upsert({
    where: { userId_organizationId: { userId: authId, organizationId: SEEDED_ORG.id } },
    update: { role: user.role },
    create: {
      userId: authId,
      organizationId: SEEDED_ORG.id,
      role: user.role,
    },
  })

  console.log(`  ✓ user: ${user.email} (${user.role})`)
  return authId
}

// ── Reference data seeders ────────────────────────────────────────────────────

async function seedCategories() {
  const existing = await prisma.category.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEEDED_CATEGORIES.length) {
    console.log(`  ✓ categories: already seeded (${existing})`)
    return
  }
  for (const cat of SEEDED_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, slug: cat.slug, active: cat.active, code: cat.code },
      create: {
        id: cat.id,
        organizationId: cat.organizationId,
        code: cat.code,
        name: cat.name,
        slug: cat.slug,
        active: cat.active,
        deletedAt: cat.deletedAt,
        createdAt: cat.createdAt,
      },
    })
  }
  console.log(`  ✓ categories: ${SEEDED_CATEGORIES.length} seeded`)
}

async function seedLocations() {
  const existing = await prisma.location.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEEDED_LOCATIONS.length) {
    console.log(`  ✓ locations: already seeded (${existing})`)
    return
  }
  // Insert in level order so parent rows exist before child rows reference them
  const levels = ['STATE', 'DISTRICT', 'MANDAL', 'VILLAGE']
  for (const level of levels) {
    const items = SEEDED_LOCATIONS.filter(l => l.level === level)
    for (const loc of items) {
      await prisma.location.upsert({
        where: { id: loc.id },
        update: { name: loc.name, active: loc.active, parentId: loc.parentId ?? null },
        create: {
          id: loc.id,
          organizationId: loc.organizationId,
          name: loc.name,
          slug: loc.slug,
          level: loc.level,
          parentId: loc.parentId ?? null,
          active: loc.active,
          deletedAt: loc.deletedAt,
          createdAt: loc.createdAt,
        },
      })
    }
    console.log(`    ✓ ${level}: ${items.length}`)
  }
  console.log(`  ✓ locations: ${SEEDED_LOCATIONS.length} total`)
}

async function seedLanguages() {
  const existing = await prisma.language.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEEDED_LANGUAGES.length) {
    console.log(`  ✓ languages: already seeded (${existing})`)
    return
  }
  for (const lang of SEEDED_LANGUAGES) {
    await prisma.language.upsert({
      where: { id: lang.id },
      update: { name: lang.name, slug: lang.slug, active: lang.active, code: lang.code },
      create: {
        id: lang.id,
        organizationId: lang.organizationId,
        code: lang.code,
        name: lang.name,
        slug: lang.slug,
        active: lang.active,
        deletedAt: lang.deletedAt,
        createdAt: lang.createdAt,
      },
    })
  }
  console.log(`  ✓ languages: ${SEEDED_LANGUAGES.length} seeded`)
}

async function seedContent(userIdMap: Record<string, string>) {
  const existing = await prisma.content.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEEDED_CONTENT.length) {
    console.log(`  ✓ content: already seeded (${existing})`)
    return
  }

  const resolveReporterId = (mockId: string | null | undefined): string | null => {
    if (!mockId) return null
    const user = SEEDED_USERS.find(u => u.id === mockId)
    if (!user) return null
    return userIdMap[user.email] ?? null
  }

  for (const item of SEEDED_CONTENT) {
    const reporterId = resolveReporterId(item.reporterId)
    await prisma.content.upsert({
      where: { id: item.id },
      update: { thumbnailUrl: item.thumbnailUrl ?? null },
      create: {
        id: item.id,
        organizationId: item.organizationId,
        type: item.type,
        status: item.status,
        source: item.source,
        title: item.title,
        slug: item.slug,
        body: item.body ?? null,
        excerpt: item.excerpt ?? null,
        mediaUrl: item.mediaUrl ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        youtubeUrl: item.youtubeUrl ?? null,
        categoryId: item.categoryId ?? null,
        locationId: item.locationId ?? null,
        languageId: item.languageId ?? null,
        reporterId: reporterId,
        tags: item.tags ?? [],
        isBreakingNews: item.isBreakingNews ?? false,
        isTrending: item.isTrending ?? false,
        isFeatured: item.isFeatured ?? false,
        scheduledAt: item.scheduledAt ?? null,
        publishedAt: item.publishedAt ?? null,
        deletedAt: null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    })
  }
  console.log(`  ✓ content: ${SEEDED_CONTENT.length} seeded`)
}

async function seedAuditLog(orgAdminId: string) {
  const existing = await prisma.auditLog.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing > 1) {
    console.log(`  ✓ audit log: already seeded (${existing})`)
    return
  }

  const entries = SEEDED_AUDIT_ENTRIES.slice(0, 10)
  for (const entry of entries) {
    await prisma.auditLog.create({
      data: {
        organizationId: SEEDED_ORG.id,
        actorId: orgAdminId,
        actorName: entry.actorName,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        targetLabel: entry.targetLabel ?? null,
        metadata: entry.metadata ?? undefined,
        createdAt: entry.createdAt,
      },
    })
  }
  console.log(`  ✓ audit log: ${entries.length} entries seeded`)
}

// ── New entity seeders ────────────────────────────────────────────────────────

async function seedRoleDefinitions() {
  for (const rd of SEED_ROLE_DEFINITIONS) {
    await prisma.roleDefinition.upsert({
      where: { id: rd.id },
      update: { name: rd.name },
      create: {
        id: rd.id,
        organizationId: SEEDED_ORG.id,
        name: rd.name,
        permissions: rd.permissions ?? [],
        isSystem: rd.isSystem ?? false,
      },
    })
  }
  console.log(`  ✓ role definitions: ${SEED_ROLE_DEFINITIONS.length} seeded`)
}

async function seedNotificationTemplates() {
  const existing = await prisma.notificationTemplate.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEEDED_NOTIFICATION_TEMPLATES.length) {
    console.log(`  ✓ notification templates: already seeded (${existing})`)
    return
  }
  for (const t of SEEDED_NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { id: t.id },
      update: { title: t.title, body: t.body },
      create: {
        id: t.id,
        organizationId: SEEDED_ORG.id,
        name: t.name,
        description: t.description ?? '',
        title: t.title,
        body: t.body,
        channels: t.channels,
        audience: t.audience,
        priority: t.priority,
        category: t.category ?? 'general',
      },
    })
  }
  console.log(`  ✓ notification templates: ${SEEDED_NOTIFICATION_TEMPLATES.length} seeded`)
}

async function seedCommissionRules() {
  const existing = await prisma.commissionRule.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= COMMISSION_RULES.length) {
    console.log(`  ✓ commission rules: already seeded (${existing})`)
    return
  }
  for (const rule of COMMISSION_RULES) {
    await prisma.commissionRule.upsert({
      where: { id: rule.id },
      update: { name: rule.name, isDefault: rule.isDefault },
      create: {
        id: rule.id,
        organizationId: SEEDED_ORG.id,
        name: rule.name,
        description: rule.description ?? null,
        isDefault: rule.isDefault,
        earningMode: rule.earningMode,
        imagePostRateInr: rule.imagePostRateInr,
        videoPostRateInr: rule.videoPostRateInr,
        shortPostRateInr: rule.shortPostRateInr,
        liveSessionRateInr: rule.liveSessionRateInr,
        imageCpmInr: rule.imageCpmInr,
        videoCpmInr: rule.videoCpmInr,
        shortCpmInr: rule.shortCpmInr,
        liveCpmInr: rule.liveCpmInr,
        reachBonusThreshold: rule.reachBonusThreshold ?? undefined,
        reachBonusAmountInr: rule.reachBonusAmountInr ?? undefined,
        viralBonusThreshold: rule.viralBonusThreshold ?? undefined,
        viralBonusAmountInr: rule.viralBonusAmountInr ?? undefined,
        volumeBonusThreshold: rule.volumeBonusThreshold ?? undefined,
        volumeBonusAmountInr: rule.volumeBonusAmountInr ?? undefined,
        streakBonusMonths: rule.streakBonusMonths ?? undefined,
        streakBonusAmountInr: rule.streakBonusAmountInr ?? undefined,
        tdsApplicable: rule.tdsApplicable,
        tdsThresholdInr: rule.tdsThresholdInr,
        tdsRatePercent: rule.tdsRatePercent,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      },
    })
  }
  console.log(`  ✓ commission rules: ${COMMISSION_RULES.length} seeded`)
}

async function seedReporters() {
  const existing = await prisma.reporter.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEED_REPORTERS.length) {
    console.log(`  ✓ reporters: already seeded (${existing})`)
    return
  }
  for (const r of SEED_REPORTERS) {
    await prisma.reporter.upsert({
      where: { id: r.id },
      update: { name: r.name, status: r.status },
      create: {
        id: r.id,
        contributorId: r.contributorId,
        organizationId: SEEDED_ORG.id,
        name: r.name,
        photoUrl: r.photoUrl ?? null,
        mobile: r.mobile,
        email: r.email,
        designation: r.designation,
        district: r.district,
        state: r.state,
        reporterType: r.reporterType,
        language: r.language,
        coverageAreas: r.coverageAreas,
        newsGenres: r.newsGenres,
        status: r.status,
        approvedAt: r.approvedAt,
        approvedBy: r.approvedBy,
        commissionRuleId: r.commissionRuleId,
        payment: r.payment as unknown as import('@prisma/client').Prisma.InputJsonValue,
        stats: r.stats as unknown as import('@prisma/client').Prisma.InputJsonValue,
        lifetimeEarnedInr: r.lifetimeEarnedInr,
        lifetimeSettledInr: r.lifetimeSettledInr,
        pendingEarningsInr: r.pendingEarningsInr,
        currentMonthEarningsInr: r.currentMonthEarningsInr,
        annualEarnedInr: r.annualEarnedInr,
        tdsDeductedInr: r.tdsDeductedInr,
        adminNotes: r.adminNotes ?? null,
        flaggedForReview: r.flaggedForReview,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
    })
  }
  console.log(`  ✓ reporters: ${SEED_REPORTERS.length} seeded`)
}

async function seedContributors() {
  const existing = await prisma.contributor.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existing >= SEED_CONTRIBUTORS.length) {
    console.log(`  ✓ contributors: already seeded (${existing})`)
    return
  }
  for (const c of SEED_CONTRIBUTORS) {
    await prisma.contributor.upsert({
      where: { id: c.id },
      update: { name: c.name, status: c.status },
      create: {
        id: c.id,
        contributorId: c.contributorId,
        organizationId: SEEDED_ORG.id,
        name: c.name,
        photoUrl: c.photoUrl ?? null,
        status: c.status,
        contributorSource: c.contributorSource,
        mobile: c.mobile,
        alternateMobile: c.alternateMobile ?? null,
        email: c.email,
        dob: c.dob ?? null,
        gender: c.gender ?? null,
        occupation: c.occupation ?? null,
        education: c.education ?? null,
        language: c.language ?? null,
        languagesKnown: c.languagesKnown ?? [],
        bio: c.bio ?? null,
        address: c.address ?? null,
        houseNumber: c.houseNumber ?? null,
        street: c.street ?? null,
        area: c.area ?? null,
        village: c.village ?? null,
        mandal: c.mandal ?? null,
        district: c.district,
        state: c.state ?? null,
        pincode: c.pincode ?? null,
        designation: c.designation,
        reporterType: c.reporterType,
        experience: c.experience ?? null,
        contributorType: c.contributorType ?? null,
        registrationSource: c.registrationSource ?? null,
        source: c.source ?? null,
        recruitedBy: c.recruitedBy ?? null,
        referralBy: c.referralBy ?? null,
        referralCode: c.referralCode ?? null,
        registrationDate: c.registrationDate ?? null,
        appliedOn: c.appliedOn,
        approvedOn: c.approvedOn ?? null,
        approvedBy: c.approvedBy ?? null,
        rejectedOn: c.rejectedOn ?? null,
        remarks: c.remarks ?? null,
        verificationStatus: c.verificationStatus ?? null,
        verifiedBy: c.verifiedBy ?? null,
        verificationDate: c.verificationDate ?? null,
        aadhaarMasked: c.aadhaarMasked ?? null,
        panMasked: c.panMasked ?? null,
        coverageAreas: c.coverageAreas ?? [],
        newsGenres: c.newsGenres ?? [],
        assignedMandal: c.assignedMandal ?? null,
        assignedVillage: c.assignedVillage ?? null,
        coveragePriorityLevel: c.coveragePriorityLevel ?? null,
        accountHolderName: c.accountHolderName ?? null,
        bankName: c.bankName ?? null,
        accountNumberMasked: c.accountNumberMasked ?? null,
        ifscCode: c.ifscCode ?? null,
        branch: c.branch ?? null,
        upiId: c.upiId ?? null,
        paymentMethod: c.preferredPaymentMethod ?? null,
        deviceInfo: {
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
          totalContentSubmitted: c.totalContentSubmitted, contentPublished: c.contentPublished,
          pendingStories: c.pendingStories, rejectedStories: c.rejectedStories,
          draftStories: c.draftStories, imageStories: c.imageStories,
          videoStories: c.videoStories, liveSessions: c.liveSessions,
          avgApprovalTime: c.avgApprovalTime,
          lastStoryPublished: c.lastStoryPublished?.toISOString(),
          mostActiveCategory: c.mostActiveCategory, contentViews: c.contentViews,
          totalLikes: c.totalLikes, totalShares: c.totalShares,
          totalComments: c.totalComments, followers: c.followers,
          avgStoryReach: c.avgStoryReach, accuracyRate: c.accuracyRate,
          adminNotes: c.adminNotes, tags: c.tags, documents: c.documents,
        },
      },
    })
  }
  console.log(`  ✓ contributors: ${SEED_CONTRIBUTORS.length} seeded`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Supabase with PuraLocal data…\n')

  await upsertOrg()

  console.log('\nUsers:')
  const userIdMap: Record<string, string> = {}
  for (const u of SEEDED_USERS) {
    const id = await upsertUser(u)
    userIdMap[u.email] = id
  }

  const orgAdminEmail = SEEDED_USERS.find(u => u.role === 'ORG_ADMIN')!.email
  const orgAdminId = userIdMap[orgAdminEmail]!

  console.log('\nReference data:')
  await seedCategories()
  await seedLocations()
  await seedLanguages()
  await seedRoleDefinitions()
  await seedNotificationTemplates()

  console.log('\nCommission rules:')
  await seedCommissionRules()

  console.log('\nContent:')
  await seedContent(userIdMap)

  console.log('\nAudit log:')
  await seedAuditLog(orgAdminId)

  console.log('\nReporters & contributors:')
  await seedReporters()
  await seedContributors()

  console.log('\n✅ Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
