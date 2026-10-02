import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'
import type { Page } from '@playwright/test'

// See hotkey.spec.ts: dispatch the exact keydown events of Control+~.
async function pressOpenHotkey(page: Page) {
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

/** Whether a click at the center of the close button reaches it. */
async function closeButtonTakesClicks(page: Page) {
  const box = await page.getByTestId(SELECTORS.closeButton).boundingBox()
  return page.evaluate(
    ([x, y]) =>
      document
        .elementFromPoint(x!, y!)
        ?.closest('[data-testid="tsd-close-button"]') != null,
    [box!.x + box!.width / 2, box!.y + box!.height / 2],
  )
}

test.describe('openAsModal', () => {
  test('the open panel takes input on top of a modal app dialog', async ({
    page,
  }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/?open-as-modal')
    await expect(dt.trigger()).toBeVisible()
    await page.getByTestId('open-app-dialog').click()
    await expect(page.getByTestId('app-dialog')).toBeVisible()

    await pressOpenHotkey(page)
    await dt.expectOpen()
    await expect(
      page.locator('dialog:modal > [data-testid="tanstack_devtools"]'),
    ).toHaveCount(1)
    expect(await closeButtonTakesClicks(page)).toBe(true)

    await dt.closeViaButton()
    await expect(dt.panel()).toHaveAttribute('data-open', 'false')
    await expect(
      page.locator('dialog [data-testid="tanstack_devtools"]'),
    ).toHaveCount(0)
    // The app dialog takes input again.
    await page.getByTestId('app-dialog-button').click()
    await expect(page.getByTestId('app-dialog-button')).toBeFocused()
  })

  test('Escape closes the panel and keeps the app dialog open', async ({
    page,
  }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/?open-as-modal')
    await expect(dt.trigger()).toBeVisible()
    await page.getByTestId('open-app-dialog').click()
    await pressOpenHotkey(page)
    await dt.expectOpen()

    await page.keyboard.press('Escape')
    await expect(dt.panel()).toHaveAttribute('data-open', 'false')
    await expect(page.getByTestId('app-dialog')).toBeVisible()
    await expect(
      page.locator('dialog [data-testid="tanstack_devtools"]'),
    ).toHaveCount(0)
  })

  test('without the option, a modal app dialog blocks the panel', async ({
    page,
  }) => {
    const dt = new DevtoolsPage(page)
    await dt.goto('/')
    await expect(dt.trigger()).toBeVisible()
    await page.getByTestId('open-app-dialog').click()

    await pressOpenHotkey(page)
    await dt.expectOpen()
    expect(await closeButtonTakesClicks(page)).toBe(false)
  })
})
