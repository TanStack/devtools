import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test('html element has data-tanstack-devtools-theme set to dark', async ({
  page,
}) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await expect(page.locator('html')).toHaveAttribute(
    'data-tanstack-devtools-theme',
    'dark',
  )
})
