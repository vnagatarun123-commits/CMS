import { describe, it, expect } from 'vitest'
import { can, requirePermission } from '@/lib/rbac/can'
import { Role, Permission, ROLE_PERMISSIONS } from '@/lib/rbac/permissions'
import { ForbiddenError } from '@/lib/errors'
import type { User } from '@/types/auth'

function makeUser(role: Role): User {
  return { id: 'u_test', email: 'test@test.com', name: 'Test', role, organizationId: 'org_test' }
}

const allRoles = Object.values(Role)
const allPermissions = Object.values(Permission)

describe('can()', () => {
  it('returns true for every permission granted to a role', () => {
    for (const role of allRoles) {
      const user = makeUser(role)
      for (const permission of ROLE_PERMISSIONS[role] ?? []) {
        expect(can(user, permission), `${role} → ${permission} should be true`).toBe(true)
      }
    }
  })

  it('returns false for every permission NOT granted to a role', () => {
    for (const role of allRoles) {
      const user = makeUser(role)
      const granted = new Set<string>(ROLE_PERMISSIONS[role] ?? [])
      for (const permission of allPermissions) {
        if (!granted.has(permission)) {
          expect(can(user, permission), `${role} → ${permission} should be false`).toBe(false)
        }
      }
    }
  })

  it('SUPER_ADMIN has every permission', () => {
    const user = makeUser(Role.SUPER_ADMIN)
    for (const permission of allPermissions) {
      expect(can(user, permission), `SUPER_ADMIN missing ${permission}`).toBe(true)
    }
  })

  it('REPORTER only has content:edit', () => {
    const user = makeUser(Role.REPORTER)
    expect(can(user, Permission.CONTENT_EDIT)).toBe(true)
    expect(can(user, Permission.CONTENT_REVIEW)).toBe(false)
    expect(can(user, Permission.CONTENT_PUBLISH)).toBe(false)
    expect(can(user, Permission.USERS_MANAGE)).toBe(false)
    expect(can(user, Permission.ORG_CONFIGURE)).toBe(false)
    expect(can(user, Permission.PLATFORM_MANAGE)).toBe(false)
  })

  it('ANALYTICS_VIEWER only has analytics:view', () => {
    const user = makeUser(Role.ANALYTICS_VIEWER)
    expect(can(user, Permission.ANALYTICS_VIEW)).toBe(true)
    expect(can(user, Permission.CONTENT_EDIT)).toBe(false)
    expect(can(user, Permission.USERS_MANAGE)).toBe(false)
  })

  it('covers all 11 roles', () => {
    expect(allRoles).toHaveLength(11)
  })

  it('covers all 13 permissions', () => {
    expect(allPermissions).toHaveLength(13)
  })
})

describe('requirePermission()', () => {
  it('does not throw when permission is held', () => {
    const user = makeUser(Role.EDITOR)
    expect(() => requirePermission(user, Permission.CONTENT_EDIT)).not.toThrow()
  })

  it('throws ForbiddenError when permission is missing', () => {
    const user = makeUser(Role.REPORTER)
    expect(() => requirePermission(user, Permission.PLATFORM_MANAGE)).toThrow(ForbiddenError)
  })

  it('ForbiddenError message contains the missing permission', () => {
    const user = makeUser(Role.REPORTER)
    expect(() => requirePermission(user, Permission.PLATFORM_MANAGE))
      .toThrow('platform:manage')
  })
})
