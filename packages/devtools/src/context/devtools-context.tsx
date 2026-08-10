import { createComponent, createContext, createEffect } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { getDefaultActivePlugins } from '../utils/get-default-active-plugins'
import { flattenTabs, repairLayout, singleGroup } from '../utils/layout-tree'
import { tryParseJson } from '../utils/sanitize'
import {
  TANSTACK_DEVTOOLS_SETTINGS,
  TANSTACK_DEVTOOLS_STATE,
  getStorageItem,
  setStorageItem,
} from '../utils/storage'
import { initialState } from './devtools-store'
import type { DevtoolsStore } from './devtools-store'
import type { JSX, Setter } from 'solid-js'
import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'

export interface TanStackDevtoolsPluginProps {
  theme: TanStackDevtoolsTheme
  devtoolsOpen: boolean
}
export interface TanStackDevtoolsPlugin {
  /**
   * Name to be displayed in the devtools UI.
   * If a string, it will be used as the plugin name.
   * If a function, it will be called with the mount element.
   *
   * Example:
   * ```ts
   *   {
   *     // If a string, it will be used as the plugin name
   *     name: "Your Plugin",
   *     render: () => {}
   *   }
   * ```
   * or
   *
   * ```ts
   *   {
   *     // If a function, it will be called with the mount element
   *     name: (el) => {
   *       el.innerText = "Your Plugin Name"
   *       // Your name logic here
   *     },
   *     render: () => {}
   *   }
   * ```
   */
  name:
    | string
    | ((el: HTMLHeadingElement, props: TanStackDevtoolsPluginProps) => void)
  /**
   * Unique identifier for the plugin.
   * If not provided, it will be generated based on the name.
   */
  id?: string
  /**
   * Whether the plugin should be open by default when there are no active plugins.
   * If true, this plugin will be added to activePlugins on initial load when activePlugins is empty.
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Render the plugin UI by using the provided element. This function will be called
   * when the plugin tab is clicked and expected to be mounted.
   * @param el The mount element for the plugin.
   * @returns void
   *
   * Example:
   * ```ts
   *   render: (el) => {
   *     el.innerHTML = "<h1>Your Plugin</h1>"
   *   }
   * ```
   */
  render: (el: HTMLDivElement, props: TanStackDevtoolsPluginProps) => void
  destroy?: (pluginId: string) => void
}
export const DevtoolsContext = createContext<{
  store: DevtoolsStore
  setStore: Setter<DevtoolsStore>
  /**
   * Swap the layout tree wholesale.
   *
   * Needed because a Solid store *merges* object nodes rather than replacing
   * them: writing the layout through `setStore` leaves behind keys the old shape
   * had and the new one does not. Closing one of three panes would keep the third
   * child, so the layout never collapsed and the surviving pane never grew.
   */
  replaceLayout: (next: DevtoolsStore['state']['layout']) => void
  /**
   * Where the Plugins strip hands a drag over to the workspace.
   *
   * A mutable holder on the context rather than a module-level variable: this
   * package ships several bundles, so two components can end up holding different
   * copies of the same module and never see each other's writes. The context is
   * the one thing they are guaranteed to share.
   *
   * A direct call, not a signal — an effect reacting to a signal runs a microtask
   * later and every pointer move until then is lost.
   */
  paneDragBridge: {
    handler:
      | ((pluginId: string, point: { x: number; y: number }) => void)
      | null
  }
}>()

interface ContextProps {
  children: JSX.Element
  plugins?: Array<TanStackDevtoolsPlugin>
  config?: TanStackDevtoolsConfig
  onSetPlugins?: (
    setPlugins: (plugins: Array<TanStackDevtoolsPlugin>) => void,
  ) => void
}

const getSettings = () => {
  const settingsString = getStorageItem(TANSTACK_DEVTOOLS_SETTINGS)
  const settings = tryParseJson<DevtoolsStore['settings']>(settingsString)
  return {
    ...settings,
  }
}

const generatePluginId = (plugin: TanStackDevtoolsPlugin, index: number) => {
  // if set by user, return the plugin id
  if (plugin.id) {
    return plugin.id
  }
  if (typeof plugin.name === 'string') {
    // if name is a string, use it to generate an id
    return `${plugin.name.toLowerCase().replace(' ', '-')}-${index}`
  }
  // Name is JSX? return the index as a string
  return index.toString()
}

export function getStateFromLocalStorage(
  plugins: Array<TanStackDevtoolsPlugin> | undefined,
) {
  const existingStateString = getStorageItem(TANSTACK_DEVTOOLS_STATE)
  const existingState = tryParseJson<
    DevtoolsStore['state'] & { activePlugins?: Array<string> }
  >(existingStateString)
  const pluginIds =
    plugins?.map((plugin, i) => generatePluginId(plugin, i)) || []

  if (existingState) {
    const known = new Set(pluginIds)
    const before = JSON.stringify(existingState.layout ?? null)
    // State written before the workspace became a tree only knows which plugins
    // were open, not how they were arranged, so it reopens as a single group in
    // the stored order.
    const raw =
      existingState.layout ?? singleGroup(existingState.activePlugins ?? [])
    // Never throws: an unknown plugin id, a malformed tree, or a hand-edited
    // entry costs the arrangement at worst, but must not stop the panel opening.
    existingState.layout = repairLayout(raw, known)
    delete existingState.activePlugins

    if (JSON.stringify(existingState.layout ?? null) !== before) {
      setStorageItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(existingState))
    }
  }

  return existingState
}

export const getExistingStateFromStorage = (
  config?: TanStackDevtoolsConfig,
  plugins?: Array<TanStackDevtoolsPlugin>,
) => {
  const existingState = getStateFromLocalStorage(plugins)
  const settings = getSettings()

  const pluginsWithIds =
    plugins?.map((plugin, i) => {
      const id = generatePluginId(plugin, i)
      return {
        ...plugin,
        id,
      }
    }) || []

  // If nothing was open, seed from plugins with defaultOpen: true, or activate
  // a lone plugin automatically.
  let layout = existingState?.layout ?? null

  const shouldFillWithDefaultOpenPlugins =
    flattenTabs(layout).length === 0 && pluginsWithIds.length > 0
  if (shouldFillWithDefaultOpenPlugins) {
    layout = singleGroup(getDefaultActivePlugins(pluginsWithIds))
  }

  const state: DevtoolsStore = {
    ...initialState,
    plugins: pluginsWithIds,
    state: {
      ...initialState.state,
      ...existingState,
      layout,
    },
    settings: {
      ...initialState.settings,
      ...config,
      ...settings,
    },
  }
  return state
}

export type TanStackDevtoolsConfig = DevtoolsStore['settings']

export const DevtoolsProvider = (props: ContextProps) => {
  const [store, setStore] = createStore(
    getExistingStateFromStorage(props.config, props.plugins),
  )

  setStorageItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(store.state))

  // Provide a way for the core to update plugins reactively
  const updatePlugins = (newPlugins: Array<TanStackDevtoolsPlugin>) => {
    const pluginsWithIds = newPlugins.map((plugin, i) => {
      const id = generatePluginId(plugin, i)
      return {
        ...plugin,
        id,
      }
    })

    setStore('plugins', pluginsWithIds)
  }

  // Call the callback to give core access to updatePlugins
  createEffect(() => {
    if (props.onSetPlugins) {
      props.onSetPlugins(updatePlugins)
    }
  })

  const value = {
    store,
    paneDragBridge: { handler: null },
    setStore: (
      updater: (prev: DevtoolsStore) => DevtoolsStore | Partial<DevtoolsStore>,
    ) => {
      const newState = updater(store)
      const { settings, state: internalState } = newState
      // Store user settings for dev tools into local storage
      setStorageItem(TANSTACK_DEVTOOLS_SETTINGS, JSON.stringify(settings))
      // Store general state into local storage
      setStorageItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(internalState))
      setStore((prev) => ({
        ...prev,
        ...newState,
      }))
    },
    replaceLayout: (next: DevtoolsStore['state']['layout']) => {
      // `reconcile`, not a plain write. A Solid store merges one object node into
      // another, so writing the new tree over the old one keeps whatever keys and
      // children the old shape had — closing one of three panes left the third
      // child behind and the layout never collapsed. Clearing to `null` first
      // would fix that but empties the layout for an instant, which tears every
      // plugin down and rebuilds it. `reconcile` diffs in one step, shrinking
      // arrays and dropping absent keys, with no empty state in between.
      setStore(
        'state',
        'layout',
        next === null ? null : reconcile(next, { key: null }),
      )
      setStorageItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(store.state))
    },
  }

  return createComponent(DevtoolsContext.Provider, {
    value,
    get children() {
      return props.children
    },
  })
}
