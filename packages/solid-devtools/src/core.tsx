import { TanStackDevtoolsCore } from '@tanstack/devtools'
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { Portal } from 'solid-js/web'
import type { JSX } from 'solid-js'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from '@tanstack/devtools'

type SolidPluginRender =
  | JSX.Element
  | ((
      el: HTMLDivElement | HTMLHeadingElement,
      theme: 'dark' | 'light',
    ) => JSX.Element)
  | ((props: { theme: 'dark' | 'light' }) => JSX.Element)
const convertRender = (
  el: HTMLDivElement | HTMLHeadingElement,
  Component: SolidPluginRender,
  theme: 'dark' | 'light',
) => {
  el.style.display = 'block'
  el.style.height = '100%'
  el.style.width = '100%'
  el.style.minHeight = '0'
  el.style.minWidth = '0'

  let element: JSX.Element

  if (typeof Component === 'function') {
    if (Component.length >= 2) {
      element = (
        Component as (
          el: HTMLDivElement | HTMLHeadingElement,
          theme: 'dark' | 'light',
        ) => JSX.Element
      )(el, theme)
    } else {
      element = (
        Component as (props: { theme: 'dark' | 'light' }) => JSX.Element
      )({ theme })
    }
  } else {
    element = Component
  }

  return <Portal mount={el}>{element}</Portal>
}

export type TanStackDevtoolsSolidPlugin = Omit<
  TanStackDevtoolsPlugin,
  'render' | 'name'
> & {
  /**
   * The render function can be a SolidJS element or a function that returns a SolidJS element.
   * If it's a function, it will be called to render the plugin, otherwise it will be rendered directly.
   *
   * The render function can optionally accept the current theme.
   *
   * Example:
   * ```ts
   *   {
   *     render: () => <CustomPluginComponent />,
   *   }
   *   {
   *     render: ({ theme }) => <CustomPluginComponent theme={theme} />,
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
  theme: 'light' | 'dark'
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

export default function SolidDevtoolsCore({
  config,
  plugins,
  eventBusConfig,
}: TanStackDevtoolsInit) {
  // Convert plugins to the format expected by the core
  const pluginsMap = createMemo<Array<TanStackDevtoolsPlugin> | undefined>(() =>
    plugins?.map((plugin) => ({
      ...plugin,
      name:
        typeof plugin.name === 'string'
          ? plugin.name
          : // The check above confirms that `plugin.name` is of Render type
            (el, theme) =>
              convertRender(el, plugin.name as SolidPluginRender, theme),
      render: (el: HTMLDivElement, theme: 'dark' | 'light') =>
        convertRender(el, plugin.render, theme),
    })),
  )

  const convertTrigger = (el: HTMLElement, props: TriggerProps) => {
    const Trigger = config?.customTrigger

    return (
      <Portal mount={el}>
        {typeof Trigger === 'function' ? Trigger(el, props) : Trigger}
      </Portal>
    )
  }
  const [devtools] = createSignal(
    new TanStackDevtoolsCore({
      config: {
        ...config,
        customTrigger: config?.customTrigger
          ? (el, props) => convertTrigger(el, props)
          : undefined,
      },
      eventBusConfig,
      plugins: pluginsMap(),
    }),
  )
  let devToolRef: HTMLDivElement | undefined

  createEffect(() => {
    devtools().setConfig({
      config: {
        ...config,
        customTrigger: config?.customTrigger
          ? (el, props) => convertTrigger(el, props)
          : undefined,
      },
    })
  })

  // Update plugins when they change
  createEffect(() => {
    const currentPlugins = pluginsMap()
    if (currentPlugins) {
      devtools().setConfig({ plugins: currentPlugins })
    }
  })

  onMount(() => {
    if (devToolRef) {
      devtools().mount(devToolRef)

      onCleanup(() => {
        devtools().unmount()
      })
    }
  })
  return <div style={{ position: 'absolute' }} ref={devToolRef} />
}
