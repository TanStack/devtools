import React, { useEffect, useRef, useState } from 'react'
import {
  PLUGIN_CONTAINER_ID,
  PLUGIN_TITLE_CONTAINER_ID,
  TanStackDevtoolsCore,
  generatePluginId,
} from '@tanstack/devtools'
import { createPortal } from 'react-dom'
import type { JSX, ReactElement } from 'react'
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

export const TanStackDevtools = ({
  plugins,
  config,
  eventBusConfig,
}: TanStackDevtoolsReactInit): ReactElement | null => {
  const devToolRef = useRef<HTMLDivElement>(null)
  const [pluginContainers, setPluginContainers] = useState<Array<HTMLElement>>(
    [],
  )
  const [titleContainers, setTitleContainers] = useState<Array<HTMLElement>>([])
  const [PluginComponents, setPluginComponents] = useState<Array<JSX.Element>>(
    [],
  )
  const [TitleComponents, setTitleComponents] = useState<Array<JSX.Element>>([])

  const [devtools] = useState(
    () =>
      new TanStackDevtoolsCore({
        config,
        eventBusConfig,
        plugins: plugins?.map((plugin, index) => {
          return {
            ...plugin,
            name:
              typeof plugin.name === 'string'
                ? plugin.name
                : // The check above confirms that `plugin.name` is of Render type
                  (e) => {
                    const target = e.ownerDocument.getElementById(
                      // @ts-ignore just testing
                      `${PLUGIN_TITLE_CONTAINER_ID}-${generatePluginId(plugin, index)}`,
                    )
                    if (target) {
                      setTitleContainers((prev) => [...prev, target])
                    }
                    convertRender(plugin.name as PluginRender, (newVal) =>
                      // @ts-ignore just testing
                      setTitleComponents((prev) => [...prev, newVal]),
                    )
                  },
            render: (e) => {
              const target = e.ownerDocument.getElementById(
                // @ts-ignore just testing
                `${PLUGIN_CONTAINER_ID}-${generatePluginId(plugin, index)}`,
              )
              if (target) {
                setPluginContainers((prev) => [...prev, target])
              }

              convertRender(plugin.render, (newVal) =>
                // @ts-ignore just testing
                setPluginComponents((prev) => [...prev, newVal]),
              )
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
      <div style={{ position: 'absolute' }} ref={devToolRef} />

      {pluginContainers.length > 0 && PluginComponents.length > 0
        ? pluginContainers.map((pluginContainer, index) =>
            createPortal(<>{PluginComponents[index]}</>, pluginContainer),
          )
        : null}

      {titleContainers.length > 0 && TitleComponents.length > 0
        ? titleContainers.map((titleContainer, index) =>
            createPortal(<>{TitleComponents[index]}</>, titleContainer),
          )
        : null}
    </>
  )
}
