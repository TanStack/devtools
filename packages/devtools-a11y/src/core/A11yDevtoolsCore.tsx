/** @jsxImportSource solid-js */

import { A11yDevtoolsPanel } from '../ui/A11yDevtoolsPanel'
import type { A11yPluginOptions } from '../types'

export class A11yDevtoolsCore {
  #dispose: (() => void) | null = null
  #isMounted = false
  #isMounting = false
  #mountCb: (() => void) | null = null
  #options: A11yPluginOptions

  constructor(options: A11yPluginOptions = {}) {
    this.#options = options
  }

  async mount(el: HTMLElement, theme: 'light' | 'dark' | 'system' = 'light') {
    this.#isMounting = true
    const { render } = await import('solid-js/web')

    if (this.#isMounted) {
      throw new Error('A11yDevtoolsCore is already mounted')
    }

    const resolvedTheme: 'light' | 'dark' =
      theme === 'system'
        ? typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    this.#dispose = render(
      () => <A11yDevtoolsPanel theme={resolvedTheme} options={this.#options} />,
      el,
    )
    this.#isMounted = true
    this.#isMounting = false

    if (this.#mountCb) {
      this.#mountCb()
      this.#mountCb = null
    }
  }

  unmount() {
    if (!this.#isMounted && !this.#isMounting) {
      throw new Error('A11yDevtoolsCore is not mounted')
    }

    if (this.#isMounting) {
      this.#mountCb = () => {
        this.#dispose?.()
        this.#isMounted = false
        this.#dispose = null
      }
      return
    }

    this.#dispose?.()
    this.#dispose = null
    this.#isMounted = false
  }
}
