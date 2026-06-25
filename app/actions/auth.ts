'use server'

import type { ApiEnvelope } from '@/types/api'
import type { Session } from '@/types/auth'
import { getBackend } from '@/lib/backend'
import { ok, envelopeFromError, ValidationError } from '@/lib/errors'
import { SignInInput } from '@/lib/validation'

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
