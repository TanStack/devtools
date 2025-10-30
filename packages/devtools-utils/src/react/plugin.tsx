import type { JSX } from 'react'
import type { DevtoolsPanelProps } from './panel'

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
      config,
      render: (_el: HTMLElement, theme: 'light' | 'dark') => (
        <Component theme={theme} />
      ),
    }
  }
  function NoOpPlugin() {
    return {
      config,
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => <></>,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
