import type { Role } from '@/lib/rbac/permissions'

export interface Organization {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export interface UserWithRole {
  id: string
  email: string
  name: string
  role: Role
  organizationId: string
  invitedAt: Date
  joinedAt: Date | null
}

export interface RoleAssignment {
  userId: string
  role: Role
  organizationId: string
  assignedAt: Date
  assignedBy: string
}

export interface AuditEntry {
  id: string
  organizationId: string
  actorId: string
  actorName: string
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  targetLabel: string
  metadata: Record<string, unknown>
  createdAt: Date
}

export type AuditAction =
  | 'user.invited'
  | 'user.role_assigned'
  | 'user.role_removed'
  | 'user.removed'
  | 'org.settings_updated'

export type AuditTargetType = 'user' | 'organization'
