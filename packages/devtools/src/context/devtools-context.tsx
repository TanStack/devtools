import { createContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { tryParseJson } from '../utils/sanitize'
import {
  TANSTACK_DEVTOOLS_CHECK_DETACHED,
  TANSTACK_DEVTOOLS_DETACHED,
  TANSTACK_DEVTOOLS_SETTINGS,
  TANSTACK_DEVTOOLS_STATE,
  getStorageItem,
  setSessionItem,
  setStorageItem,
} from '../utils/storage'
import { checkIsDetached, checkIsDetachedOwner, checkIsDetachedWindow } from '../utils/detached'
import { useRemoveBody } from '../hooks/detached/use-remove-body'
import { initialState } from './devtools-store'
import type { DevtoolsStore } from './devtools-store'
import type { JSX, Setter } from 'solid-js'

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
  name: string | ((el: HTMLHeadingElement) => void)
  /**
   * Unique identifier for the plugin.
   * If not provided, it will be generated based on the name.
   */
  id?: string
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
  render: (el: HTMLDivElement) => void
}
export const DevtoolsContext = createContext<{
  store: DevtoolsStore
  setStore: Setter<DevtoolsStore>
}>()

interface ContextProps {
  children: JSX.Element
  plugins?: Array<TanStackDevtoolsPlugin>
  config?: TanStackDevtoolsConfig
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
    return plugin.name.toLowerCase().replace(' ', '-')
  }
  // Name is JSX? return the index as a string
  return index.toString()
}

const setIsDetachedIfRequired = () => {
  const isDetachedWindow = checkIsDetachedWindow()
  if (!isDetachedWindow && window.TDT_MOUNTED) {
    setSessionItem(TANSTACK_DEVTOOLS_DETACHED, "true")
  }
}

const resetIsDetachedCheck = () => {
  setStorageItem(TANSTACK_DEVTOOLS_CHECK_DETACHED, "false")
}

const detachedModeSetup = () => {
  resetIsDetachedCheck()
  setIsDetachedIfRequired()
  const isDetachedWindow = checkIsDetachedWindow()
  const isDetached = checkIsDetached()
  const isDetachedOwner = checkIsDetachedOwner()

  if (isDetachedWindow && !isDetached) {
    window.close()
  }

  return {
    detachedWindow: window.TDT_MOUNTED ?? isDetachedWindow,
    detachedWindowOwner: isDetachedOwner,
  }
}
export const getExistingStateFromStorage = (
  config?: TanStackDevtoolsConfig,
  plugins?: Array<TanStackDevtoolsPlugin>,
) => {
  const existingState = getStorageItem(TANSTACK_DEVTOOLS_STATE)
  const settings = getSettings()
  const { detachedWindow, detachedWindowOwner } = detachedModeSetup()
  const state: DevtoolsStore = {
    ...initialState,
    plugins:
      plugins?.map((plugin, i) => {
        const id = generatePluginId(plugin, i)
        return {
          ...plugin,
          id,
        }
      }) || [],
    state: {
      ...initialState.state,
      ...(existingState ? JSON.parse(existingState) : {}),
    },
    detachedWindow,
    detachedWindowOwner,
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

  useRemoveBody(store)

  const value = {
    store,
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
  }

  return (
    <DevtoolsContext.Provider value={value}>
      {props.children}
    </DevtoolsContext.Provider>
  )
}
