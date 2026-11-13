import { TanStackDevtoolsCore } from '@tanstack/devtools'
import {
  createEffect,
  createMemo,
  createRoot,
  getOwner,
  onCleanup,
  onSettled,
  runWithOwner,
  untrack,
} from 'solid-js'
import { Portal } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
  TanStackDevtoolsPluginProps,
  TanStackDevtoolsTheme,
} from '@tanstack/devtools'

type SolidPluginRender =
  | JSX.Element
  | ((
      el: HTMLDivElement | HTMLHeadingElement,
      props: TanStackDevtoolsPluginProps,
    ) => JSX.Element)
export type TanStackDevtoolsSolidPlugin = Omit<
  TanStackDevtoolsPlugin,
  'render' | 'name'
> & {
  /**
   * The render function can be a SolidJS element or a function that returns a SolidJS element.
   * If it's a function, it will be called to render the plugin, otherwise it will be rendered directly.
   *
   * Example:
   * ```ts
   *   {
   *     render: () => <CustomPluginComponent />,
   *   }
   * ```
   * or
   * ```ts
   *   {
   *     render: <CustomPluginComponent />,
   *   }
   * ```
   */
  render: SolidPluginRender
  /**
   * Name to be displayed in the devtools UI.
   * If a string, it will be used as the plugin name.
   * If a function, it will be called with the mount element.
   *
   * Example:
   * ```ts
   *   {
   *     name: "Your Plugin",
   *     render: () => <CustomPluginComponent />,
   *   }
   * ```
   * or
   * ```ts
   *   {
   *     name: <h1>Your Plugin title</h1>,
   *     render: () => <CustomPluginComponent />,
   *   }
   * ```
   */
  name: string | SolidPluginRender
}
interface TriggerProps {
  theme: TanStackDevtoolsTheme
}
export interface TanStackDevtoolsInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `render` function that returns a React element or a function
   *
   * Example:
   * ```jsx
   * <TanStackDevtools
   *   plugins={[
   *     {
   *       id: "your-plugin-id",
   *       name: "Your Plugin",
   *       render: <CustomPluginComponent />,
   *     }
   *   ]}
   * />
   * ```
   */
  plugins?: Array<TanStackDevtoolsSolidPlugin>
  /**
   * Configuration for the devtools shell. These configuration options are used to set the
   * initial state of the devtools when it is started for the first time. Afterwards,
   * the settings are persisted in local storage and changed through the settings panel.
   */
  config?: Omit<Partial<TanStackDevtoolsConfig>, 'customTrigger'> & {
    /**
     * An optional custom function to render the dev tools trigger component.
     */
    customTrigger?:
      | ((el: HTMLElement, props: TriggerProps) => JSX.Element)
      | JSX.Element
  }
  /**
   * Configuration for the TanStack Devtools client event bus.
   */
  eventBusConfig?: ClientEventBusConfig
}

export default function SolidDevtoolsCore(props: TanStackDevtoolsInit) {
  // The shell calls `render`, `name` and `customTrigger` from its own
  // effects, which own nothing in Solid 2 (and may run on another copy of
  // Solid). Each mount node gets a root owned by this component instead: a
  // new call replaces the node's previous root, and unmounting disposes them
  // all.
  const owner = getOwner()
  const mounts = new Map<Element, () => void>()
  const mountInto = (el: Element, content: () => JSX.Element) => {
    mounts.get(el)?.()
    runWithOwner(owner, () =>
      createRoot((dispose) => {
        mounts.set(el, dispose)
        return <Portal mount={el}>{content()}</Portal>
      }),
    )
  }
  onCleanup(() => {
    for (const dispose of mounts.values()) dispose()
    mounts.clear()
  })
  const convertRender = (
    el: HTMLDivElement | HTMLHeadingElement,
    Component: SolidPluginRender,
    renderProps: TanStackDevtoolsPluginProps,
  ) =>
    mountInto(el, () =>
      typeof Component === 'function' ? Component(el, renderProps) : Component,
    )

  // Convert plugins to the format expected by the core
  const pluginsMap = createMemo<Array<TanStackDevtoolsPlugin> | undefined>(() =>
    props.plugins?.map((plugin) => ({
      ...plugin,
      name:
        typeof plugin.name === 'string'
          ? plugin.name
          : // The check above confirms that `plugin.name` is of Render type
            (el, renderProps) =>
              convertRender(el, plugin.name as SolidPluginRender, renderProps),
      render: (el: HTMLDivElement, renderProps: TanStackDevtoolsPluginProps) =>
        convertRender(el, plugin.render, renderProps),
    })),
  )

  const convertTrigger = (el: HTMLElement, triggerProps: TriggerProps) => {
    const Trigger = props.config?.customTrigger
    mountInto(el, () =>
      typeof Trigger === 'function' ? Trigger(el, triggerProps) : Trigger,
    )
  }
  const shellConfig = (): Partial<TanStackDevtoolsConfig> => ({
    ...props.config,
    customTrigger: props.config?.customTrigger
      ? (el, triggerProps) => convertTrigger(el, triggerProps)
      : undefined,
  })
  const devtools = new TanStackDevtoolsCore({
    config: untrack(shellConfig),
    eventBusConfig: untrack(() => props.eventBusConfig),
    plugins: untrack(pluginsMap),
  })
  let devToolRef: HTMLDivElement | undefined

  createEffect(shellConfig, (config) => {
    devtools.setConfig({ config })
  })

  // Update plugins when they change
  createEffect(pluginsMap, (currentPlugins) => {
    if (currentPlugins) {
      devtools.setConfig({ plugins: currentPlugins })
    }
  })

  onSettled(() => {
    if (!devToolRef) return
    devtools.mount(devToolRef)
    return () => devtools.unmount()
  })
  return <div style={{ position: 'absolute' }} ref={devToolRef} />
}
