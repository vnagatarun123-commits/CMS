'use server'

import type { RoleDefinition } from '@/types/domain'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'
import { ValidationError } from '@/lib/errors'
import { CreateRoleInput, UpdateRoleInput } from '@/lib/validation'

export const listRoles = withAuth(
  Permission.USERS_VIEW,
  async (session): Promise<RoleDefinition[]> => {
    return getBackend().data.roleDefinitions.list(session.orgContext.organizationId)
  },
)

export const createRole = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, input: unknown): Promise<RoleDefinition> => {
    const parsed = CreateRoleInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const role = await backend.data.roleDefinitions.create({
      id: parsed.data.name.toUpperCase().replace(/\s+/g, '_'),
      organizationId: session.orgContext.organizationId,
      name: parsed.data.name,
      permissions: parsed.data.permissions as Permission[],
      isSystem: false,
    })

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'user.role_assigned',
      targetType: 'user',
      targetId: role.id,
      targetLabel: role.name,
      metadata: { action: 'role.created', permissions: role.permissions },
    })

    return role
  },
)

export const updateRole = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, input: unknown): Promise<RoleDefinition> => {
    const { id, ...rest } = input as { id: string; name: string; permissions: string[] }
    const parsed = UpdateRoleInput.safeParse(rest)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const role = await backend.data.roleDefinitions.update(
      id,
      session.orgContext.organizationId,
      { name: parsed.data.name, permissions: parsed.data.permissions as Permission[] },
    )

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'user.role_assigned',
      targetType: 'user',
      targetId: role.id,
      targetLabel: role.name,
      metadata: { action: 'role.updated', permissions: role.permissions },
    })

    return role
  },
)

export const deleteRole = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<{ deleted: string }> => {
    const backend = getBackend()
    await backend.data.roleDefinitions.delete(id, session.orgContext.organizationId)

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'user.removed',
      targetType: 'user',
      targetId: id,
      targetLabel: id,
      metadata: { action: 'role.deleted' },
    })

    return { deleted: id }
  },
)
