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

/**
 * Puts `values` into `el` in order. Nodes that are already in place stay
 * attached, so an input that is not replaced keeps its focus. Only nodes that
 * this function put in `el` are removed.
 */
function place(el: Element, current: Array<Node>, values: Array<unknown>) {
  const next = values.flatMap((value) =>
    value instanceof Node
      ? [value]
      : typeof value === 'string' || typeof value === 'number'
        ? [document.createTextNode(String(value))]
        : [],
  )
  for (const node of current) {
    if (!next.includes(node) && node.parentNode === el) el.removeChild(node)
  }
  let anchor: Node | null = null
  for (let i = next.length - 1; i >= 0; i--) {
    const node = next[i]!
    if (node.parentNode !== el || node.nextSibling !== anchor) {
      el.insertBefore(node, anchor)
    }
    anchor = node
  }
  return next
}

/**
 * A Solid element: `JSX.Element` in Solid 1, `Element` in Solid 2. It has no
 * function type in it, so TypeScript can still type the `render` callback.
 */
type SolidElement = object | string | number | boolean | null | undefined

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
      ((el: HTMLElement, props: TriggerProps) => SolidElement) | SolidElement
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
          mounts.delete(el)
        })
        const resolved = children(content as () => any)
        // Insert the first nodes now, before the plugin's `onMount` runs, so
        // it finds them in the document. The effect then applies updates.
        let current = place(el, [], Solid.untrack(resolved.toArray))
        watch(resolved.toArray, (nodes) => {
          current = place(el, current, nodes)
        })
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
    props.plugins?.map((plugin) => {
      // The pane elements of this plugin. The shell calls `destroy` when a
      // pane closes, so their roots are disposed then.
      // ponytail: title roots stay until the adapter unmounts, because the
      // shell does not say when a title element goes away.
      const panes = new Set<Element>()
      return {
        ...plugin,
        name:
          typeof plugin.name === 'string'
            ? plugin.name
            : (el, renderProps) => convertRender(el, plugin.name, renderProps),
        render: (
          el: HTMLDivElement,
          renderProps: TanStackDevtoolsPluginProps,
        ) => {
          panes.add(el)
          convertRender(el, plugin.render, renderProps)
        },
        destroy: (pluginId: string) => {
          for (const el of panes) mounts.get(el)?.()
          panes.clear()
          plugin.destroy?.(pluginId)
        },
      }
    }),
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
