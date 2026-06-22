import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'

test('plugins tab is active by default and demo-plugin is visible', async ({
  page,
}) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()
  await expect(page.getByTestId('demo-plugin')).toBeVisible()
})

test('settings tab becomes active when clicked', async ({ page }) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()
  await dt.tab('settings').click()
  await expect(dt.tab('settings')).toHaveClass(/active/)
})

test('plugins tab becomes active when clicked', async ({ page }) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()
  await dt.tab('settings').click()
  await dt.tab('plugins').click()
  await expect(dt.tab('plugins')).toHaveClass(/active/)
})
