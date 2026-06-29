'use server'

import type { Content, ContentTransition } from '@/types/domain'
import { ContentStatus } from '@/types/domain'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { toSlug } from '@/lib/utils'
import {
  CreateContentInput,
  UpdateContentInput,
  TransitionContentInput,
} from '@/lib/content/validation'
import {
  validateTransition,
  resolveInitialStatus,
} from '@/lib/content/state-machine'
import type { ContentListOptions } from '@/lib/data/repositories'

// ── List ──────────────────────────────────────────────────────────────────────

export const listContent = withAuth(
  Permission.CONTENT_EDIT,
  async (session, opts?: ContentListOptions): Promise<Content[]> => {
    return getBackend().data.content.list(session.orgContext.organizationId, opts)
  },
)

export const getContent = withAuth(
  Permission.CONTENT_EDIT,
  async (session, id: string): Promise<Content> => {
    const item = await getBackend().data.content.findById(id, session.orgContext.organizationId)
    if (!item) throw new NotFoundError('Content')
    return item
  },
)

// ── Create ────────────────────────────────────────────────────────────────────

export const createContent = withAuth(
  Permission.CONTENT_CREATE,
  async (session, input: unknown): Promise<Content> => {
    const parsed = CreateContentInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId

    const status = resolveInitialStatus(parsed.data.source, parsed.data.status)
    const isDirectPublish = status === ContentStatus.PUBLISHED

    const content = await backend.data.content.create({
      organizationId: orgId,
      type: parsed.data.type,
      status,
      source: parsed.data.source,
      title: parsed.data.title,
      slug: parsed.data.slug ?? toSlug(parsed.data.title),
      body: parsed.data.body ?? null,
      excerpt: parsed.data.excerpt ?? null,
      mediaUrl:       parsed.data.mediaUrl ?? null,
      thumbnailUrl:   parsed.data.thumbnailUrl ?? null,
      imageUrls:      parsed.data.imageUrls ?? [],
      orientation:    parsed.data.orientation ?? null,
      youtubeUrl:     parsed.data.youtubeUrl ?? null,
      categoryId:     parsed.data.categoryId ?? null,
      locationId:     parsed.data.locationId ?? null,
      languageId:     parsed.data.languageId ?? null,
      reporterId:     parsed.data.reporterId ?? null,
      tags:           parsed.data.tags ?? [],
      isBreakingNews: parsed.data.isBreakingNews ?? false,
      isTrending:     parsed.data.isTrending ?? false,
      isFeatured:     parsed.data.isFeatured ?? false,
      scheduledAt:    parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
    })

    await backend.data.content.addTransition({
      contentId: content.id,
      fromStatus: null,
      toStatus: status,
      actorId: session.user.id,
      actorName: session.user.name,
      note: 'Content created',
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'content.created',
      targetType: 'content',
      targetId: content.id,
      targetLabel: content.title,
      metadata: {
        type: content.type,
        status,
        source: content.source,
        directPublish: isDirectPublish,
      },
    })

    return content
  },
)

// ── Update ────────────────────────────────────────────────────────────────────

export const updateContent = withAuth(
  Permission.CONTENT_EDIT,
  async (session, id: string, input: unknown): Promise<Content> => {
    const parsed = UpdateContentInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId

    const existing = await backend.data.content.findById(id, orgId)
    if (!existing) throw new NotFoundError('Content')

    const updated = await backend.data.content.update(id, orgId, {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'content.updated',
      targetType: 'content',
      targetId: id,
      targetLabel: updated.title,
    })

    return updated
  },
)

// ── Transition ────────────────────────────────────────────────────────────────

export const transitionContent = withAuth(
  Permission.CONTENT_EDIT,
  async (session, input: unknown): Promise<Content> => {
    const parsed = TransitionContentInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId

    const existing = await backend.data.content.findById(parsed.data.contentId, orgId)
    if (!existing) throw new NotFoundError('Content')

    // Collect actor permissions from session for permission gate
    const { can } = await import('@/lib/rbac/can')
    const actorPermissions = Object.values(Permission).filter(
      (p) => can(session.user, p),
    )

    validateTransition(existing.status, parsed.data.toStatus as ContentStatus, actorPermissions)

    const updated = await backend.data.content.updateStatus(parsed.data.contentId, orgId, parsed.data.toStatus as ContentStatus, parsed.data.note ?? null)

    await backend.data.content.addTransition({
      contentId: parsed.data.contentId,
      fromStatus: existing.status,
      toStatus: parsed.data.toStatus as ContentStatus,
      actorId: session.user.id,
      actorName: session.user.name,
      note: parsed.data.note ?? null,
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'content.transitioned',
      targetType: 'content',
      targetId: parsed.data.contentId,
      targetLabel: existing.title,
      metadata: { from: existing.status, to: parsed.data.toStatus, note: parsed.data.note },
    })

    return updated
  },
)

// ── Visibility toggle ─────────────────────────────────────────────────────────

export const toggleContentVisibility = withAuth(
  Permission.CONTENT_EDIT,
  async (session, id: string, visible: boolean): Promise<Content> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const existing = await backend.data.content.findById(id, orgId)
    if (!existing) throw new NotFoundError('Content')
    const updated = await backend.data.content.toggleVisibility(id, orgId, visible)
    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'content.updated',
      targetType: 'content',
      targetId: id,
      targetLabel: existing.title,
      metadata: { isVisibleInApp: visible },
    })
    return updated
  },
)

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteContent = withAuth(
  Permission.CONTENT_EDIT,
  async (session, id: string): Promise<{ deleted: string }> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId

    const existing = await backend.data.content.findById(id, orgId)
    if (!existing) throw new NotFoundError('Content')

    await backend.data.content.softDelete(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'content.deleted',
      targetType: 'content',
      targetId: id,
      targetLabel: existing.title,
    })

    return { deleted: id }
  },
)

// ── Transitions history ───────────────────────────────────────────────────────

export const listTransitions = withAuth(
  Permission.CONTENT_EDIT,
  async (session, contentId: string): Promise<ContentTransition[]> => {
    return getBackend().data.content.listTransitions(contentId, session.orgContext.organizationId)
  },
)
