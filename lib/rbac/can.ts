import type { User } from '@/types/auth'
import {
  Permission,
  Capability,
  getRolePermissions,
  isCoarsePermission,
  CAPABILITY_TO_PERMISSION,
} from '@/lib/rbac/permissions'
import { ForbiddenError } from '@/lib/errors'

// Accepts either a coarse Permission or a granular Capability.
//  - Coarse:   granted if the role holds ANY granular capability in that group.
//  - Granular: granted only if the role holds that exact capability.
export function can(user: User, permission: Permission | Capability): boolean {
  const held = getRolePermissions(user.role)
  if (isCoarsePermission(permission)) {
    return held.some(c => CAPABILITY_TO_PERMISSION[c] === permission)
  }
  return held.includes(permission)
}

export function requirePermission(user: User, permission: Permission | Capability): void {
  if (!can(user, permission)) throw new ForbiddenError(permission)
}
