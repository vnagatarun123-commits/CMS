'use server'

import type { ApiEnvelope } from '@/types/api'
import type { Session } from '@/types/auth'
import { getBackend } from '@/lib/backend'
import { ok, envelopeFromError, ValidationError } from '@/lib/errors'
import { SignInInput, ForgotPasswordInput, ResetPasswordInput } from '@/lib/validation'

export async function signIn(input: unknown): Promise<ApiEnvelope<Session>> {
  try {
    const parsed = SignInInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)
    const session = await getBackend().auth.signIn(parsed.data)
    return ok(session)
  } catch (err) {
    return envelopeFromError(err)
  }
}

export async function signOut(): Promise<ApiEnvelope<null>> {
  try {
    await getBackend().auth.signOut()
    return ok(null)
  } catch (err) {
    return envelopeFromError(err)
  }
}

export async function requestPasswordReset(input: unknown): Promise<ApiEnvelope<null>> {
  try {
    const parsed = ForgotPasswordInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
    await getBackend().auth.requestPasswordReset?.(parsed.data.email)
    return ok(null)
  } catch (err) {
    return envelopeFromError(err)
  }
}

export async function updatePassword(input: unknown): Promise<ApiEnvelope<null>> {
  try {
    const parsed = ResetPasswordInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input')
    await getBackend().auth.updatePassword?.(parsed.data.password)
    return ok(null)
  } catch (err) {
    return envelopeFromError(err)
  }
}
