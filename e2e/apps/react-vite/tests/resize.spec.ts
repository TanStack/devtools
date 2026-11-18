import { test, expect } from '@playwright/test'
import { DevtoolsPage, SELECTORS } from '@tanstack/devtools-e2e'

test('dragging the resize handle below the minimum height collapses the panel', async ({
  page,
}) => {
  const dt = new DevtoolsPage(page)
  await dt.goto()
  await dt.openViaTrigger()

  // The panel is anchored to the bottom of the viewport, so its resize handle
  // always sits a few pixels above the viewport bottom. Playwright's
  // `mouse.move` clamps to the viewport, so a real downward drag can never
  // travel far enough to push the (~400px) panel below the 70px collapse
  // threshold. We instead dispatch the exact mouse event sequence the resize
  // handler listens for (mousedown on the handle, then document-level
  // mousemove/mouseup) with an explicit downward `pageY`. This drives the real
  // `handleDragStart` collapse logic without being defeated by viewport
  // clamping.
  await page.evaluate(
    ([handleSel, panelSel]) => {
      const handle = document.querySelector(handleSel) as HTMLElement
      const box = handle.getBoundingClientRect()
      const startX = box.x + box.width / 2
      const startY = box.y + box.height / 2
      const fire = (type: string, target: EventTarget, y: number) => {
        target.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: startX,
            clientY: y,
          }),
        )
      }
      fire('mousedown', handle, startY)
      // Drag downward well past the panel's height to fall below the 70px minimum.
      for (let i = 1; i <= 10; i++) {
        fire('mousemove', document, startY + (500 * i) / 10)
      }
      fire('mouseup', document, startY + 500)
    },
    [SELECTORS.resizeHandle, SELECTORS.mainPanel].map(
      (id) => `[data-testid="${id}"]`,
    ) as [string, string],
  )

  await expect(dt.panel()).toHaveAttribute('data-open', 'false')
})
