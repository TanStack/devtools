import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

// NOTE: `@tanstack/angular-devtools` build currently fails on Windows (its build
// script uses `rm -rf`), so this app is verified in CI (Linux), not necessarily
// locally on Windows.
test('angular devtools renders the demo plugin panel', async ({ page }) => {
  const dt = new DevtoolsPage(page)
  await dt.goto('/')
  await dt.openViaTrigger()
  // The @defer block + dynamic import render the standalone panel component
  // asynchronously, so allow a generous timeout for it to appear.
  await expect(page.getByTestId('demo-plugin')).toBeVisible({ timeout: 30_000 })
})
