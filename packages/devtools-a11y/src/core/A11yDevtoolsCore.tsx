/** @jsxImportSource solid-js */

import { createSignal } from 'solid-js'
import { A11yDevtoolsPanel } from '../ui/A11yDevtoolsPanel'
import type {Accessor} from 'solid-js';
import type { A11yPluginOptions } from '../types'

function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return theme
}

/**
 * Wrapper component that properly tracks the theme signal and passes it to the panel.
 * This ensures Solid's reactivity works correctly when the theme changes.
 */
function A11yDevtoolsPanelWrapper(props: {
  theme: Accessor<'light' | 'dark'>
  options: A11yPluginOptions
}) {
  // Calling props.theme() inside the JSX makes it reactive
  return <A11yDevtoolsPanel theme={props.theme()} options={props.options} />
}

export class A11yDevtoolsCore {
  #dispose: (() => void) | null = null
  #isMounted = false
  #isMounting = false
  #mountCb: (() => void) | null = null
  #options: A11yPluginOptions
  #setTheme: ((theme: 'light' | 'dark') => void) | null = null

  constructor(options: A11yPluginOptions = {}) {
    this.#options = options
  }

  async mount(el: HTMLElement, theme: 'light' | 'dark' | 'system' = 'light') {
    this.#isMounting = true
    const { render } = await import('solid-js/web')

    if (this.#isMounted) {
      throw new Error('A11yDevtoolsCore is already mounted')
    }

    const [getTheme, setTheme] = createSignal<'light' | 'dark'>(
      resolveTheme(theme),
    )
    this.#setTheme = setTheme

    this.#dispose = render(
      () => (
        <A11yDevtoolsPanelWrapper theme={getTheme} options={this.#options} />
      ),
      el,
    )
    this.#isMounted = true
    this.#isMounting = false

    if (this.#mountCb) {
      this.#mountCb()
      this.#mountCb = null
    }
  }

  setTheme(theme: 'light' | 'dark' | 'system') {
    if (this.#setTheme) {
      this.#setTheme(resolveTheme(theme))
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
