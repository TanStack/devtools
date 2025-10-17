import React, { useEffect, useMemo, useRef, useState } from 'react'
import { TanStackDevtoolsCore } from '@tanstack/devtools'
import { createPortal } from 'react-dom'
import type { JSX, ReactElement } from 'react'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from '@tanstack/devtools'

type PluginRender =
  | JSX.Element
  | ((el: HTMLElement, theme: 'dark' | 'light') => JSX.Element)

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
  setComponents: React.Dispatch<
    React.SetStateAction<Record<string, JSX.Element>>
  >,
  e: HTMLElement,
  theme: 'dark' | 'light',
) => {
  const element =
    typeof Component === 'function' ? Component(e, theme) : Component

  setComponents((prev) => ({
    ...prev,
    [e.getAttribute('id') as string]: element,
  }))
}

export const TanStackDevtools = ({
  plugins,
  config,
  eventBusConfig,
}: TanStackDevtoolsReactInit): ReactElement | null => {
  const devToolRef = useRef<HTMLDivElement>(null)

  const [pluginContainers, setPluginContainers] = useState<
    Record<string, HTMLElement>
  >({})
  const [titleContainers, setTitleContainers] = useState<
    Record<string, HTMLElement>
  >({})

  const [PluginComponents, setPluginComponents] = useState<
    Record<string, JSX.Element>
  >({})
  const [TitleComponents, setTitleComponents] = useState<
    Record<string, JSX.Element>
  >({})

  const pluginsMap: Array<TanStackDevtoolsPlugin> = useMemo(
    () =>
      plugins?.map((plugin) => {
        return {
          ...plugin,
          name:
            typeof plugin.name === 'string'
              ? plugin.name
              : (e, theme) => {
                  const id = e.getAttribute('id')!
                  const target = e.ownerDocument.getElementById(id)

                  if (target) {
                    setTitleContainers((prev) => ({
                      ...prev,
                      [id]: e,
                    }))
                  }

                  convertRender(
                    plugin.name as PluginRender,
                    setTitleComponents,
                    e,
                    theme,
                  )
                },
          render: (e, theme) => {
            const id = e.getAttribute('id')!
            const target = e.ownerDocument.getElementById(id)

            if (target) {
              setPluginContainers((prev) => ({
                ...prev,
                [id]: e,
              }))
            }

            convertRender(plugin.render, setPluginComponents, e, theme)
          },
        }
      }) ?? [],
    [plugins],
  )

  const [devtools] = useState(
    () =>
      new TanStackDevtoolsCore({
        config,
        eventBusConfig,
        plugins: pluginsMap,
      }),
  )

  useEffect(() => {
    devtools.setConfig({
      plugins: pluginsMap,
    })
  }, [devtools, pluginsMap])

  useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current)
    }

    return () => devtools.unmount()
  }, [devtools])

  const hasPlugins =
    Object.values(pluginContainers).length > 0 &&
    Object.values(PluginComponents).length > 0
  const hasTitles =
    Object.values(titleContainers).length > 0 &&
    Object.values(TitleComponents).length > 0

  return (
    <>
      <div style={{ position: 'absolute' }} ref={devToolRef} />

      {hasPlugins
        ? Object.entries(pluginContainers).map(([key, pluginContainer]) =>
            createPortal(<>{PluginComponents[key]}</>, pluginContainer),
          )
        : null}

      {hasTitles
        ? Object.entries(titleContainers).map(([key, titleContainer]) =>
            createPortal(<>{TitleComponents[key]}</>, titleContainer),
          )
        : null}
    </>
  )
}
