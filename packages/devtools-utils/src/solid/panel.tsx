/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import { onCleanup, onMount } from 'solid-js'

export interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}

export function createSolidPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
>(importPath: string, importName = 'default') {
  function Panel(props: TComponentProps) {
    let devToolRef: HTMLDivElement | undefined

    onMount(async () => {
      const devtools = await import(/* @vite-ignore */ importPath).then(
        (mod) => new mod[importName](),
      )
      if (devToolRef) {
        devtools.mount(devToolRef, props?.theme ?? 'dark')

        onCleanup(() => {
          devtools.unmount()
        })
      }
    })

    return <div style={{ height: '100%' }} ref={devToolRef} />
  }

  function NoOpPanel(_props: TComponentProps) {
    return <></>
  }

  return [Panel, NoOpPanel] as const
}
