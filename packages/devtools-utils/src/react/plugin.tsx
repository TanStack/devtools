import type { JSX } from 'react'
import type { DevtoolsPanelProps } from './panel'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export function createReactPlugin({
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
      render: (_el: HTMLElement, props: TanStackDevtoolsPluginProps) => (
        <Component {...props} />
      ),
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
