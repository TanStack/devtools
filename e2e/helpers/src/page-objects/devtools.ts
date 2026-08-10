import { DRAG_HOLD_MS, SELECTORS } from '../selectors'
import type { TabId } from '../selectors'
import type { Page, Locator } from '@playwright/test'

export class DevtoolsPage {
  constructor(private readonly page: Page) {}

  async goto(path = '/') {
    await this.page.goto(path)
  }

  trigger(): Locator {
    return this.page.getByRole('button', { name: SELECTORS.triggerName })
  }

  panel(): Locator {
    return this.page.getByTestId(SELECTORS.mainPanel)
  }

  async openViaTrigger() {
    await this.trigger().click()
    await this.expectOpen()
  }

  async closeViaButton() {
    await this.page.getByTestId(SELECTORS.closeButton).click()
  }

  tab(id: TabId): Locator {
    return this.page.getByTestId(SELECTORS.tab(id))
  }

  async isOpen(): Promise<boolean> {
    return (await this.panel().getAttribute('data-open')) === 'true'
  }

  async expectOpen() {
    await this.panel().and(this.page.locator('[data-open="true"]')).waitFor()
  }

  async expectClosed() {
    await this.panel().and(this.page.locator('[data-open="false"]')).waitFor()
  }

  // --- plugin workspace ---

  workspace(): Locator {
    return this.page.getByTestId(SELECTORS.workspace)
  }

  /** Every plugin entry in the Plugins strip, which opens and closes panes. */
  stripEntry(name: string): Locator {
    return this.page
      .locator('[data-workbench-secondary-tab]')
      .filter({ hasText: name })
  }

  pane(pluginId: string): Locator {
    return this.page.getByTestId(SELECTORS.pluginPane(pluginId))
  }

  pluginTab(pluginId: string): Locator {
    return this.page.getByTestId(SELECTORS.pluginTab(pluginId))
  }

  splitters(): Locator {
    return this.page.getByTestId(SELECTORS.splitter)
  }

  groupTabBars(): Locator {
    return this.page.locator('[data-tsd-group-tabs]')
  }

  status(): Locator {
    return this.page.getByTestId(SELECTORS.workspaceStatus)
  }

  /** The persisted layout tree, which is the only record of what is open. */
  async storedLayout(): Promise<unknown> {
    return this.page.evaluate(() => {
      const raw = localStorage.getItem('tanstack_devtools_state')
      return raw === null ? null : JSON.parse(raw).layout
    })
  }

  /**
   * Move a pane with the keyboard, which is the path that also works while
   * detached into a picture-in-picture window.
   */
  async movePaneWithKeyboard(pluginId: string, direction: string) {
    await this.pluginTab(pluginId).focus()
    await this.page.keyboard.press('Enter')
    await this.page.keyboard.press(direction)
    await this.page.keyboard.press('Enter')
  }

  /** Drag a pane's tab onto a zone of another pane: 'left' | 'right' | 'top' | 'bottom' | 'center'. */
  async dragTabToZone(pluginId: string, targetPluginId: string, zone: string) {
    const tab = this.pluginTab(pluginId)
    const target = this.pane(targetPluginId)
    const from = await tab.boundingBox()
    const to = await target.boundingBox()
    if (from === null || to === null) {
      throw new Error(`missing box for ${pluginId} -> ${targetPluginId}`)
    }
    const point = {
      left: { x: to.x + to.width * 0.1, y: to.y + to.height / 2 },
      right: { x: to.x + to.width * 0.9, y: to.y + to.height / 2 },
      top: { x: to.x + to.width / 2, y: to.y + to.height * 0.1 },
      bottom: { x: to.x + to.width / 2, y: to.y + to.height * 0.9 },
      center: { x: to.x + to.width / 2, y: to.y + to.height / 2 },
    }[zone]
    if (point === undefined) throw new Error(`unknown zone ${zone}`)

    await this.page.mouse.move(
      from.x + from.width / 2,
      from.y + from.height / 2,
    )
    await this.page.mouse.down()
    // Wait for the drag to have actually begun, not a fixed duration — see
    // `pressAndHold`.
    await this.page
      .getByTestId(SELECTORS.dragPreview)
      .waitFor({ state: 'visible', timeout: DRAG_HOLD_MS * 8 })
    // Several steps: the drop zone is resolved from pointer position on move, so
    // a single jump can land without the zone ever being computed.
    await this.page.mouse.move(point.x, point.y, { steps: 12 })
    await this.page.mouse.up()
  }

  /**
   * Press and hold until the drag has actually begun.
   *
   * Waits for the drag preview rather than a fixed duration: the hold is a
   * `setTimeout` in the page, which fires late when the main thread is busy, so a
   * fixed wait sometimes released the button before the drag started. The preview
   * appearing is the only reliable signal that it did.
   */
  async pressAndHold(locator: Locator) {
    const box = await locator.boundingBox()
    if (box === null) throw new Error('cannot hold an element with no box')
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await this.page.mouse.down()
    await this.page
      .getByTestId(SELECTORS.dragPreview)
      .waitFor({ state: 'visible', timeout: DRAG_HOLD_MS * 8 })
  }
}
