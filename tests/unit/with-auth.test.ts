import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission, Role } from '@/lib/rbac/permissions'
import { resetBackend } from '@/lib/backend'
import { setMockSession } from '@/lib/mock/mock-auth'
import { SEEDED_USERS } from '@/lib/mock/seed'

const orgAdmin  = SEEDED_USERS.find(u => u.role === Role.ORG_ADMIN)!
const reporter  = SEEDED_USERS.find(u => u.role === Role.REPORTER)!
const superAdmin = SEEDED_USERS.find(u => u.role === Role.SUPER_ADMIN)!

// A simple action that echoes back the caller's user id.
const echoCallerId = withAuth(
  Permission.USERS_MANAGE,
  async (session) => ({ calledBy: session.user.id }),
)

// An action requiring a platform-only permission.
const platformOnly = withAuth(
  Permission.PLATFORM_MANAGE,
  async () => 'platform data',
)

beforeEach(() => {
  resetBackend()
  setMockSession(null)
})

afterEach(() => {
  setMockSession(null)
  resetBackend()
})

describe('withAuth() — unauthenticated', () => {
  it('returns UNAUTHENTICATED envelope when no session is set', async () => {
    const result = await echoCallerId()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('UNAUTHENTICATED')
  })
})

describe('withAuth() — forbidden', () => {
  it('returns FORBIDDEN when user lacks the required permission', async () => {
    setMockSession(reporter) // REPORTER does not have USERS_MANAGE
    const result = await echoCallerId()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('FORBIDDEN')
  })

  it('FORBIDDEN message names the missing permission', async () => {
    setMockSession(reporter)
    const result = await echoCallerId()
    if (result.ok) return
    expect(result.error.message).toContain('users:manage')
  })

  it('ORG_ADMIN cannot call a PLATFORM_MANAGE action', async () => {
    setMockSession(orgAdmin)
    const result = await platformOnly()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('FORBIDDEN')
  })
})

describe('withAuth() — authorised', () => {
  it('calls the handler and wraps result in ok envelope', async () => {
    setMockSession(orgAdmin)
    const result = await echoCallerId()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.calledBy).toBe(orgAdmin.id)
  })

  it('passes the full session to the handler', async () => {
    setMockSession(orgAdmin)
    let captured: unknown = null
    const inspect = withAuth(Permission.USERS_MANAGE, async (session) => {
      captured = session
      return 'ok'
    })
    await inspect()
    expect((captured as { user: { id: string } }).user.id).toBe(orgAdmin.id)
    expect((captured as { orgContext: { organizationId: string } }).orgContext.organizationId).toBeTruthy()
  })

  it('SUPER_ADMIN can call the PLATFORM_MANAGE action', async () => {
    setMockSession(superAdmin)
    const result = await platformOnly()
    expect(result.ok).toBe(true)
  })

  it('handler errors are caught and returned as INTERNAL_ERROR envelope', async () => {
    setMockSession(orgAdmin)
    const broken = withAuth(Permission.USERS_MANAGE, async () => {
      throw new Error('something went wrong')
    })
    const result = await broken()
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('INTERNAL_ERROR')
  })
})
