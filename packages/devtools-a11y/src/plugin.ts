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
  let isMounted = false

  return {
    id: 'devtools-a11y',
    name: 'Accessibility',
    render: (el, theme) => {
      // The devtools calls render whenever the global theme changes.
      // If already mounted, just update the theme reactively instead of
      // unmounting/remounting the entire panel.
      if (isMounted) {
        core.setTheme(theme)
        return
      }

      void core
        .mount(el, theme)
        .then(() => {
          isMounted = true
        })
        .catch((err) => {
          console.error('[A11y Plugin] Failed to mount panel:', err)
        })
    },
    destroy: () => {
      core.unmount()
      isMounted = false
      runtime.destroy()
    },
    scan: () => runtime.scan(),
    onScan: (cb) => {
      return a11yEventClient.on('results', (event) => cb(event.payload))
    },
  }
}
