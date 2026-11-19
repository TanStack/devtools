import { expect, test } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

test.describe('Solid 2 app', () => {
  test('the plugin mounts, stays reactive and keeps input focus', async ({
    page,
  }) => {
    const errors: Array<string> = []
    page.on('pageerror', (error) => errors.push(error.message))

    const dt = new DevtoolsPage(page)
    await dt.goto()
    await dt.openViaTrigger()

    const button = page.getByTestId('demo-plugin')
    await expect(button).toHaveText('clicks: 0')
    await button.click()
    await expect(button).toHaveText('clicks: 1')

    const input = page.getByTestId('demo-input')
    await input.focus()
    await page.keyboard.type('abc')
    // Each key press changes the text next to the input. The input must not
    // be detached for that, or it loses focus after the first key.
    await expect(input).toHaveValue('abc')
    await expect(input).toBeFocused()
    expect(errors).toEqual([])
  })

  test('onSettled runs with the plugin in the page', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto()
    await dt.openViaTrigger()
    await expect(page.getByTestId('demo-input')).toBeVisible()
    expect(await page.evaluate(() => window.demoPluginConnectedOnMount)).toBe(
      true,
    )
  })

  test('closing the pane disposes the plugin', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto()
    await dt.openViaTrigger()
    await expect(page.getByTestId('demo-input')).toBeVisible()

    await page.getByTestId('plugin-tab-close-demo').click()
    await expect
      .poll(() => page.evaluate(() => window.demoPluginCleanedUp))
      .toBe(true)
  })
})
