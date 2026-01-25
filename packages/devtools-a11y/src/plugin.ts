import { a11yEventClient } from './event-client'
import { A11yDevtoolsCore } from './core/A11yDevtoolsCore'
import { getA11yRuntime } from './runtime'
import type { A11yAuditResult, A11yPluginOptions } from './types'

/**
 * Plugin interface compatible with TanStack Devtools
 */
export interface A11yDevtoolsPlugin {
  id: string
  name: string
  render: (el: HTMLDivElement, theme: 'light' | 'dark') => void
  destroy?: () => void

  // Optional programmatic API (non-React)
  scan?: () => Promise<A11yAuditResult>
  onScan?: (cb: (result: A11yAuditResult) => void) => () => void
}

/**
 * Create the A11y devtools plugin.
 *
 * This mounts the Solid-based panel UI and exposes a small programmatic API.
 */
export function createA11yPlugin(
  opts: A11yPluginOptions = {},
): A11yDevtoolsPlugin {
  const runtime = getA11yRuntime(opts)
  const core = new A11yDevtoolsCore(opts)

  return {
    id: 'devtools-a11y',
    name: 'Accessibility',
    render: (el, theme) => {
      // The devtools may call render whenever the global theme changes.
      // Our core.mount currently only supports a first-time mount and throws
      // if called when already mounted. Handle that by unmounting and
      // re-mounting with the new theme so the panel updates correctly.
      void core.mount(el, theme).catch(async (err) => {
        // If it's already mounted, unmount and try mounting again with
        // the updated theme. Otherwise, log the error.
        try {
          if (err instanceof Error && /already mounted/.test(err.message)) {
            try {
              core.unmount()
            } catch (e) {
              // If unmounting fails for some reason, still attempt a fresh
              // mount after a short tick to avoid leaving the UI in a bad state.
              await Promise.resolve()
            }

            await core.mount(el, theme)
            return
          }
        } catch (e) {
          // fall through to logging below
        }

        console.error('[A11y Plugin] Failed to mount panel:', err)
      })
    },
    destroy: () => {
      core.unmount()
      runtime.destroy()
    },
    scan: () => runtime.scan(),
    onScan: (cb) => {
      return a11yEventClient.on('results', (event) => cb(event.payload))
    },
  }
}
