export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppErrorPayload }

export interface AppErrorPayload {
  code: ErrorCode
  message: string
}

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'WRONG_ORG'
  | 'MISSING_ORG_CONTEXT'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
