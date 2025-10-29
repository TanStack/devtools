/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import type { JSX } from 'solid-js'
import type { DevtoolsPanelProps } from './panel'

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
      render: (_el: HTMLElement, theme: 'light' | 'dark') => {
        return <Component theme={theme} />
      },
    }
  }
  function NoOpPlugin() {
    return {
      ...config,
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => <></>,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
