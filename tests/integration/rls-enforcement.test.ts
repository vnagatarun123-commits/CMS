/**
 * RLS enforcement integration test.
 *
 * Proves that the database-layer (RLS) tenant isolation has teeth independent
 * of the app-layer assertOrg guard.  The test deliberately bypasses assertOrg
 * and calls withOrgContext directly with a different org's ID.
 *
 * Requirements:
 *   - Real Supabase Postgres (DATABASE_URL must be set)
 *   - RUN_INTEGRATION=1 env var to opt in (skipped otherwise)
 *
 * Run:
 *   RUN_INTEGRATION=1 pnpm test tests/integration/rls-enforcement.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ── Gate: skip unless RUN_INTEGRATION=1 ──────────────────────────────────────

const RUN = process.env.RUN_INTEGRATION === '1'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_A = { id: 'rls-test-org-a', name: 'RLS Test Org A', slug: 'rls-test-a' }
const ORG_B = { id: 'rls-test-org-b', name: 'RLS Test Org B', slug: 'rls-test-b' }

let prisma: PrismaClient

// ── Helpers ───────────────────────────────────────────────────────────────────

// Direct copy of the production withOrgContext — no assertOrg guard.
// This simulates a bug where assertOrg was accidentally skipped.
async function withOrgContextRaw<T>(
  orgId: string,
  fn: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE prisma_app`
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${orgId}, true)`
    return fn(tx)
  })
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!RUN) return

  prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!),
  })

  // Create two isolated orgs and one profile each (runs as postgres superuser,
  // bypasses RLS — this is intentional setup, not the code under test).
  await prisma.organization.createMany({
    data: [
      { id: ORG_A.id, name: ORG_A.name, slug: ORG_A.slug },
      { id: ORG_B.id, name: ORG_B.name, slug: ORG_B.slug },
    ],
    skipDuplicates: true,
  })

  await prisma.profile.upsert({
    where: { id: `rls-user-a` },
    update: {},
    create: {
      id: 'rls-user-a',
      email: 'rls-user-a@test.internal',
      name: 'RLS User A',
      organizationId: ORG_A.id,
      invitedAt: new Date(),
    },
  })

  await prisma.profile.upsert({
    where: { id: `rls-user-b` },
    update: {},
    create: {
      id: 'rls-user-b',
      email: 'rls-user-b@test.internal',
      name: 'RLS User B',
      organizationId: ORG_B.id,
      invitedAt: new Date(),
    },
  })
})

afterAll(async () => {
  if (!RUN || !prisma) return

  // Clean up test fixtures (runs as postgres superuser).
  await prisma.profile.deleteMany({ where: { id: { in: ['rls-user-a', 'rls-user-b'] } } })
  await prisma.organization.deleteMany({ where: { id: { in: [ORG_A.id, ORG_B.id] } } })
  await prisma.$disconnect()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RLS enforcement — cross-org isolation at the DB layer', () => {
  it.skipIf(!RUN)('withOrgContext(orgB) returns orgB profile only', async () => {
    const profiles = await withOrgContextRaw(ORG_B.id, (tx) =>
      tx.profile.findMany({ where: { organizationId: ORG_B.id } }),
    )
    expect(profiles).toHaveLength(1)
    expect(profiles[0]!.id).toBe('rls-user-b')
  })

  it.skipIf(!RUN)(
    'withOrgContext(orgB) blocks reads of orgA rows — assertOrg deliberately bypassed',
    async () => {
      // Scenario: a bug causes assertOrg to be skipped. The attacker sets their
      // own org context but queries for the other org's data via a WHERE clause.
      // RLS must return empty, not the other org's row.
      const profiles = await withOrgContextRaw(ORG_B.id, (tx) =>
        tx.profile.findMany({ where: { organizationId: ORG_A.id } }),
      )
      // RLS USING(organization_id = 'rls-test-org-b') AND WHERE(organization_id = 'rls-test-org-a')
      // = FALSE → empty result. RLS has teeth.
      expect(profiles).toHaveLength(0)
    },
  )

  it.skipIf(!RUN)(
    'withOrgContext(orgB) cannot find orgA row by ID even with correct UUID',
    async () => {
      // Attacker knows the specific row ID from another org and tries a direct lookup.
      const profile = await withOrgContextRaw(ORG_B.id, (tx) =>
        tx.profile.findUnique({ where: { id: 'rls-user-a' } }),
      )
      expect(profile).toBeNull()
    },
  )

  it.skipIf(!RUN)(
    'withOrgContext with no org set (empty string) returns no rows',
    async () => {
      // Unset org context — simulates a missing/corrupt session.
      const profiles = await withOrgContextRaw('', (tx) =>
        tx.profile.findMany({ where: { organizationId: ORG_A.id } }),
      )
      expect(profiles).toHaveLength(0)
    },
  )
})
