import { test, expect } from '@playwright/test'
import { DevtoolsPage } from '@tanstack/devtools-e2e'

// The shell's open hotkey is ["Control", "~"] and it is matched against
// `KeyboardEvent.key` via @solid-primitives/keyboard. Playwright's
// `keyboard.press('~')` would require Shift (which adds an extra key and breaks
// the match), so we dispatch the exact keydown events the shell listens for:
// Control first (so the modifier becomes the first held key), then "~" with
// ctrlKey set. This mirrors a real Ctrl+~ press without the Shift artifact.
async function pressOpenHotkey(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }),
    )
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '~', ctrlKey: true }),
    )
    window.dispatchEvent(new KeyboardEvent('keyup', { key: '~' }))
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control' }))
  })
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
