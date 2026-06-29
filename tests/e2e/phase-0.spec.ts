import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

// All tests share module-level mock session state, so they must run one at a time.
test.describe.configure({ mode: 'serial' })

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resetMock(request: APIRequestContext) {
  const res = await request.post('/api/e2e/reset')
  expect(res.ok(), 'mock reset endpoint should return 200').toBeTruthy()
}

async function signIn(page: Page, email: string, password = 'password') {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  // router.push('/dashboard') fires on success; waitForURL confirms the navigation.
  await page.waitForURL('/dashboard', { timeout: 15_000 })
}

// ── Phase 0 DoD scenarios ─────────────────────────────────────────────────────

test.describe('Phase 0 DoD', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request)
  })

  // ── Scenario 1: Org Admin full flow ──────────────────────────────────────

  test('Org Admin: invite user → assign role → both entries visible in Audit Log', async ({ page }) => {
    await signIn(page, 'admin@puralocal.com')

    // ── 1a. Navigate to Users & Roles ────────────────────────────────────
    await page.goto('/dashboard/settings/users-roles')
    await expect(page.getByRole('heading', { name: 'Users & Roles' })).toBeVisible()

    // ── 1b. Invite a new user ────────────────────────────────────────────
    await page.getByRole('button', { name: 'Invite user' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })

    await page.fill('#invite-name', 'E2E Test User')
    await page.fill('#invite-email', 'e2e@puralocal.com')
    await page.selectOption('#invite-role', 'EDITOR')
    await page.getByRole('button', { name: 'Send invite' }).click()

    // Toast confirms success; dialog closes
    await expect(page.getByText('E2E Test User invited successfully')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })

    // ── 1c. Assign a new role to the Reporter ────────────────────────────
    const reporterRow = page.locator('tr').filter({ hasText: 'reporter@puralocal.com' })
    await expect(reporterRow).toBeVisible({ timeout: 8_000 })
    await reporterRow.getByRole('button', { name: 'Actions' }).click()

    await page.getByRole('menuitem', { name: 'Change role' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 })

    await page.selectOption('#assign-role', 'EDITOR')
    await page.getByRole('button', { name: 'Save role' }).click()

    await expect(page.getByText('Role updated to EDITOR')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })

    // ── 1d. Audit Log has both entries attributed to Org Admin ───────────
    await page.goto('/dashboard/audit-log')
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()

    const inviteRow = page.locator('tr').filter({ hasText: 'User invited' })
    await expect(inviteRow).toBeVisible({ timeout: 10_000 })
    await expect(inviteRow.getByText('e2e@puralocal.com')).toBeVisible()
    await expect(inviteRow.getByText('Org Admin')).toBeVisible()

    const assignRow = page.locator('tr').filter({ hasText: 'Role assigned' })
    await expect(assignRow).toBeVisible()
    await expect(assignRow.getByText('EDITOR')).toBeVisible()
    await expect(assignRow.getByText('Org Admin')).toBeVisible()
  })

  // ── Scenario 2: REPORTER nav is gated ────────────────────────────────────

  test('REPORTER: sidebar shows only Dashboard and Content', async ({ page }) => {
    await signIn(page, 'reporter@puralocal.com')

    const navLinks = await page.locator('aside nav a').allTextContents()
    const labels = navLinks.map(t => t.trim()).filter(Boolean)

    // Permitted items
    expect(labels).toContain('Dashboard')
    expect(labels).toContain('Content')

    // Gated items — must be absent from the sidebar entirely
    expect(labels).not.toContain('Reporters')
    expect(labels).not.toContain('Users')
    expect(labels).not.toContain('Ads')
    expect(labels).not.toContain('Notifications')
    expect(labels).not.toContain('Analytics')
    expect(labels).not.toContain('Audit Log')
    expect(labels).not.toContain('Users & Roles')
  })

  // ── Scenario 3: ANALYTICS_VIEWER nav is gated ────────────────────────────

  test('ANALYTICS_VIEWER: sidebar shows only Dashboard and Analytics', async ({ page }) => {
    await signIn(page, 'analytics@puralocal.com')

    const navLinks = await page.locator('aside nav a').allTextContents()
    const labels = navLinks.map(t => t.trim()).filter(Boolean)

    // Permitted items
    expect(labels).toContain('Dashboard')
    expect(labels).toContain('Analytics')

    // Gated items — must be absent from the sidebar entirely
    expect(labels).not.toContain('Content')
    expect(labels).not.toContain('Reporters')
    expect(labels).not.toContain('Users')
    expect(labels).not.toContain('Ads')
    expect(labels).not.toContain('Notifications')
    expect(labels).not.toContain('Audit Log')
    expect(labels).not.toContain('Users & Roles')
  })
})
