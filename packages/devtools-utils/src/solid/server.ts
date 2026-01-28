/**
 * Server-side no-op stub for @tanstack/devtools-utils/solid
 * This file is used in SSR environments to prevent solid-js from being bundled
 * and avoid "Client-only API called on the server side" errors.
 */

import type { DevtoolsPanelProps } from './panel'

/**
 * Server stub for constructCoreClass - returns no-op classes
 */
export function constructCoreClass(_Component: () => any) {
  class DevtoolsCore {
    constructor() {}
    async mount<T extends HTMLElement>(_el: T, _theme: 'light' | 'dark') {}
    unmount() {}
  }
  class NoOpDevtoolsCore extends DevtoolsCore {
    constructor() {
      super()
    }
    async mount<T extends HTMLElement>(_el: T, _theme: 'light' | 'dark') {}
    unmount() {}
  }
  return [DevtoolsCore, NoOpDevtoolsCore] as const
}

export type ClassType = ReturnType<typeof constructCoreClass>[0]

/**
 * Server stub for createSolidPanel - returns no-op components
 */
export function createSolidPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
>(_CoreClass: ClassType) {
  function Panel(_props: TComponentProps) {
    return null
  }

  function NoOpPanel(_props: TComponentProps) {
    return null
  }

  return [Panel, NoOpPanel] as const
}

export type { DevtoolsPanelProps }

/**
 * Server stub for createSolidPlugin - returns no-op plugin factories
 */
export function createSolidPlugin({
  ...config
}: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => any
}) {
  function Plugin() {
    return {
      ...config,
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => null,
    }
  }
  function NoOpPlugin() {
    return {
      ...config,
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => null,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
