import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test('panel open state persists across page reload', async ({ page }) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()
  await expect(dt.panel()).toHaveAttribute('data-open', 'true')

  await page.reload()
  await expect(dt.panel()).toHaveAttribute('data-open', 'true')

  const stored = await page.evaluate(() =>
    localStorage.getItem('tanstack_devtools_state'),
  )
  expect(stored).toContain('persistOpen')
})
