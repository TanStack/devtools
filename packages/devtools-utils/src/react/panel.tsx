import React, { useEffect, useRef } from 'react'

export interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
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
  TComponentProps extends DevtoolsPanelProps | undefined,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme: 'light' | 'dark') => void
    unmount: () => void
  },
>(devtoolsPackageName: string, importName = 'default') {
  function Panel(props: TComponentProps) {
    const devToolRef = useRef<HTMLDivElement>(null)
    const devtools = useRef<TCoreDevtoolsClass | null>(null)
    useEffect(() => {
      if (devtools.current) return

      import(/* @vite-ignore */ devtoolsPackageName).then(
        ({ [importName]: Core }) => {
          devtools.current = new Core()

          if (devToolRef.current && devtools.current) {
            devtools.current.mount(devToolRef.current, props?.theme ?? 'dark')
          }
        },
      )

      return () => {
        devtools.current?.unmount()
      }
    }, [props?.theme])

    return <div style={{ height: '100%' }} ref={devToolRef} />
  }

  function NoOpPanel() {
    return null
  }
  return [Panel, NoOpPanel] as const
}
