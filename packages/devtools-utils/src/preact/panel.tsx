/** @jsxImportSource preact */

import { useEffect, useRef } from 'preact/hooks'

export interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
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
  TComponentProps extends DevtoolsPanelProps | undefined,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme: 'light' | 'dark') => void
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
        devtools.current.mount(devToolRef.current, props?.theme ?? 'dark')
      }

      return () => {
        if (devToolRef.current) {
          devtools.current?.unmount()
        }
      }
    }, [props?.theme])

    return <div style={{ height: '100%' }} ref={devToolRef} />
  }

  function NoOpPanel(_props: TComponentProps) {
    return <></>
  }
  return [Panel, NoOpPanel] as const
}

