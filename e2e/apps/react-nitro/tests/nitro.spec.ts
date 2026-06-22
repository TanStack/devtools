import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'

test('nitro devtools mount under SSR and demo plugin renders', async ({
  page,
}) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()
  await expect(page.getByTestId('demo-plugin')).toBeVisible()
})

// Server->client delivery: a GET to /emit-server-ping runs a TanStack Start server
// route handler inside Nitro's isolated Vite SSR module-runner. PR #384's runtime
// bridge (packages/devtools-vite/src/runtime-bridge.ts) gives that isolated runtime a
// real `globalThis.__TANSTACK_EVENT_TARGET__` and bridges it to the Vite dev process
// over the framework plugin's HMR HotChannel, so the server-side EventClient.emit()
// reaches the ServerEventBus and is broadcast to all connected browser clients. A
// visible server row therefore proves the server->client path works end-to-end.
test('nitro server-emitted event reaches the client devtools via the runtime bridge', async ({
  page,
}) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()

  // Hover the plugins tab to expand the plugin sidebar so the names are visible.
  await dt.tab('plugins').hover()

  // Activate the Event Probe plugin so its panel (and its server-ping listener) mounts.
  await page.getByText('Event Probe', { exact: true }).click()

  // Give the client bus a moment to open its WebSocket to the ServerEventBus so the
  // broadcast has a live subscriber when the server emit lands.
  await page.waitForTimeout(2000)

  // Trigger the server route handler, which emits 'server-ping' from the isolated
  // server runtime.
  await page.request.get('/emit-server-ping')

  // The bridged event arrives over the bus; the panel's `on('server-ping')` renders
  // the server row.
  await expect(page.getByTestId(SELECTORS.probeServerRow)).toBeVisible({
    timeout: 15000,
  })
})
