import type { Type } from '@angular/core'

export type TanStackDevtoolsAngularPluginRenderFn<
  TInputs extends Record<string, unknown>,
> =
  | ((inputs: () => TInputs, hostElement: HTMLElement) => () => void)
  | Type<unknown>
  | null

export type TanStackDevtoolsAngularPluginRender<
  T extends Record<string, unknown>,
> =
  | Type<any>
  | (() =>
      | TanStackDevtoolsAngularPluginRenderFn<T>
      | Promise<TanStackDevtoolsAngularPluginRenderFn<T>>)

export function createAngularPlugin<T extends Record<string, unknown>>({
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
