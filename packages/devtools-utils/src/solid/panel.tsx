/** @jsxImportSource @solidjs/web - we use Solid.js as JSX here */

import { onSettled } from 'solid-js'
import type { ClassType } from './class'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export interface DevtoolsPanelProps extends TanStackDevtoolsPluginProps {}

export function createSolidPanel<TComponentProps extends DevtoolsPanelProps>(
  CoreClass: ClassType,
) {
  function Panel(props: TComponentProps) {
    let devToolRef: HTMLDivElement | undefined
    const devtools = new CoreClass()
    onSettled(() => {
      if (devToolRef) {
        devtools.mount(devToolRef, props)
      }
      return () => devtools.unmount()
    })

    return <div style={{ height: '100%' }} ref={devToolRef} />
  }

  function NoOpPanel(_props: TComponentProps) {
    return <></>
  }

  return [Panel, NoOpPanel] as const
}
