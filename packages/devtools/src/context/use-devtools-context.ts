import { createMemo, useContext as getContext } from 'solid-js'
import { MAX_ACTIVE_PLUGINS } from '../utils/constants.js'
import { DevtoolsContext } from './devtools-context.jsx'
import type { DevtoolsStore } from './devtools-store.js'

const createDevtoolsContext = () => {
  const context = getContext(DevtoolsContext)
  if (context === undefined) {
    throw new Error(
      'createDevtoolsContext must be used within a ShellContextProvider',
    )
  }
  return context
}

export function createTheme() {
  const { settings, setSettings } = createDevtoolsSettings()
  const theme = createMemo(() => settings().theme)
  return {
    theme,
    setTheme: (theme: DevtoolsStore['settings']['theme']) =>
      setSettings({ theme }),
  }
}

export const createPlugins = () => {
  const { store, setStore } = createDevtoolsContext()
  const plugins = createMemo(() => store.plugins)
  const activePlugins = createMemo(() => store.state.activePlugins)

  const toggleActivePlugins = (pluginId: string) => {
    setStore((previous) => {
      const isActive = previous.state.activePlugins.includes(pluginId)
      const currentPlugin = store.plugins?.find(
        (plugin) => plugin.id === pluginId,
      )

      if (currentPlugin?.destroy && isActive) {
        currentPlugin.destroy(pluginId)
      }

      const updatedPlugins = isActive
        ? previous.state.activePlugins.filter((id) => id !== pluginId)
        : [...previous.state.activePlugins, pluginId]
      if (updatedPlugins.length > MAX_ACTIVE_PLUGINS) return previous
      return {
        ...previous,
        state: {
          ...previous.state,
          activePlugins: updatedPlugins,
        },
      }
    })
  }

  return { plugins, toggleActivePlugins, activePlugins }
}

export const createDevtoolsState = () => {
  const { store, setStore } = createDevtoolsContext()
  const state = createMemo(() => store.state)
  const setState = (newState: Partial<DevtoolsStore['state']>) => {
    setStore((previous) => ({
      ...previous,
      state: {
        ...previous.state,
        ...newState,
      },
    }))
  }
  return { state, setState }
}

export const createDevtoolsSettings = () => {
  const { store, setStore } = createDevtoolsContext()
  const settings = createMemo(() => store.settings)
  const setSettings = (newSettings: Partial<DevtoolsStore['settings']>) => {
    setStore((previous) => ({
      ...previous,
      settings: {
        ...previous.settings,
        ...newSettings,
      },
    }))
  }
  return { setSettings, settings }
}

export const createPersistOpen = () => {
  const { state, setState } = createDevtoolsState()
  const persistOpen = createMemo(() => state().persistOpen)
  const setPersistOpen = (value: boolean) => {
    setState({ persistOpen: value })
  }
  return { persistOpen, setPersistOpen }
}

export const createHeight = () => {
  const { state, setState } = createDevtoolsState()
  const height = createMemo(() => state().height)
  const setHeight = (newHeight: number) => {
    setState({ height: newHeight })
  }
  return { height, setHeight }
}
