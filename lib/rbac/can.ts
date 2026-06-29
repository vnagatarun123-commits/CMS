import type { User } from '@/types/auth'
import { Permission, getRolePermissions } from '@/lib/rbac/permissions'
import { ForbiddenError } from '@/lib/errors'

export function can(user: User, permission: Permission): boolean {
  return getRolePermissions(user.role).includes(permission)
}

export function requirePermission(user: User, permission: Permission): void {
  if (!can(user, permission)) throw new ForbiddenError(permission)
}
