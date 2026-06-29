import { ContentStatus, ContentSource } from '@/types/domain'
import { Permission } from '@/lib/rbac/permissions'

// ── Allowed transitions ───────────────────────────────────────────────────────

export const ALLOWED_TRANSITIONS: Record<ContentStatus, readonly ContentStatus[]> = {
  [ContentStatus.DRAFT]:               [ContentStatus.UNDER_REVIEW, ContentStatus.SCHEDULED, ContentStatus.PUBLISHED],
  [ContentStatus.UNDER_REVIEW]:        [ContentStatus.NEEDS_CLARIFICATION, ContentStatus.PUBLISHED, ContentStatus.SCHEDULED],
  [ContentStatus.NEEDS_CLARIFICATION]: [ContentStatus.PUBLISHED, ContentStatus.DRAFT],
  [ContentStatus.SCHEDULED]:           [ContentStatus.PUBLISHED],
  [ContentStatus.PUBLISHED]:           [],
}

// ── Permission gates per transition ──────────────────────────────────────────
// Transitions not listed here require only CONTENT_EDIT (basic authorship).
// DRAFT→SCHEDULED and DRAFT→PUBLISHED are gated at content:create so the bar
// is identical whether the status is set at creation or via an explicit transition.

type TransitionKey = `${ContentStatus}->${ContentStatus}`

const TRANSITION_PERMISSIONS: Partial<Record<TransitionKey, Permission>> = {
  [`${ContentStatus.DRAFT}->${ContentStatus.SCHEDULED}`]:              Permission.CONTENT_CREATE,
  [`${ContentStatus.DRAFT}->${ContentStatus.PUBLISHED}`]:              Permission.CONTENT_CREATE,
  [`${ContentStatus.UNDER_REVIEW}->${ContentStatus.NEEDS_CLARIFICATION}`]: Permission.CONTENT_REVIEW,
  [`${ContentStatus.UNDER_REVIEW}->${ContentStatus.PUBLISHED}`]:           Permission.CONTENT_REVIEW,
  [`${ContentStatus.UNDER_REVIEW}->${ContentStatus.SCHEDULED}`]:           Permission.CONTENT_REVIEW,
  [`${ContentStatus.NEEDS_CLARIFICATION}->${ContentStatus.PUBLISHED}`]:    Permission.CONTENT_REVIEW,
  [`${ContentStatus.NEEDS_CLARIFICATION}->${ContentStatus.DRAFT}`]:        Permission.CONTENT_REVIEW,
  [`${ContentStatus.SCHEDULED}->${ContentStatus.PUBLISHED}`]:              Permission.CONTENT_PUBLISH,
}

// ── Initial status resolution ─────────────────────────────────────────────────
// APP submissions always enter UNDER_REVIEW regardless of any requested status.
// CMS authors choose their initial status; falls back to DRAFT if not provided.

export function resolveInitialStatus(
  source: ContentSource,
  requested?: ContentStatus,
): ContentStatus {
  if (source === ContentSource.APP) return ContentStatus.UNDER_REVIEW
  return requested ?? ContentStatus.DRAFT
}

// ── Errors ────────────────────────────────────────────────────────────────────

export class InvalidTransitionError extends Error {
  constructor(from: ContentStatus, to: ContentStatus) {
    super(`Cannot transition from ${from} to ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export class InsufficientPermissionError extends Error {
  readonly required: Permission
  constructor(required: Permission) {
    super(`Permission required: ${required}`)
    this.name = 'InsufficientPermissionError'
    this.required = required
  }
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Validate that a transition is allowed and the actor has the required permission.
 * Throws InvalidTransitionError or InsufficientPermissionError on failure.
 * Returns the permission that was required (or null if only CONTENT_EDIT suffices).
 */
export function validateTransition(
  from: ContentStatus,
  to: ContentStatus,
  actorPermissions: readonly Permission[],
): Permission | null {
  const allowed = ALLOWED_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to)
  }

  const key: TransitionKey = `${from}->${to}`
  const required = TRANSITION_PERMISSIONS[key] ?? null

  if (required && !actorPermissions.includes(required)) {
    throw new InsufficientPermissionError(required)
  }

  return required
}

/**
 * Returns the list of statuses the actor can transition to from the current status.
 */
export function availableTransitions(
  current: ContentStatus,
  actorPermissions: readonly Permission[],
): ContentStatus[] {
  return ALLOWED_TRANSITIONS[current].filter((to) => {
    const key: TransitionKey = `${current}->${to}`
    const required = TRANSITION_PERMISSIONS[key]
    return !required || actorPermissions.includes(required)
  })
}
