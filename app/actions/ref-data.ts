'use server'

import type { Category, Location, Language, Tag } from '@/types/domain'
import { withAuth } from '@/lib/auth/with-auth'
import { Permission } from '@/lib/rbac/permissions'
import { getBackend } from '@/lib/backend'
import { ValidationError, NotFoundError } from '@/lib/errors'
import { toSlug } from '@/lib/utils'
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateLanguageInput,
  UpdateLanguageInput,
  CreateTagInput,
  UpdateTagInput,
} from '@/lib/content/validation'
import type { LocationListOptions } from '@/lib/data/repositories'

// ── Categories ────────────────────────────────────────────────────────────────

export const listCategories = withAuth(
  Permission.CONTENT_EDIT,
  async (session): Promise<Category[]> => {
    return getBackend().data.categories.list(session.orgContext.organizationId)
  },
)

export const createCategory = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, input: unknown): Promise<Category> => {
    const parsed = CreateCategoryInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.categories.create({
      organizationId: orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      slug: parsed.data.slug ?? toSlug(parsed.data.name),
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'category.created',
      targetType: 'category',
      targetId: item.id,
      targetLabel: item.name,
    })

    return item
  },
)

export const updateCategory = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string, input: unknown): Promise<Category> => {
    const parsed = UpdateCategoryInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.categories.update(id, orgId, parsed.data)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'category.updated',
      targetType: 'category',
      targetId: id,
      targetLabel: item.name,
    })

    return item
  },
)

export const toggleCategory = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Category> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.categories.toggleActive(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'category.toggled',
      targetType: 'category',
      targetId: id,
      targetLabel: item.name,
      metadata: { active: item.active },
    })

    return item
  },
)

export const deleteCategory = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Category> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const existing = await backend.data.categories.findById(id, orgId)
    if (!existing) throw new NotFoundError('Category')
    const item = await backend.data.categories.softDelete(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'category.deleted',
      targetType: 'category',
      targetId: id,
      targetLabel: existing.name,
    })

    return item
  },
)

// ── Locations ─────────────────────────────────────────────────────────────────

export const listLocations = withAuth(
  Permission.CONTENT_EDIT,
  async (session, opts?: LocationListOptions): Promise<Location[]> => {
    return getBackend().data.locations.list(session.orgContext.organizationId, opts)
  },
)

export const listLocationsByLevel = withAuth(
  Permission.CONTENT_EDIT,
  async (session, level: Location['level']): Promise<Location[]> => {
    return getBackend().data.locations.listByLevel(session.orgContext.organizationId, level)
  },
)

export const listLocationChildren = withAuth(
  Permission.CONTENT_EDIT,
  async (session, parentId: string): Promise<Location[]> => {
    return getBackend().data.locations.listByParent(parentId, session.orgContext.organizationId)
  },
)

export const createLocation = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, input: unknown): Promise<Location> => {
    const parsed = CreateLocationInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.locations.create({
      organizationId: orgId,
      name: parsed.data.name,
      slug: parsed.data.slug ?? toSlug(parsed.data.name),
      level: parsed.data.level,
      parentId: parsed.data.parentId ?? null,
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'location.created',
      targetType: 'location',
      targetId: item.id,
      targetLabel: item.name,
      metadata: { level: item.level },
    })

    return item
  },
)

export const updateLocation = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string, input: unknown): Promise<Location> => {
    const parsed = UpdateLocationInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.locations.update(id, orgId, parsed.data)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'location.updated',
      targetType: 'location',
      targetId: id,
      targetLabel: item.name,
    })

    return item
  },
)

export const toggleLocation = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Location> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.locations.toggleActive(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'location.toggled',
      targetType: 'location',
      targetId: id,
      targetLabel: item.name,
      metadata: { active: item.active },
    })

    return item
  },
)

export const setLocationActive = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string, active: boolean): Promise<Location> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.locations.setActive(id, orgId, active)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'location.toggled',
      targetType: 'location',
      targetId: id,
      targetLabel: item.name,
      metadata: { active },
    })

    return item
  },
)

export const deleteLocation = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Location> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const existing = await backend.data.locations.findById(id, orgId)
    if (!existing) throw new NotFoundError('Location')
    const item = await backend.data.locations.softDelete(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'location.deleted',
      targetType: 'location',
      targetId: id,
      targetLabel: existing.name,
    })

    return item
  },
)

// ── Languages ─────────────────────────────────────────────────────────────────

export const listLanguages = withAuth(
  Permission.CONTENT_EDIT,
  async (session): Promise<Language[]> => {
    return getBackend().data.languages.list(session.orgContext.organizationId)
  },
)

export const createLanguage = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, input: unknown): Promise<Language> => {
    const parsed = CreateLanguageInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.languages.create({
      organizationId: orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      slug: parsed.data.slug ?? toSlug(parsed.data.name),
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'language.created',
      targetType: 'language',
      targetId: item.id,
      targetLabel: item.name,
    })

    return item
  },
)

export const updateLanguage = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string, input: unknown): Promise<Language> => {
    const parsed = UpdateLanguageInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.languages.update(id, orgId, parsed.data)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'language.updated',
      targetType: 'language',
      targetId: id,
      targetLabel: item.name,
    })

    return item
  },
)

export const toggleLanguage = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Language> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.languages.toggleActive(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'language.toggled',
      targetType: 'language',
      targetId: id,
      targetLabel: item.name,
      metadata: { active: item.active },
    })

    return item
  },
)

export const deleteLanguage = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Language> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const existing = await backend.data.languages.findById(id, orgId)
    if (!existing) throw new NotFoundError('Language')
    const item = await backend.data.languages.softDelete(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'language.deleted',
      targetType: 'language',
      targetId: id,
      targetLabel: existing.name,
    })

    return item
  },
)

// ── Tags ──────────────────────────────────────────────────────────────────────

export const listTags = withAuth(
  Permission.CONTENT_EDIT,
  async (session): Promise<Tag[]> => {
    return getBackend().data.tags.list(session.orgContext.organizationId)
  },
)

export const createTag = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, input: unknown): Promise<Tag> => {
    const parsed = CreateTagInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.tags.create({
      organizationId: orgId,
      name: parsed.data.name,
      slug: parsed.data.slug ?? toSlug(parsed.data.name),
    })

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'tag.created',
      targetType: 'tag',
      targetId: item.id,
      targetLabel: item.name,
    })

    return item
  },
)

export const updateTag = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string, input: unknown): Promise<Tag> => {
    const parsed = UpdateTagInput.safeParse(input)
    if (!parsed.success) throw new ValidationError(parsed.error.message)

    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.tags.update(id, orgId, parsed.data)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'tag.updated',
      targetType: 'tag',
      targetId: id,
      targetLabel: item.name,
    })

    return item
  },
)

export const toggleTag = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Tag> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const item = await backend.data.tags.toggleActive(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'tag.toggled',
      targetType: 'tag',
      targetId: id,
      targetLabel: item.name,
      metadata: { active: item.active },
    })

    return item
  },
)

export const deleteTag = withAuth(
  Permission.ORG_CONFIGURE,
  async (session, id: string): Promise<Tag> => {
    const backend = getBackend()
    const orgId = session.orgContext.organizationId
    const existing = await backend.data.tags.findById(id, orgId)
    if (!existing) throw new NotFoundError('Tag')
    const item = await backend.data.tags.softDelete(id, orgId)

    await backend.data.auditLog.append({
      organizationId: orgId,
      actorId: session.user.id,
      actorName: session.user.name,
      action: 'tag.deleted',
      targetType: 'tag',
      targetId: id,
      targetLabel: existing.name,
    })

    return item
  },
)
