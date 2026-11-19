import { TanStackDevtoolsCore } from '@tanstack/devtools'
import * as Solid from 'solid-js'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
  TanStackDevtoolsPluginProps,
  TanStackDevtoolsTheme,
} from '@tanstack/devtools'

// This file works with Solid 1 and Solid 2, so it uses only the `solid-js`
// APIs that both have, and no JSX (the two compilers emit different code).
const { children, createMemo, createRoot, getOwner, onCleanup, runWithOwner } =
  Solid

/**
 * Runs `apply` with the value of `compute` now and each time it changes.
 * Solid 2 splits an effect into these two functions; Solid 1 runs one
 * function, so the tracked read and the untracked write go in it in order.
 */
const isSolid2: boolean = 'onSettled' in Solid
function watch<T>(compute: () => T, apply: (value: T) => void) {
  if (isSolid2) {
    ;(Solid.createEffect as any)(compute, apply)
  } else {
    ;(Solid.createEffect as any)(() => {
      const value = compute()
      Solid.untrack(() => apply(value))
    })
  }
}

/** A Solid element: `JSX.Element` in Solid 1, `Element` in Solid 2. */
type SolidElement = unknown

type SolidPluginRender =
  | SolidElement
  | ((
      el: HTMLDivElement | HTMLHeadingElement,
      props: TanStackDevtoolsPluginProps,
    ) => SolidElement)
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
interface TanStackDevtoolsInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `render` function that returns a Solid element or a function
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
      | ((el: HTMLElement, props: TriggerProps) => SolidElement)
      | SolidElement
  }
  /**
   * Configuration for the TanStack Devtools client event bus.
   */
  eventBusConfig?: ClientEventBusConfig
}

/**
 * Renders nothing. After the first render it mounts the devtools shell into an
 * element at the end of `<body>`, so server and client output always match.
 */
export default function SolidDevtoolsCore(props: TanStackDevtoolsInit) {
  // The shell calls `render`, `name` and `customTrigger` from its own
  // effects, on its own copy of Solid. Each mount node gets a root owned by
  // this component, so plugins see the app's context and are disposed with
  // it. A new call replaces the node's previous root.
  const owner = getOwner()
  const mounts = new Map<Element, () => void>()
  const mountInto = (el: Element, content: () => unknown) => {
    mounts.get(el)?.()
    runWithOwner(owner, () =>
      createRoot((dispose) => {
        mounts.set(el, () => {
          dispose()
          el.replaceChildren()
        })
        const resolved = children(content as () => any)
        watch(
          () => resolved.toArray(),
          (nodes) =>
            el.replaceChildren(
              ...(nodes as Array<unknown>).flatMap((node) =>
                node instanceof Node ||
                typeof node === 'string' ||
                typeof node === 'number'
                  ? [node instanceof Node ? node : String(node)]
                  : [],
              ),
            ),
        )
      }),
    )
  }
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
          : (el, renderProps) => convertRender(el, plugin.name, renderProps),
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

  let core: TanStackDevtoolsCore | undefined
  let host: HTMLDivElement | undefined
  // Effects run only in the browser and after the first render, so this is
  // where the shell is created and mounted. Later runs pass on new config.
  watch(
    () => ({ config: shellConfig(), eventBusConfig: props.eventBusConfig }),
    ({ config, eventBusConfig }) => {
      if (core) {
        core.setConfig({ config })
        return
      }
      host = document.createElement('div')
      document.body.append(host)
      core = new TanStackDevtoolsCore({
        config,
        eventBusConfig,
        plugins: Solid.untrack(pluginsMap),
      })
      core.mount(host)
    },
  )
  // Update plugins when they change
  watch(pluginsMap, (plugins) => {
    if (plugins) core?.setConfig({ plugins })
  })

  onCleanup(() => {
    core?.unmount()
    host?.remove()
    core = undefined
    for (const dispose of mounts.values()) dispose()
    mounts.clear()
  })
  return null
}
