import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test.describe('panel open/close', () => {
  test('opens via trigger and closes via close button', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto()
    await dt.openViaTrigger()
    await expect(dt.panel()).toHaveAttribute('data-open', 'true')
    await dt.closeViaButton()
    await expect(dt.panel()).toHaveAttribute('data-open', 'false')
  })

  test('Escape closes an open panel', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto()
    await dt.openViaTrigger()
    await page.keyboard.press('Escape')
    await expect(dt.panel()).toHaveAttribute('data-open', 'false')
  })
})
