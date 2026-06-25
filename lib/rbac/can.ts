import type { User } from '@/types/auth'
import { Permission, ROLE_PERMISSIONS } from '@/lib/rbac/permissions'
import { ForbiddenError } from '@/lib/errors'

export function can(user: User, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[user.role] as readonly string[]).includes(permission)
}

export function requirePermission(user: User, permission: Permission): void {
  if (!can(user, permission)) throw new ForbiddenError(permission)
}
