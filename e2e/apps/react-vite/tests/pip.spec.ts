import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'

/**
 * The devtools shell opens picture-in-picture by calling
 * `window.open('', 'TSDT-Devtools-Panel', ...)` from inside the PiP button's
 * click handler (see packages/devtools/src/context/pip-context.tsx). It then
 * touches the returned window's `.document` (head/body innerHTML, title,
 * body.style.margin), copies stylesheets via `.document.head.appendChild(...)`,
 * registers a `pagehide` listener via `.addEventListener`, and may call
 * `.close()`.
 *
 * Rather than drive a real popup, we stub `window.open` before the app loads so
 * that:
 *   - a flag (`__pipRequested`) records that a PiP window was requested, and
 *   - a minimal fake window is returned that satisfies every property the shell
 *     accesses without throwing.
 *
 * The stable, meaningful assertion is simply that the request was made.
 */
test('clicking the PiP button requests a picture-in-picture window', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalOpen = window.open.bind(window)
    // Keep a reference in case anything wants the real implementation back.
    ;(window as any).__originalOpen = originalOpen

    // A no-op DOM-ish node that swallows whatever the shell does to it.
    const makeFakeNode = () => {
      const node: any = {
        innerHTML: '',
        textContent: '',
        style: {} as Record<string, string>,
        setAttribute: () => {},
        appendChild: (child: unknown) => child,
        removeChild: (child: unknown) => child,
      }
      return node
    }

    const fakeDocument: any = {
      head: makeFakeNode(),
      body: makeFakeNode(),
      title: '',
      styleSheets: [],
      createElement: () => makeFakeNode(),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    }

    const fakeWindow: any = {
      document: fakeDocument,
      addEventListener: () => {},
      removeEventListener: () => {},
      close: () => {},
      focus: () => {},
      location: { href: '' },
    }

    window.open = ((..._args: Array<unknown>) => {
      ;(window as any).__pipRequested = true
      return fakeWindow
    }) as typeof window.open
  })

  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()

  await page.getByTestId(SELECTORS.pipButton).click()

  await expect
    .poll(() => page.evaluate(() => (window as any).__pipRequested))
    .toBe(true)
})
