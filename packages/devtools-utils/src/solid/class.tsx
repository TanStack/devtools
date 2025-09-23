/** @jsxImportSource solid-js - we use Solid.js as JSX here */

/**
 * Constructs the core class for the Devtools.
 * This utility is used to construct a lazy loaded Solid component for the Devtools.
 * It returns a tuple containing the main DevtoolsCore class and a NoOpDevtoolsCore class.
 * The NoOpDevtoolsCore class is a no-op implementation that can be used for production if you want to explicitly exclude
 * the Devtools from your application.
 * @param importPath The path to the Solid component to be lazily imported
 * @returns Tuple containing the DevtoolsCore class and a NoOpDevtoolsCore class
 */
export function constructCoreClass(importPath: string) {
  class DevtoolsCore {
    #isMounted = false
    #dispose?: () => void
    #Component: any
    #ThemeProvider: any

    constructor() {}

    async mount<T extends HTMLElement>(el: T, theme: 'light' | 'dark') {
      const { lazy } = await import('solid-js')
      const { render, Portal } = await import('solid-js/web')
      if (this.#isMounted) {
        throw new Error('Devtools is already mounted')
      }
      const mountTo = el
      const dispose = render(() => {
        this.#Component = lazy(() => import(/** @vite-ignore */ importPath))
        const Devtools = this.#Component
        this.#ThemeProvider = lazy(() =>
          import('@tanstack/devtools-ui').then((mod) => ({
            default: mod.ThemeContextProvider,
          })),
        )
        const ThemeProvider = this.#ThemeProvider

        return (
          <Portal mount={mountTo}>
            <div style={{ height: '100%' }}>
              <ThemeProvider theme={theme}>
                <Devtools />
              </ThemeProvider>
            </div>
          </Portal>
        )
      }, mountTo)
      this.#isMounted = true
      this.#dispose = dispose
    }

    unmount() {
      if (!this.#isMounted) {
        throw new Error('Devtools is not mounted')
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
