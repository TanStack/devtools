import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { render } from 'preact'
import { TanStackDevtoolsCore } from '@tanstack/devtools'
import type { JSX } from 'preact'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
  TanStackDevtoolsPluginProps,
} from '@tanstack/devtools'

type PluginRender =
  | JSX.Element
  | ((el: HTMLElement, props: TanStackDevtoolsPluginProps) => JSX.Element)

type TriggerProps = {
  theme: 'dark' | 'light'
}

type TriggerRender =
  | JSX.Element
  | ((el: HTMLElement, props: TriggerProps) => JSX.Element)

export type TanStackDevtoolsPreactPlugin = Omit<
  TanStackDevtoolsPlugin,
  'render' | 'name'
> & {
  /**
   * The render function can be a Preact element or a function that returns a Preact element.
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

type TanStackDevtoolsPreactConfig = Omit<
  Partial<TanStackDevtoolsConfig>,
  'customTrigger'
> & {
  /**
   * Optional custom trigger component for the devtools.
   * It can be a Preact element or a function that renders one.
   *
   * Example:
   * ```jsx
   *   {
   *     customTrigger: <CustomTriggerComponent />,
   *   }
   * ```
   */
  customTrigger?: TriggerRender
}

export interface TanStackDevtoolsPreactInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `render` function that returns a Preact element or a function
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
  plugins?: Array<TanStackDevtoolsPreactPlugin>
  /**
   * Configuration for the devtools shell. These configuration options are used to set the
   * initial state of the devtools when it is started for the first time. Afterwards,
   * the settings are persisted in local storage and changed through the settings panel.
   */
  config?: TanStackDevtoolsPreactConfig
  /**
   * Configuration for the TanStack Devtools client event bus.
   */
  eventBusConfig?: ClientEventBusConfig
}

// Simple portal component for Preact
function Portal({
  children,
  container,
}: {
  children: JSX.Element
  container: HTMLElement
}) {
  useEffect(() => {
    render(children, container)
    return () => {
      render(null, container)
    }
  }, [children, container])

  return null
}

const convertRender = (
  Component: PluginRender,
  setComponents: (
    value:
      | Record<string, JSX.Element>
      | ((prev: Record<string, JSX.Element>) => Record<string, JSX.Element>),
  ) => void,
  e: HTMLElement,
  props: TanStackDevtoolsPluginProps,
) => {
  const element =
    typeof Component === 'function' ? Component(e, props) : Component

  setComponents((prev) => ({
    ...prev,
    [e.getAttribute('id') as string]: element,
  }))
}

const convertTrigger = (
  Component: TriggerRender,
  setComponent: (component: JSX.Element | null) => void,
  e: HTMLElement,
  props: TriggerProps,
) => {
  const element =
    typeof Component === 'function' ? Component(e, props) : Component
  setComponent(element)
}

export const TanStackDevtools = ({
  plugins,
  config,
  eventBusConfig,
}: TanStackDevtoolsPreactInit): JSX.Element | null => {
  const devToolRef = useRef<HTMLDivElement>(null)

  const [pluginContainers, setPluginContainers] = useState<
    Record<string, HTMLElement>
  >({})
  const [titleContainers, setTitleContainers] = useState<
    Record<string, HTMLElement>
  >({})
  const [triggerContainer, setTriggerContainer] = useState<HTMLElement | null>(
    null,
  )

  const [PluginComponents, setPluginComponents] = useState<
    Record<string, JSX.Element>
  >({})
  const [TitleComponents, setTitleComponents] = useState<
    Record<string, JSX.Element>
  >({})
  const [TriggerComponent, setTriggerComponent] = useState<JSX.Element | null>(
    null,
  )

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

  const [devtools] = useState(() => {
    const { customTrigger, ...coreConfig } = config || {}
    return new TanStackDevtoolsCore({
      config: {
        ...coreConfig,
        customTrigger: customTrigger
          ? (el, props) => {
            setTriggerContainer(el)
            convertTrigger(customTrigger, setTriggerComponent, el, props)
          }
          : undefined,
      },
      eventBusConfig,
      plugins: pluginsMap,
    })
  })

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
        ? Object.entries(pluginContainers).map(([key, pluginContainer]) => {
          const component = PluginComponents[key]
          return component ? (
            <Portal key={key} container={pluginContainer}>
              {component}
            </Portal>
          ) : null
        })
        : null}

      {hasTitles
        ? Object.entries(titleContainers).map(([key, titleContainer]) => {
          const component = TitleComponents[key]
          return component ? (
            <Portal key={key} container={titleContainer}>
              {component}
            </Portal>
          ) : null
        })
        : null}

      {triggerContainer && TriggerComponent ? (
        <Portal container={triggerContainer}>{TriggerComponent}</Portal>
      ) : null}
    </>
  )
}
