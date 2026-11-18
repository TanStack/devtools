/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import type { JSX } from 'solid-js'
import type { DevtoolsPanelProps } from './panel'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export function createSolidPlugin({
  Component,
  ...config
}: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}) {
  function Plugin() {
    return {
      ...config,
      render: (_el: HTMLElement, props: TanStackDevtoolsPluginProps) => {
        return <Component {...props} />
      },
    }
  }
  function NoOpPlugin() {
    return {
      ...config,
      render: (_el: HTMLElement, _props: TanStackDevtoolsPluginProps) => <></>,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
