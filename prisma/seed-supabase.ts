/**
 * Seed script for the Supabase (real DB) backend.
 * Creates the PuraLocal org, 11 auth users, profiles, role assignments, and
 * an initial audit log entry — mirroring the mock seed data.
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
import { SEEDED_ORG, SEEDED_USERS } from '../lib/mock/seed'

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
    update: { email: user.email, name: user.name },
    create: {
      id: authId,
      email: user.email,
      name: user.name,
      organizationId: SEEDED_ORG.id,
      invitedAt: user.invitedAt,
      joinedAt: user.joinedAt,
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Supabase with PuraLocal data…')

  await upsertOrg()

  console.log('Users:')
  const allIds = await Promise.all(SEEDED_USERS.map((u) => upsertUser(u)))
  const orgAdminIdx = SEEDED_USERS.findIndex((u) => u.role === 'ORG_ADMIN')
  const orgAdminId = allIds[orgAdminIdx]
  if (!orgAdminId) throw new Error('ORG_ADMIN not found in seeded users')

  // Initial audit log entry so the audit log table is non-empty.
  const existingLogs = await prisma.auditLog.count({ where: { organizationId: SEEDED_ORG.id } })
  if (existingLogs === 0) {
    await prisma.auditLog.create({
      data: {
        organizationId: SEEDED_ORG.id,
        actorId: orgAdminId,
        actorName: 'Org Admin',
        action: 'org.settings_updated',
        targetType: 'organization',
        targetId: SEEDED_ORG.id,
        targetLabel: SEEDED_ORG.name,
        metadata: { note: 'Initial seed' },
      },
    })
    console.log('✓ initial audit log entry created')
  }

  console.log('\nDone.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
