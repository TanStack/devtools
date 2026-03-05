import type { JSX } from 'solid-js'

/**
 * Constructs the core class for the Devtools.
 * This utility is used to construct a lazy loaded Solid component for the Devtools.
 * It returns a tuple containing the main DevtoolsCore class and a NoOpDevtoolsCore class.
 * The NoOpDevtoolsCore class is a no-op implementation that can be used for production if you want to explicitly exclude
 * the Devtools from your application.
 * @param importFn A function that returns a dynamic import of the Solid component
 * @returns Tuple containing the DevtoolsCore class and a NoOpDevtoolsCore class
 */
export function constructCoreClass(
  importFn: () => Promise<{ default: () => JSX.Element }>,
) {
  class DevtoolsCore {
    #isMounted = false
    #isMounting = false
    #abortMount = false
    #dispose?: () => void

    constructor() {}

    async mount<T extends HTMLElement>(el: T, theme: 'light' | 'dark') {
      if (this.#isMounted || this.#isMounting) {
        throw new Error('Devtools is already mounted')
      }
      this.#isMounting = true
      this.#abortMount = false

      try {
        const { __mountComponent } =
          await import('@tanstack/devtools-utils/solid')
        if (this.#abortMount) {
          this.#isMounting = false
          return
        }

        this.#dispose = __mountComponent(el, theme, importFn)
        this.#isMounted = true
        this.#isMounting = false
      } catch (err) {
        this.#isMounting = false
        console.error('[TanStack Devtools] Failed to load:', err)
      }
    }

    unmount() {
      if (!this.#isMounted && !this.#isMounting) {
        throw new Error('Devtools is not mounted')
      }
      if (this.#isMounting) {
        this.#abortMount = true
        this.#isMounting = false
        return
      }
      this.#dispose?.()
      this.#isMounted = false
    }
  }

  class NoOpDevtoolsCore extends DevtoolsCore {
    constructor() {
      super()
    }
    async mount<T extends HTMLElement>(_el: T, _theme: 'light' | 'dark') {}
    unmount() {}
  }

  return [DevtoolsCore, NoOpDevtoolsCore] as const
}

export type ClassType = ReturnType<typeof constructCoreClass>[0]
