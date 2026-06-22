import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test('devtools mount and demo plugin renders in the panel', async ({
  page,
}) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()
  await expect(page.getByTestId('demo-plugin')).toBeVisible()
})
