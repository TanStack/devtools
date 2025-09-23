/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import { onCleanup, onMount } from 'solid-js'
import type { ClassType } from './class'

export interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}

export function createSolidPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
>(CoreClass: ClassType) {
  function Panel(props: TComponentProps) {
    let devToolRef: HTMLDivElement | undefined

    onMount(() => {
      const devtools = new CoreClass()

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
