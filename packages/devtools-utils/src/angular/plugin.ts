import type { Type } from '@angular/core'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'


export interface DevtoolsPluginProps extends TanStackDevtoolsPluginProps {
  [key: string]: any;
}

export type TanStackDevtoolsAngularPluginRenderFn<
  TInputs extends DevtoolsPluginProps,
> =
  | ((inputs: () => TInputs, hostElement: HTMLElement) => () => void)
  | Type<unknown>
  | null

export type TanStackDevtoolsAngularPluginRender<
  T extends DevtoolsPluginProps,
> =
  | Type<any>
  | (() =>
      | TanStackDevtoolsAngularPluginRenderFn<T>
      | Promise<TanStackDevtoolsAngularPluginRenderFn<T>>)

export function createAngularPlugin<T extends DevtoolsPluginProps>({
  render,
  ...config
}: {
  name: string
  id?: string
  defaultOpen?: boolean
  render: TanStackDevtoolsAngularPluginRender<T>
}) {
  function Plugin(inputs?: T | (() => T)) {
    return {
      ...config,
      render,
      inputs,
    }
  }

  function NoOpPlugin() {
    return {
      ...config,
      render: null,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
