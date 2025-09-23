/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import type { JSX } from "solid-js";
import type { DevtoolsPanelProps } from "./panel";

export function createSolidPlugin(name: string, Component: (props: DevtoolsPanelProps) => JSX.Element) {
  function Plugin() {
    return {
      name: name,
      render: (_el: HTMLElement, theme: 'light' | 'dark') => {
        return <Component theme={theme} />;
      },
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