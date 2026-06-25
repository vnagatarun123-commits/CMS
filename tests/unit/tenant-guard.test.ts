import { describe, it, expect, beforeEach } from 'vitest'
import { MockUserRepository, MockAuditLogRepository } from '@/lib/mock/mock-repositories'
import { SEEDED_USERS, PURALOCAL_ORG_ID } from '@/lib/mock/seed'
import { MissingOrgContextError } from '@/lib/errors'

const FOREIGN_ORG_ID = 'org_foreign_999'

// Fresh repo per test — no shared state between cases.
let userRepo: MockUserRepository
let auditRepo: MockAuditLogRepository

beforeEach(() => {
  userRepo = new MockUserRepository(structuredClone(SEEDED_USERS))
  auditRepo = new MockAuditLogRepository([])
})

describe('tenant guard — missing org context', () => {
  it('listByOrg throws MissingOrgContextError on empty string', async () => {
    // Empty string represents a missing/unset org context at runtime.
    await expect(userRepo.listByOrg('')).rejects.toThrow(MissingOrgContextError)
  })

  it('findById throws MissingOrgContextError on empty string', async () => {
    await expect(userRepo.findById('user_org_admin', '')).rejects.toThrow(MissingOrgContextError)
  })

  it('findByEmail throws MissingOrgContextError on empty string', async () => {
    await expect(userRepo.findByEmail('admin@puralocal.com', '')).rejects.toThrow(MissingOrgContextError)
  })

  it('auditLog.list throws MissingOrgContextError on empty string', async () => {
    await expect(auditRepo.list('')).rejects.toThrow(MissingOrgContextError)
  })

  it('auditLog.append throws MissingOrgContextError on empty string', async () => {
    await expect(
      auditRepo.append({
        organizationId: '',
        actorId: 'user_org_admin',
        actorName: 'Org Admin',
        action: 'user.invited',
        targetType: 'user',
        targetId: 'user_new',
        targetLabel: 'new@test.com',
      }),
    ).rejects.toThrow(MissingOrgContextError)
  })
})

describe('tenant guard — cross-org isolation', () => {
  it('listByOrg returns empty array for a foreign org (no PuraLocal data leaks)', async () => {
    const users = await userRepo.listByOrg(FOREIGN_ORG_ID)
    expect(users).toHaveLength(0)
  })

  it('listByOrg returns all seeded users for the correct org', async () => {
    const users = await userRepo.listByOrg(PURALOCAL_ORG_ID)
    expect(users.length).toBe(SEEDED_USERS.length)
  })

  it('findById returns null when user exists but belongs to a different org', async () => {
    // user_org_admin exists in PURALOCAL_ORG — querying with FOREIGN_ORG must return null.
    const user = await userRepo.findById('user_org_admin', FOREIGN_ORG_ID)
    expect(user).toBeNull()
  })

  it('findById returns the user when org matches', async () => {
    const user = await userRepo.findById('user_org_admin', PURALOCAL_ORG_ID)
    expect(user).not.toBeNull()
    expect(user?.id).toBe('user_org_admin')
  })

  it('findByEmail returns null when email exists but belongs to a different org', async () => {
    const user = await userRepo.findByEmail('admin@puralocal.com', FOREIGN_ORG_ID)
    expect(user).toBeNull()
  })

  it('auditLog.list returns empty for a foreign org', async () => {
    await auditRepo.append({
      organizationId: PURALOCAL_ORG_ID,
      actorId: 'user_org_admin',
      actorName: 'Org Admin',
      action: 'user.invited',
      targetType: 'user',
      targetId: 'user_new',
      targetLabel: 'new@puralocal.com',
    })
    const entries = await auditRepo.list(FOREIGN_ORG_ID)
    expect(entries).toHaveLength(0)
  })
})
