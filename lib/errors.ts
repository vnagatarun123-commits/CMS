import type { ApiEnvelope, ErrorCode } from '@/types/api'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthenticatedError extends AppError {
  constructor() { super('UNAUTHENTICATED', 'Not authenticated') }
}

export class ForbiddenError extends AppError {
  constructor(permission?: string) {
    super('FORBIDDEN', permission ? `Missing permission: ${permission}` : 'Forbidden')
  }
}

export class WrongOrgError extends AppError {
  constructor() { super('WRONG_ORG', 'Resource belongs to a different organization') }
}

export class MissingOrgContextError extends AppError {
  constructor() { super('MISSING_ORG_CONTEXT', 'Organization context is required') }
}

export class NotFoundError extends AppError {
  constructor(resource: string) { super('NOT_FOUND', `${resource} not found`) }
}

export class ValidationError extends AppError {
  constructor(message: string) { super('VALIDATION_ERROR', message) }
}

export function ok<T>(data: T): ApiEnvelope<T> {
  return { ok: true, data }
}

export function fail(code: ErrorCode, message: string): ApiEnvelope<never> {
  return { ok: false, error: { code, message } }
}

export function envelopeFromError(err: unknown): ApiEnvelope<never> {
  if (err instanceof AppError) return fail(err.code, err.message)
  return fail('INTERNAL_ERROR', 'An unexpected error occurred')
}
