import { expect, test } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test('devtools mount in a Solid 1 app and the plugin stays reactive', async ({
  page,
}) => {
  const errors: Array<string> = []
  page.on('pageerror', (error) => errors.push(error.message))

  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()

  const plugin = page.getByTestId('demo-plugin')
  await expect(plugin).toHaveText('clicks: 0')
  await plugin.click()
  await expect(plugin).toHaveText('clicks: 1')
  expect(errors).toEqual([])
})
