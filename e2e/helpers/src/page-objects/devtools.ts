import { SELECTORS } from '../selectors'
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
}
