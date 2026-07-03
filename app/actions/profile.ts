'use server'

import { revalidatePath } from 'next/cache'
import type { UserWithRole } from '@/types/domain'
import { withSession } from '@/lib/auth/with-auth'
import { getBackend } from '@/lib/backend'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { UpdateProfileInput, ChangePasswordInput } from '@/lib/validation'

export const getMyProfile = withSession(
  async (session): Promise<UserWithRole> => {
    const backend = getBackend()
    const user = await backend.data.users.findById(
      session.user.id,
      session.orgContext.organizationId,
    )
    if (!user) throw new NotFoundError('User')
    return user
  },
)

export const updateMyProfile = withSession(
  async (session, input: unknown): Promise<UserWithRole> => {
    const parsed = UpdateProfileInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const updated = await backend.data.users.updateProfile(
      session.user.id,
      session.orgContext.organizationId,
      parsed.data,
    )

    // Keep the in-process session consistent so the topbar reflects the new name/photo
    await backend.auth.patchSessionUser?.({ name: updated.name, photoUrl: updated.photoUrl })

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: updated.name,
      action: 'user.profile_updated',
      targetType: 'user',
      targetId: session.user.id,
      targetLabel: updated.email,
    })

    revalidatePath('/dashboard', 'layout')
    return updated
  },
)

export const changeMyPassword = withSession(
  async (session, input: unknown): Promise<void> => {
    const parsed = ChangePasswordInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    await backend.auth.changePassword?.(
      session.user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    )

    await backend.data.auditLog.append({
      organizationId: session.orgContext.organizationId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'auth.password_changed',
      targetType: 'user',
      targetId: session.user.id,
      targetLabel: session.user.email,
    })
  },
)
