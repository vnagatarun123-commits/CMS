import { describe, it, expect } from 'vitest'
import {
  validateTransition,
  availableTransitions,
  resolveInitialStatus,
  ALLOWED_TRANSITIONS,
  InvalidTransitionError,
  InsufficientPermissionError,
} from '@/lib/content/state-machine'
import { ContentStatus, ContentSource } from '@/types/domain'
import { Permission } from '@/lib/rbac/permissions'

// Permission sets that mirror realistic role combinations
const EDIT_ONLY:    Permission[] = [Permission.CONTENT_EDIT]
const CREATOR:      Permission[] = [Permission.CONTENT_CREATE, Permission.CONTENT_EDIT]
const REVIEWER:     Permission[] = [Permission.CONTENT_REVIEW, Permission.CONTENT_EDIT]
const PUBLISHER:    Permission[] = [Permission.CONTENT_PUBLISH, Permission.CONTENT_REVIEW, Permission.CONTENT_CREATE, Permission.CONTENT_EDIT]
const NO_PERMS:     Permission[] = []

// ── resolveInitialStatus() ────────────────────────────────────────────────────

describe('resolveInitialStatus()', () => {
  it('APP always → UNDER_REVIEW regardless of requested status', () => {
    expect(resolveInitialStatus(ContentSource.APP)).toBe(ContentStatus.UNDER_REVIEW)
    expect(resolveInitialStatus(ContentSource.APP, ContentStatus.DRAFT)).toBe(ContentStatus.UNDER_REVIEW)
    expect(resolveInitialStatus(ContentSource.APP, ContentStatus.PUBLISHED)).toBe(ContentStatus.UNDER_REVIEW)
  })

  it('CMS with no requested status → DRAFT', () => {
    expect(resolveInitialStatus(ContentSource.CMS)).toBe(ContentStatus.DRAFT)
  })

  it('CMS respects requested status', () => {
    expect(resolveInitialStatus(ContentSource.CMS, ContentStatus.UNDER_REVIEW)).toBe(ContentStatus.UNDER_REVIEW)
    expect(resolveInitialStatus(ContentSource.CMS, ContentStatus.SCHEDULED)).toBe(ContentStatus.SCHEDULED)
    expect(resolveInitialStatus(ContentSource.CMS, ContentStatus.PUBLISHED)).toBe(ContentStatus.PUBLISHED)
  })
})

// ── ALLOWED_TRANSITIONS shape ─────────────────────────────────────────────────

describe('ALLOWED_TRANSITIONS', () => {
  it('every status has an entry', () => {
    for (const status of Object.values(ContentStatus)) {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(status)
    }
  })

  it('PUBLISHED has no outbound transitions (terminal)', () => {
    expect(ALLOWED_TRANSITIONS[ContentStatus.PUBLISHED]).toHaveLength(0)
  })

  it('DRAFT → UNDER_REVIEW, SCHEDULED, PUBLISHED', () => {
    const targets = ALLOWED_TRANSITIONS[ContentStatus.DRAFT]
    expect(targets).toContain(ContentStatus.UNDER_REVIEW)
    expect(targets).toContain(ContentStatus.SCHEDULED)
    expect(targets).toContain(ContentStatus.PUBLISHED)
    expect(targets).not.toContain(ContentStatus.NEEDS_CLARIFICATION)
  })

  it('UNDER_REVIEW → NEEDS_CLARIFICATION, PUBLISHED, SCHEDULED (not DRAFT)', () => {
    const targets = ALLOWED_TRANSITIONS[ContentStatus.UNDER_REVIEW]
    expect(targets).toContain(ContentStatus.NEEDS_CLARIFICATION)
    expect(targets).toContain(ContentStatus.PUBLISHED)
    expect(targets).toContain(ContentStatus.SCHEDULED)
    expect(targets).not.toContain(ContentStatus.DRAFT)
  })

  it('NEEDS_CLARIFICATION → PUBLISHED, DRAFT only (no return to UNDER_REVIEW)', () => {
    const targets = ALLOWED_TRANSITIONS[ContentStatus.NEEDS_CLARIFICATION]
    expect(targets).toContain(ContentStatus.PUBLISHED)
    expect(targets).toContain(ContentStatus.DRAFT)
    expect(targets).not.toContain(ContentStatus.UNDER_REVIEW)
  })

  it('SCHEDULED → PUBLISHED only (no revert to DRAFT)', () => {
    const targets = ALLOWED_TRANSITIONS[ContentStatus.SCHEDULED]
    expect(targets).toEqual([ContentStatus.PUBLISHED])
  })
})

// ── validateTransition: valid paths ──────────────────────────────────────────

describe('validateTransition() — valid paths', () => {
  it('DRAFT → UNDER_REVIEW needs no special permission', () => {
    expect(() => validateTransition(ContentStatus.DRAFT, ContentStatus.UNDER_REVIEW, EDIT_ONLY)).not.toThrow()
    expect(validateTransition(ContentStatus.DRAFT, ContentStatus.UNDER_REVIEW, EDIT_ONLY)).toBeNull()
  })

  it('DRAFT → SCHEDULED requires CONTENT_CREATE', () => {
    expect(validateTransition(ContentStatus.DRAFT, ContentStatus.SCHEDULED, CREATOR)).toBe(Permission.CONTENT_CREATE)
  })

  it('DRAFT → PUBLISHED requires CONTENT_CREATE', () => {
    expect(validateTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED, CREATOR)).toBe(Permission.CONTENT_CREATE)
  })

  it('UNDER_REVIEW → NEEDS_CLARIFICATION requires CONTENT_REVIEW', () => {
    expect(validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.NEEDS_CLARIFICATION, REVIEWER)).toBe(Permission.CONTENT_REVIEW)
  })

  it('UNDER_REVIEW → PUBLISHED requires CONTENT_REVIEW', () => {
    expect(validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.PUBLISHED, REVIEWER)).toBe(Permission.CONTENT_REVIEW)
  })

  it('UNDER_REVIEW → SCHEDULED requires CONTENT_REVIEW', () => {
    expect(validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.SCHEDULED, REVIEWER)).toBe(Permission.CONTENT_REVIEW)
  })

  it('NEEDS_CLARIFICATION → PUBLISHED requires CONTENT_REVIEW', () => {
    expect(validateTransition(ContentStatus.NEEDS_CLARIFICATION, ContentStatus.PUBLISHED, REVIEWER)).toBe(Permission.CONTENT_REVIEW)
  })

  it('NEEDS_CLARIFICATION → DRAFT requires CONTENT_REVIEW', () => {
    expect(validateTransition(ContentStatus.NEEDS_CLARIFICATION, ContentStatus.DRAFT, REVIEWER)).toBe(Permission.CONTENT_REVIEW)
  })

  it('SCHEDULED → PUBLISHED requires CONTENT_PUBLISH', () => {
    expect(validateTransition(ContentStatus.SCHEDULED, ContentStatus.PUBLISHED, PUBLISHER)).toBe(Permission.CONTENT_PUBLISH)
  })
})

// ── validateTransition: invalid state paths ───────────────────────────────────

describe('validateTransition() — invalid state paths', () => {
  it('DRAFT → NEEDS_CLARIFICATION throws', () => {
    expect(() => validateTransition(ContentStatus.DRAFT, ContentStatus.NEEDS_CLARIFICATION, REVIEWER))
      .toThrow(InvalidTransitionError)
  })

  it('UNDER_REVIEW → DRAFT throws (no longer a valid transition)', () => {
    expect(() => validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.DRAFT, PUBLISHER))
      .toThrow(InvalidTransitionError)
  })

  it('NEEDS_CLARIFICATION → UNDER_REVIEW throws (clarification does not re-enter review)', () => {
    expect(() => validateTransition(ContentStatus.NEEDS_CLARIFICATION, ContentStatus.UNDER_REVIEW, REVIEWER))
      .toThrow(InvalidTransitionError)
  })

  it('SCHEDULED → DRAFT throws (scheduled cannot be reverted)', () => {
    expect(() => validateTransition(ContentStatus.SCHEDULED, ContentStatus.DRAFT, PUBLISHER))
      .toThrow(InvalidTransitionError)
  })

  it('SCHEDULED → UNDER_REVIEW throws', () => {
    expect(() => validateTransition(ContentStatus.SCHEDULED, ContentStatus.UNDER_REVIEW, PUBLISHER))
      .toThrow(InvalidTransitionError)
  })

  it('PUBLISHED → DRAFT throws (terminal state)', () => {
    expect(() => validateTransition(ContentStatus.PUBLISHED, ContentStatus.DRAFT, PUBLISHER))
      .toThrow(InvalidTransitionError)
  })

  it('PUBLISHED → UNDER_REVIEW throws', () => {
    expect(() => validateTransition(ContentStatus.PUBLISHED, ContentStatus.UNDER_REVIEW, PUBLISHER))
      .toThrow(InvalidTransitionError)
  })
})

// ── validateTransition: permission failures ───────────────────────────────────

describe('validateTransition() — permission gates', () => {
  it('DRAFT → SCHEDULED denied without CONTENT_CREATE', () => {
    expect(() => validateTransition(ContentStatus.DRAFT, ContentStatus.SCHEDULED, EDIT_ONLY))
      .toThrow(InsufficientPermissionError)
  })

  it('DRAFT → PUBLISHED denied without CONTENT_CREATE', () => {
    expect(() => validateTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED, EDIT_ONLY))
      .toThrow(InsufficientPermissionError)
  })

  it('UNDER_REVIEW → NEEDS_CLARIFICATION denied without CONTENT_REVIEW', () => {
    expect(() => validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.NEEDS_CLARIFICATION, CREATOR))
      .toThrow(InsufficientPermissionError)
  })

  it('UNDER_REVIEW → PUBLISHED denied without CONTENT_REVIEW', () => {
    expect(() => validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.PUBLISHED, CREATOR))
      .toThrow(InsufficientPermissionError)
  })

  it('UNDER_REVIEW → SCHEDULED denied without CONTENT_REVIEW', () => {
    expect(() => validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.SCHEDULED, CREATOR))
      .toThrow(InsufficientPermissionError)
  })

  it('NEEDS_CLARIFICATION → PUBLISHED denied without CONTENT_REVIEW', () => {
    expect(() => validateTransition(ContentStatus.NEEDS_CLARIFICATION, ContentStatus.PUBLISHED, CREATOR))
      .toThrow(InsufficientPermissionError)
  })

  it('NEEDS_CLARIFICATION → DRAFT denied without CONTENT_REVIEW', () => {
    expect(() => validateTransition(ContentStatus.NEEDS_CLARIFICATION, ContentStatus.DRAFT, CREATOR))
      .toThrow(InsufficientPermissionError)
  })

  it('SCHEDULED → PUBLISHED denied without CONTENT_PUBLISH', () => {
    expect(() => validateTransition(ContentStatus.SCHEDULED, ContentStatus.PUBLISHED, REVIEWER))
      .toThrow(InsufficientPermissionError)
  })

  it('any gated transition denied with no permissions', () => {
    expect(() => validateTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED, NO_PERMS))
      .toThrow(InsufficientPermissionError)
    expect(() => validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.NEEDS_CLARIFICATION, NO_PERMS))
      .toThrow(InsufficientPermissionError)
  })

  it('InsufficientPermissionError carries the required permission', () => {
    try {
      validateTransition(ContentStatus.DRAFT, ContentStatus.PUBLISHED, EDIT_ONLY)
    } catch (err) {
      expect(err).toBeInstanceOf(InsufficientPermissionError)
      expect((err as InsufficientPermissionError).required).toBe(Permission.CONTENT_CREATE)
    }
    try {
      validateTransition(ContentStatus.UNDER_REVIEW, ContentStatus.PUBLISHED, CREATOR)
    } catch (err) {
      expect(err).toBeInstanceOf(InsufficientPermissionError)
      expect((err as InsufficientPermissionError).required).toBe(Permission.CONTENT_REVIEW)
    }
  })
})

// ── availableTransitions() ────────────────────────────────────────────────────

describe('availableTransitions()', () => {
  it('DRAFT + edit-only: only UNDER_REVIEW', () => {
    expect(availableTransitions(ContentStatus.DRAFT, EDIT_ONLY)).toEqual([ContentStatus.UNDER_REVIEW])
  })

  it('DRAFT + creator: UNDER_REVIEW, SCHEDULED, PUBLISHED', () => {
    const result = availableTransitions(ContentStatus.DRAFT, CREATOR)
    expect(result).toContain(ContentStatus.UNDER_REVIEW)
    expect(result).toContain(ContentStatus.SCHEDULED)
    expect(result).toContain(ContentStatus.PUBLISHED)
  })

  it('UNDER_REVIEW + reviewer: NEEDS_CLARIFICATION, PUBLISHED, SCHEDULED', () => {
    const result = availableTransitions(ContentStatus.UNDER_REVIEW, REVIEWER)
    expect(result).toContain(ContentStatus.NEEDS_CLARIFICATION)
    expect(result).toContain(ContentStatus.PUBLISHED)
    expect(result).toContain(ContentStatus.SCHEDULED)
  })

  it('UNDER_REVIEW + edit-only: nothing (all transitions require review/publish)', () => {
    expect(availableTransitions(ContentStatus.UNDER_REVIEW, EDIT_ONLY)).toEqual([])
  })

  it('UNDER_REVIEW + creator (no review): nothing', () => {
    expect(availableTransitions(ContentStatus.UNDER_REVIEW, CREATOR)).toEqual([])
  })

  it('NEEDS_CLARIFICATION + reviewer: PUBLISHED and DRAFT', () => {
    const result = availableTransitions(ContentStatus.NEEDS_CLARIFICATION, REVIEWER)
    expect(result).toContain(ContentStatus.PUBLISHED)
    expect(result).toContain(ContentStatus.DRAFT)
    expect(result).not.toContain(ContentStatus.UNDER_REVIEW)
  })

  it('NEEDS_CLARIFICATION + edit-only: nothing (both require CONTENT_REVIEW)', () => {
    expect(availableTransitions(ContentStatus.NEEDS_CLARIFICATION, EDIT_ONLY)).toEqual([])
  })

  it('SCHEDULED + publisher: PUBLISHED', () => {
    expect(availableTransitions(ContentStatus.SCHEDULED, PUBLISHER)).toEqual([ContentStatus.PUBLISHED])
  })

  it('SCHEDULED + reviewer (no CONTENT_PUBLISH): nothing', () => {
    expect(availableTransitions(ContentStatus.SCHEDULED, REVIEWER)).toEqual([])
  })

  it('PUBLISHED: no transitions (terminal)', () => {
    expect(availableTransitions(ContentStatus.PUBLISHED, PUBLISHER)).toEqual([])
  })
})
