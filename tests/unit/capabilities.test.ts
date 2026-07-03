import { describe, it, expect, afterEach } from 'vitest'
import { can } from '@/lib/rbac/can'
import {
  Permission,
  PERMISSION_CATALOG,
  ALL_CAPABILITIES,
  CAPABILITY_TO_PERMISSION,
  capabilitiesForPermission,
  expandPermissions,
  setRolePermissions,
  deleteRolePermissions,
} from '@/lib/rbac/permissions'
import type { User } from '@/types/auth'

function userWithRole(roleId: string): User {
  return { id: 'u', email: 'u@t.com', name: 'U', role: roleId, organizationId: 'org' }
}

// Register a throwaway custom role with an explicit granular capability set.
function withCustomRole(caps: string[], fn: (u: User) => void) {
  const id = 'CUSTOM_TEST_ROLE'
  setRolePermissions(id, caps)
  try { fn(userWithRole(id)) } finally { deleteRolePermissions(id) }
}

afterEach(() => deleteRolePermissions('CUSTOM_TEST_ROLE'))

describe('permission catalog integrity', () => {
  it('every capability maps to a coarse permission', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(CAPABILITY_TO_PERMISSION[cap], `${cap} unmapped`).toBeTruthy()
    }
  })

  it('every coarse permission has at least one granular child', () => {
    for (const perm of Object.values(Permission)) {
      expect(capabilitiesForPermission(perm).length, `${perm} has no children`).toBeGreaterThan(0)
    }
  })

  it('capability keys are unique', () => {
    expect(new Set(ALL_CAPABILITIES).size).toBe(ALL_CAPABILITIES.length)
  })

  it('every catalog page action is enumerated in ALL_CAPABILITIES', () => {
    const fromCatalog = PERMISSION_CATALOG.flatMap(m =>
      m.submodules.flatMap(s => s.pages.flatMap(p => p.actions.map(a => a.capability))),
    )
    expect(new Set(fromCatalog)).toEqual(new Set(ALL_CAPABILITIES))
  })
})

describe('granular enforcement is independent', () => {
  it('a role with only Video analytics is denied the other analytics sub-tabs', () => {
    withCustomRole(['analytics.video:view'], user => {
      expect(can(user, 'analytics.video:view')).toBe(true)
      expect(can(user, 'analytics.content:view')).toBe(false)
      expect(can(user, 'analytics.reporter:view')).toBe(false)
      expect(can(user, 'analytics.ads:view')).toBe(false)
    })
  })

  it('holding one child still derives the coarse permission (for module-level checks)', () => {
    withCustomRole(['analytics.video:view'], user => {
      expect(can(user, Permission.ANALYTICS_VIEW)).toBe(true)
    })
  })

  it('an unrelated coarse permission stays denied', () => {
    withCustomRole(['analytics.video:view'], user => {
      expect(can(user, Permission.CONTENT_EDIT)).toBe(false)
      expect(can(user, Permission.USERS_MANAGE)).toBe(false)
    })
  })

  it('content sub-pages are independently grantable', () => {
    withCustomRole(['content.all:review'], user => {
      expect(can(user, 'content.all:review')).toBe(true)
      expect(can(user, 'content.all:create')).toBe(false)
      expect(can(user, Permission.CONTENT_REVIEW)).toBe(true)   // derived
      expect(can(user, Permission.CONTENT_CREATE)).toBe(false)
    })
  })
})

describe('expandPermissions round-trips coarse intent', () => {
  it('expanding a coarse set derives exactly that coarse set back', () => {
    const coarse: Permission[] = [Permission.CONTENT_EDIT, Permission.ANALYTICS_VIEW]
    withCustomRole(expandPermissions(coarse), user => {
      for (const perm of Object.values(Permission)) {
        const expected = coarse.includes(perm)
        expect(can(user, perm), `${perm}`).toBe(expected)
      }
    })
  })
})
