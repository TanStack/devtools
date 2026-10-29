import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

// Playwright sets navigator.webdriver to true.
test.describe('hideInAutomation', () => {
  test('set → devtools not rendered', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/?automation-hidden')
    // Devtools set the theme on <html> when they mount, also when hidden, so
    // the check below runs after the mount and not before it.
    await expect(page.locator('html')).toHaveAttribute(
      'data-tanstack-devtools-theme',
      'dark',
    )
    await expect(page.getByTestId('tanstack_devtools')).toHaveCount(0)
    await expect(dt.trigger()).toHaveCount(0)
  })

  test('not set → trigger visible', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/')
    await expect(dt.trigger()).toBeVisible()
  })
})
