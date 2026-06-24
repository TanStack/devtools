import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'

test.describe('requireUrlFlag gating', () => {
  test('no flag → devtools not rendered', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/?gated')
    await expect(page.getByTestId(SELECTORS.mainPanel)).toHaveCount(0)
  })

  test('flag present → trigger visible', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/?gated&tanstack-devtools')
    await expect(dt.trigger()).toBeVisible()
  })
})
