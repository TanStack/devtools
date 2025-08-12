import React, { useEffect, useRef, useState } from 'react'
import {
  PLUGIN_CONTAINER_ID,
  PLUGIN_TITLE_CONTAINER_ID,
  TanStackDevtoolsCore,
} from '@tanstack/devtools'
import { createPortal } from 'react-dom'
import type { JSX } from 'react'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from '@tanstack/devtools'

type PluginRender = JSX.Element | (() => JSX.Element)

export type TanStackDevtoolsReactPlugin = Omit<
  TanStackDevtoolsPlugin,
  'render' | 'name'
> & {
  /**
   * The render function can be a React element or a function that returns a React element.
   * If it's a function, it will be called to render the plugin, otherwise it will be rendered directly.
   *
   * Example:
   * ```jsx
   *   {
   *     render: () => <CustomPluginComponent />,
   *   }
   * ```
   * or
   * ```jsx
   *   {
   *     render: <CustomPluginComponent />,
   *   }
   * ```
   */
  render: PluginRender
  /**
   * Name to be displayed in the devtools UI.
   * If a string, it will be used as the plugin name.
   * If a function, it will be called with the mount element.
   *
   * Example:
   * ```jsx
   *   {
   *     name: "Your Plugin",
   *     render: () => <CustomPluginComponent />,
   *   }
   * ```
   * or
   * ```jsx
   *   {
   *     name:  <h1>Your Plugin title</h1>,
   *     render: () => <CustomPluginComponent />,
   *   }
   * ```
   */
  name: string | PluginRender
}

export interface TanStackDevtoolsReactInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `render` function that returns a React element or a function
   *
   * Example:
   * ```jsx
   * <TanstackDevtools
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
  plugins?: Array<TanStackDevtoolsReactPlugin>
  /**
   * Configuration for the devtools shell. These configuration options are used to set the
   * initial state of the devtools when it is started for the first time. Afterwards,
   * the settings are persisted in local storage and changed through the settings panel.
   */
  config?: Partial<TanStackDevtoolsConfig>
  /**
   * Configuration for the TanStack Devtools client event bus.
   */
  eventBusConfig?: ClientEventBusConfig
}

const convertRender = (
  Component: PluginRender,
  setComponent: React.Dispatch<React.SetStateAction<JSX.Element | null>>,
) => {
  setComponent(typeof Component === 'function' ? Component() : Component)
}

export const TanstackDevtools = ({
  plugins,
  config,
  eventBusConfig,
}: TanStackDevtoolsReactInit) => {
  const devToolRef = useRef<HTMLDivElement>(null)
  const [pluginContainer, setPluginContainer] = useState<HTMLElement | null>(
    null,
  )
  const [titleContainer, setTitleContainer] = useState<HTMLElement | null>(null)
  const [PluginComponent, setPluginComponent] = useState<JSX.Element | null>(
    null,
  )
  const [TitleComponent, setTitleComponent] = useState<JSX.Element | null>(null)
  const [devtools] = useState(
    () =>
      new TanStackDevtoolsCore({
        config,
        eventBusConfig,
        plugins: plugins?.map((plugin) => {
          return {
            ...plugin,
            name:
              typeof plugin.name === 'string'
                ? plugin.name
                : // The check above confirms that `plugin.name` is of Render type
                  () => {
                    setTitleContainer(
                      document.getElementById(PLUGIN_TITLE_CONTAINER_ID) ||
                        null,
                    )
                    convertRender(
                      plugin.name as PluginRender,
                      setTitleComponent,
                    )
                  },
            render: () => {
              setPluginContainer(
                document.getElementById(PLUGIN_CONTAINER_ID) || null,
              )
              convertRender(plugin.render, setPluginComponent)
            },
          }
        }),
      }),
  )
  useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current)
    }

    return () => devtools.unmount()
  }, [devtools])

  return (
    <>
      <div style={{ height: '100%' }} ref={devToolRef} />
      {pluginContainer && PluginComponent
        ? createPortal(<>{PluginComponent}</>, pluginContainer)
        : null}
      {titleContainer && TitleComponent
        ? createPortal(<>{TitleComponent}</>, titleContainer)
        : null}
    </>
  )
}
