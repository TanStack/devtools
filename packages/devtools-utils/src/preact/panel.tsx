/** @jsxImportSource preact */

import { useEffect, useRef } from 'preact/hooks'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export interface DevtoolsPanelProps extends TanStackDevtoolsPluginProps {

}

/**
 * Creates a Preact component that dynamically imports and mounts a devtools panel. SSR friendly.
 * @param devtoolsPackageName The name of the devtools package to be imported, e.g., '@tanstack/devtools-preact'
 * @param importName The name of the export to be imported from the devtools package (e.g., 'default' or 'DevtoolsCore')
 * @returns A Preact component that mounts the devtools
 * @example
 * ```tsx
 * // if the export is default
 * const [PreactDevtoolsPanel, NoOpPreactDevtoolsPanel] = createPreactPanel('@tanstack/devtools-preact')
 * ```
 *
 * @example
 * ```tsx
 * // if the export is named differently
 * const [PreactDevtoolsPanel, NoOpPreactDevtoolsPanel] = createPreactPanel('@tanstack/devtools-preact', 'DevtoolsCore')
 * ```
 */
export function createPreactPanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, props: TanStackDevtoolsPluginProps) => void
    unmount: () => void
  },
>(CoreClass: new () => TCoreDevtoolsClass) {
  function Panel(props: TComponentProps) {
    const devToolRef = useRef<HTMLDivElement>(null)
    const devtools = useRef<TCoreDevtoolsClass | null>(null)
    useEffect(() => {
      if (devtools.current) return
      devtools.current = new CoreClass()

      if (devToolRef.current) {
        devtools.current.mount(devToolRef.current, props)
      }

      return () => {
        if (devToolRef.current) {
          devtools.current?.unmount()
          devtools.current = null
        }
      }
    }, [props])

    return <div style={{ height: '100%' }} ref={devToolRef} />
  }

  function NoOpPanel(_props: TComponentProps) {
    return <></>
  }
  return [Panel, NoOpPanel] as const
}
