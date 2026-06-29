import { describe, it, expect, beforeEach } from 'vitest'
import { MockContentRepository } from '@/lib/mock/mock-repositories'
import { SEEDED_CONTENT, PURALOCAL_ORG_ID } from '@/lib/mock/seed'
import { ContentStatus, ContentType, ContentSource } from '@/types/domain'
import { MissingOrgContextError } from '@/lib/errors'

const FOREIGN_ORG = 'org_foreign_888'

let repo: MockContentRepository

beforeEach(() => {
  repo = new MockContentRepository(structuredClone(SEEDED_CONTENT))
})

// ── Cross-org isolation ───────────────────────────────────────────────────────

describe('ContentRepository — cross-org isolation', () => {
  it('list() with foreign orgId returns empty array (no data leakage)', async () => {
    const results = await repo.list(FOREIGN_ORG)
    expect(results).toHaveLength(0)
  })

  it('list() with correct orgId returns seeded content', async () => {
    const results = await repo.list(PURALOCAL_ORG_ID)
    expect(results.length).toBeGreaterThan(0)
  })

  it('findById() with foreign orgId returns null for a known content id', async () => {
    const items = await repo.list(PURALOCAL_ORG_ID)
    const first = items[0]!
    const result = await repo.findById(first.id, FOREIGN_ORG)
    expect(result).toBeNull()
  })

  it('findById() with correct orgId returns the content', async () => {
    const items = await repo.list(PURALOCAL_ORG_ID)
    const first = items[0]!
    const result = await repo.findById(first.id, PURALOCAL_ORG_ID)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(first.id)
  })

  it('update() with foreign orgId throws (wrong-org guard)', async () => {
    const items = await repo.list(PURALOCAL_ORG_ID)
    const first = items[0]!
    await expect(
      repo.update(first.id, FOREIGN_ORG, { title: 'Hacked title' }),
    ).rejects.toThrow()
  })

  it('updateStatus() with foreign orgId throws', async () => {
    const items = await repo.list(PURALOCAL_ORG_ID)
    const first = items[0]!
    await expect(
      repo.updateStatus(first.id, FOREIGN_ORG, ContentStatus.PUBLISHED),
    ).rejects.toThrow()
  })

  it('softDelete() with foreign orgId throws', async () => {
    const items = await repo.list(PURALOCAL_ORG_ID)
    const first = items[0]!
    await expect(
      repo.softDelete(first.id, FOREIGN_ORG),
    ).rejects.toThrow()
  })

  it('list() throws MissingOrgContextError on empty string', async () => {
    await expect(repo.list('')).rejects.toThrow(MissingOrgContextError)
  })

  it('findById() throws MissingOrgContextError on empty string', async () => {
    await expect(repo.findById('content_001', '')).rejects.toThrow(MissingOrgContextError)
  })
})

// ── Create with correct orgId ─────────────────────────────────────────────────

describe('ContentRepository — create is org-scoped', () => {
  it('content created under org A is invisible to org B', async () => {
    const created = await repo.create({
      organizationId: PURALOCAL_ORG_ID,
      type: ContentType.IMAGE,
      status: ContentStatus.DRAFT,
      source: ContentSource.CMS,
      title: 'Org A exclusive story',
      slug: 'org-a-exclusive-story',
    })

    const visibleToA = await repo.list(PURALOCAL_ORG_ID)
    const visibleToB = await repo.list(FOREIGN_ORG)

    expect(visibleToA.some(c => c.id === created.id)).toBe(true)
    expect(visibleToB.some(c => c.id === created.id)).toBe(false)
  })
})
