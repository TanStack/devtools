import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'

// The devtools shell only renders the *active* plugin's content. The Event Probe
// is the 2nd registered plugin and is not active by default, so we must activate
// it (by clicking its entry in the plugins sidebar) before its emit button and
// event rows are mounted. The plugin sidebar is collapsed (names clipped
// off-screen) until the plugins draw is hovered, so we hover the plugins tab to
// expand it first, then click the plugin's row.

test('event probe emits events and displays rows', async ({ page }) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()

  // Hover the plugins tab to expand the plugin sidebar so the names are visible.
  await dt.tab('plugins').hover()

  // Activate the Event Probe plugin so its panel mounts.
  await page.getByText('Event Probe', { exact: true }).click()

  const emitButton = page.getByTestId(SELECTORS.probeEmitButton)
  await emitButton.click()
  await emitButton.click()

  const rows = page.getByTestId(SELECTORS.probeEventRow)
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toHaveText('ping 1')
})
