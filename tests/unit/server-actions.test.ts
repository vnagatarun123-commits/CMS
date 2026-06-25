import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { inviteUser, assignRole, listUsers, removeUser } from '@/app/actions/users'
import { getAuditLog } from '@/app/actions/audit-log'
import { signIn, signOut } from '@/app/actions/auth'
import { resetBackend } from '@/lib/backend'
import { setMockSession } from '@/lib/mock/mock-auth'
import { SEEDED_USERS, PURALOCAL_ORG_ID } from '@/lib/mock/seed'
import { Role } from '@/lib/rbac/permissions'

const orgAdmin = SEEDED_USERS.find(u => u.role === Role.ORG_ADMIN)!
const reporter  = SEEDED_USERS.find(u => u.role === Role.REPORTER)!

beforeEach(() => {
  resetBackend()
  setMockSession(null)
})

afterEach(() => {
  setMockSession(null)
  resetBackend()
})

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('signIn()', () => {
  it('returns ok session for valid credentials', async () => {
    const result = await signIn({ email: orgAdmin.email, password: 'password' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.user.id).toBe(orgAdmin.id)
    expect(result.data.orgContext.organizationId).toBe(PURALOCAL_ORG_ID)
  })

  it('returns UNAUTHENTICATED for wrong password', async () => {
    const result = await signIn({ email: orgAdmin.email, password: 'wrong' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('UNAUTHENTICATED')
  })

  it('returns VALIDATION_ERROR for malformed input', async () => {
    const result = await signIn({ email: 'not-an-email', password: 'x' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('signOut clears the session', async () => {
    await signIn({ email: orgAdmin.email, password: 'password' })
    await signOut()
    // After sign-out, a permission-gated action must fail with UNAUTHENTICATED.
    const result = await listUsers()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('UNAUTHENTICATED')
  })
})

// ── Users ─────────────────────────────────────────────────────────────────────

describe('listUsers()', () => {
  it('returns all org users for a user with USERS_VIEW', async () => {
    setMockSession(orgAdmin)
    const result = await listUsers()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.length).toBe(SEEDED_USERS.length)
    expect(result.data.every(u => u.organizationId === PURALOCAL_ORG_ID)).toBe(true)
  })

  it('returns FORBIDDEN for a role without USERS_VIEW', async () => {
    setMockSession(reporter) // REPORTER has no USERS_VIEW
    const result = await listUsers()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('FORBIDDEN')
  })
})

describe('inviteUser()', () => {
  it('creates the user and appends an audit entry', async () => {
    setMockSession(orgAdmin)
    const result = await inviteUser({ email: 'newbie@test.com', name: 'New User', role: Role.REPORTER })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.email).toBe('newbie@test.com')
    expect(result.data.organizationId).toBe(PURALOCAL_ORG_ID)

    const log = await getAuditLog({})
    expect(log.ok).toBe(true)
    if (!log.ok) return
    const entry = log.data.find(e => e.action === 'user.invited')
    expect(entry).toBeDefined()
    expect(entry?.targetLabel).toBe('newbie@test.com')
    expect(entry?.actorId).toBe(orgAdmin.id)
  })

  it('returns FORBIDDEN for REPORTER role', async () => {
    setMockSession(reporter)
    const result = await inviteUser({ email: 'x@test.com', name: 'X', role: Role.REPORTER })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('FORBIDDEN')
  })

  it('returns VALIDATION_ERROR for invalid role', async () => {
    setMockSession(orgAdmin)
    const result = await inviteUser({ email: 'x@test.com', name: 'X', role: 'NOT_A_ROLE' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('assignRole()', () => {
  it('assigns a role and appends an audit entry', async () => {
    setMockSession(orgAdmin)
    const result = await assignRole({ userId: reporter.id, role: Role.EDITOR })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.role).toBe(Role.EDITOR)
    expect(result.data.organizationId).toBe(PURALOCAL_ORG_ID)

    const log = await getAuditLog({})
    expect(log.ok).toBe(true)
    if (!log.ok) return
    expect(log.data.some(e => e.action === 'user.role_assigned')).toBe(true)
  })
})

describe('removeUser()', () => {
  it('removes a user and appends an audit entry', async () => {
    setMockSession(orgAdmin)
    const remove = await removeUser(reporter.id)
    expect(remove.ok).toBe(true)

    // User should no longer appear in list.
    const list = await listUsers()
    if (!list.ok) return
    expect(list.data.find(u => u.id === reporter.id)).toBeUndefined()

    // Audit entry written.
    const log = await getAuditLog({})
    if (!log.ok) return
    expect(log.data.some(e => e.action === 'user.removed')).toBe(true)
  })
})

// ── Audit log ─────────────────────────────────────────────────────────────────

describe('getAuditLog()', () => {
  it('returns empty log for a fresh org', async () => {
    setMockSession(orgAdmin)
    const result = await getAuditLog({})
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(0)
  })

  it('returns FORBIDDEN for a role without ORG_CONFIGURE', async () => {
    setMockSession(reporter)
    const result = await getAuditLog({})
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('FORBIDDEN')
  })
})
