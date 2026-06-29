import { z } from 'zod'
import { ContentType, ContentSource, ContentStatus, LocationLevel } from '@/types/domain'

const contentTypeValues   = Object.values(ContentType)   as [ContentType,   ...ContentType[]]
const contentSourceValues = Object.values(ContentSource) as [ContentSource, ...ContentSource[]]
const contentStatusValues = Object.values(ContentStatus) as [ContentStatus, ...ContentStatus[]]
const locationLevelValues = Object.values(LocationLevel) as [LocationLevel, ...LocationLevel[]]

// slug: lowercase alphanumeric + hyphens
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')

// short code: 2-10 uppercase letters/digits
const codeSchema = z
  .string()
  .min(2, 'Code must be at least 2 characters')
  .max(10, 'Code must be at most 10 characters')
  .regex(/^[A-Z0-9]+$/, 'Code must be uppercase letters and numbers only')

// ── Content ───────────────────────────────────────────────────────────────────

export const CreateContentInput = z.object({
  type:        z.enum(contentTypeValues),
  source:      z.enum(contentSourceValues),
  title:       z.string().min(1, 'Title is required').max(120),
  slug:        slugSchema.optional(),
  status:      z.enum(contentStatusValues).optional(),
  body:        z.string().max(100_000).nullable().optional(),
  excerpt:     z.string().max(600).nullable().optional(),
  mediaUrl:     z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  imageUrls:    z.array(z.string()).max(10).optional(),
  orientation:  z.enum(['PORTRAIT', 'LANDSCAPE']).nullable().optional(),
  youtubeUrl:   z.url({ error: 'Must be a valid YouTube URL' }).nullable().optional(),
  categoryId:  z.string().nullable().optional(),
  locationId:  z.string().nullable().optional(),
  languageId:  z.string().nullable().optional(),
  reporterId:     z.string().nullable().optional(),
  tags:           z.array(z.string().max(50)).max(20).optional(),
  isBreakingNews: z.boolean().optional(),
  isTrending:     z.boolean().optional(),
  isFeatured:     z.boolean().optional(),
  scheduledAt:    z.iso.datetime({ offset: true }).nullable().optional(),
}).refine(
  (d) => d.type !== ContentType.YOUTUBE || !!d.youtubeUrl,
  { message: 'YouTube URL is required for YouTube content', path: ['youtubeUrl'] },
)
export type CreateContentInput = z.infer<typeof CreateContentInput>

export const UpdateContentInput = z.object({
  title:        z.string().min(1).max(120).optional(),
  slug:         slugSchema.optional(),
  body:         z.string().max(100_000).nullable().optional(),
  excerpt:      z.string().max(600).nullable().optional(),
  mediaUrl:     z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  imageUrls:    z.array(z.string()).max(10).optional(),
  orientation:  z.enum(['PORTRAIT', 'LANDSCAPE']).nullable().optional(),
  youtubeUrl:   z.url().nullable().optional(),
  categoryId:  z.string().nullable().optional(),
  locationId:  z.string().nullable().optional(),
  languageId:  z.string().nullable().optional(),
  reporterId:     z.string().nullable().optional(),
  tags:           z.array(z.string().max(50)).max(20).optional(),
  isBreakingNews: z.boolean().optional(),
  isTrending:     z.boolean().optional(),
  isFeatured:     z.boolean().optional(),
  scheduledAt:    z.iso.datetime({ offset: true }).nullable().optional(),
})
export type UpdateContentInput = z.infer<typeof UpdateContentInput>

export const TransitionContentInput = z.object({
  contentId: z.string().min(1),
  toStatus:  z.enum(contentStatusValues),
  note:      z.string().max(1000).nullable().optional(),
})
export type TransitionContentInput = z.infer<typeof TransitionContentInput>

// ── Categories ────────────────────────────────────────────────────────────────

export const CreateCategoryInput = z.object({
  code: codeSchema,
  name: z.string().min(1, 'Name is required').max(100),
  slug: slugSchema.optional(),
})
export type CreateCategoryInput = z.infer<typeof CreateCategoryInput>

export const UpdateCategoryInput = z.object({
  code: codeSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  slug: slugSchema.optional(),
})
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInput>

// ── Locations ─────────────────────────────────────────────────────────────────

export const CreateLocationInput = z.object({
  name:     z.string().min(1, 'Name is required').max(200),
  slug:     slugSchema.optional(),
  level:    z.enum(locationLevelValues),
  parentId: z.string().nullable().optional(),
})
export type CreateLocationInput = z.infer<typeof CreateLocationInput>

export const UpdateLocationInput = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: slugSchema.optional(),
})
export type UpdateLocationInput = z.infer<typeof UpdateLocationInput>

// ── Languages ─────────────────────────────────────────────────────────────────

export const CreateLanguageInput = z.object({
  code: z.string().min(2, 'Code required').max(10).regex(/^[a-z]+$/, 'Lowercase ISO code (e.g. en, te)'),
  name: z.string().min(1, 'Name is required').max(100),
  slug: slugSchema.optional(),
})
export type CreateLanguageInput = z.infer<typeof CreateLanguageInput>

export const UpdateLanguageInput = z.object({
  code: z.string().min(2).max(10).regex(/^[a-z]+$/).optional(),
  name: z.string().min(1).max(100).optional(),
  slug: slugSchema.optional(),
})
export type UpdateLanguageInput = z.infer<typeof UpdateLanguageInput>

// ── Generic (kept for compatibility) ─────────────────────────────────────────

export const CreateRefItemInput = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: slugSchema.optional(),
})
export type CreateRefItemInput = z.infer<typeof CreateRefItemInput>

export const UpdateRefItemInput = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: slugSchema.optional(),
})
export type UpdateRefItemInput = z.infer<typeof UpdateRefItemInput>
