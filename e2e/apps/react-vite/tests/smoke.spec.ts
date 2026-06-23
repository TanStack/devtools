import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test('devtools mount and the trigger opens the panel', async ({ page }) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await expect(dt.trigger()).toBeVisible()
  await expect(dt.panel()).toHaveAttribute('data-open', 'false')
  await dt.openViaTrigger()
  await expect(dt.panel()).toHaveAttribute('data-open', 'true')
})
