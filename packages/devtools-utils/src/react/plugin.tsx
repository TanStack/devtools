import type { JSX } from "react"
import type { DevtoolsPanelProps } from "./panel"

export function createReactPlugin(name: string, Component: (props: DevtoolsPanelProps) => JSX.Element) {
  function Plugin() {
    return {
      name: name,
      render: (_el: HTMLElement, theme: 'light' | 'dark') => <Component theme={theme} />,
    }
  }
  function NoOpPlugin() {
    return {
      name: name,
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => null,
    }
  }
  return [Plugin, NoOpPlugin] as const
}