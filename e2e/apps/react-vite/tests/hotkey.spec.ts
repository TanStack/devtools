import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

// The default open hotkey is 'Control+~'. On a US keyboard `~` is Shift+`,
// and TanStack Hotkeys matches the Shift that typing `~` needs.
async function pressOpenHotkey(page: import('@playwright/test').Page) {
  await page.keyboard.press('Control+Shift+Backquote')
}

test.describe('open hotkey', () => {
  test('Control+~ toggles the panel open', async ({ page }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto()
    await expect(dt.panel()).toHaveAttribute('data-open', 'false')
    await pressOpenHotkey(page)
    await expect(dt.panel()).toHaveAttribute('data-open', 'true')
  })

  test('Control+~ does not open panel when a text input is focused', async ({
    page,
  }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto()
    await page.getByTestId('text-input').focus()
    await pressOpenHotkey(page)
    await expect(dt.panel()).toHaveAttribute('data-open', 'false')
  })
})
