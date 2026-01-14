import { useEffect, useRef } from 'react'
import type { TanStackDevtoolsPluginProps } from "@tanstack/devtools"

export interface DevtoolsPanelProps extends TanStackDevtoolsPluginProps {
}

/**
 * Creates a React component that dynamically imports and mounts a devtools panel. SSR friendly.
 * @param devtoolsPackageName The name of the devtools package to be imported, e.g., '@tanstack/devtools-react'
 * @param importName The name of the export to be imported from the devtools package (e.g., 'default' or 'DevtoolsCore')
 * @returns A React component that mounts the devtools
 * @example
 * ```tsx
 * // if the export is default
 * const [ReactDevtoolsPanel, NoOpReactDevtoolsPanel] = createReactPanel('@tanstack/devtools-react')
 * ```
 *
 * @example
 * ```tsx
 * // if the export is named differently
 * const [ReactDevtoolsPanel, NoOpReactDevtoolsPanel] = createReactPanel('@tanstack/devtools-react', 'DevtoolsCore')
 * ```
 */
export function createReactPanel<
  TComponentProps extends TanStackDevtoolsPluginProps,
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
