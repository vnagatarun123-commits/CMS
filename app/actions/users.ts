'use server'

import type { UserWithRole, RoleAssignment } from '@/types/domain'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'
import { ValidationError } from '@/lib/errors'
import { InviteUserInput, AssignRoleInput } from '@/lib/validation'

export const inviteUser = withAuth(
  Permission.USERS_MANAGE,
  async (session, input: unknown): Promise<UserWithRole> => {
    const parsed = InviteUserInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const user = await backend.data.users.invite({
      ...parsed.data,
      organizationId: session.orgContext.organizationId,
      invitedById: session.user.id,
    })

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'user.invited',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.email,
    })

    return user
  },
)

export const assignRole = withAuth(
  Permission.USERS_MANAGE,
  async (session, input: unknown): Promise<RoleAssignment> => {
    const parsed = AssignRoleInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const assignment = await backend.data.roleAssignments.assign({
      userId: parsed.data.userId,
      role: parsed.data.role,
      organizationId: session.orgContext.organizationId,
      assignedById: session.user.id,
    })

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'user.role_assigned',
      targetType: 'user',
      targetId: parsed.data.userId,
      targetLabel: parsed.data.role,
      metadata: { role: parsed.data.role },
    })

    return assignment
  },
)

export const removeUser = withAuth(
  Permission.USERS_MANAGE,
  async (session, userId: string): Promise<{ removed: string }> => {
    const backend = getBackend()
    const user = await backend.data.users.findById(userId, session.orgContext.organizationId)

    await backend.data.users.remove(userId, session.orgContext.organizationId)

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'user.removed',
      targetType: 'user',
      targetId: userId,
      targetLabel: user?.email ?? userId,
    })

    return { removed: userId }
  },
)

export const listUsers = withAuth(
  Permission.USERS_VIEW,
  async (session): Promise<UserWithRole[]> => {
    return getBackend().data.users.listByOrg(session.orgContext.organizationId)
  },
)
