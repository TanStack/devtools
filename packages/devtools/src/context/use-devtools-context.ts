import { createEffect, createMemo, useContext } from 'solid-js'
import { MAX_ACTIVE_PLUGINS } from '../utils/constants.js'
import { DevtoolsContext } from './devtools-context.jsx'
import { useDrawContext } from './draw-context.jsx'

import type { DevtoolsStore } from './devtools-store.js'

/**
 * Returns an object containing the current state and setState function of the ShellContext.
 * Throws an error if used outside of a ShellContextProvider.
 */
const useDevtoolsContext = () => {
  const context = useContext(DevtoolsContext)
  if (context === undefined) {
    throw new Error(
      'useDevtoolsShellContext must be used within a ShellContextProvider',
    )
  }
  return context
}

export function useTheme() {
  const { settings, setSettings } = useDevtoolsSettings()
  const theme = createMemo(() => settings().theme)
  return {
    theme,
    setTheme: (theme: DevtoolsStore['settings']['theme']) =>
      setSettings({ theme }),
  }
}

export const usePlugins = () => {
  const { store, setStore } = useDevtoolsContext()
  const { setForceExpand } = useDrawContext()

  const plugins = createMemo(() => store.plugins)
  const activePlugins = createMemo(() => store.state.activePlugins)

  createEffect(() => {
    if (activePlugins().length === 0) {
      setForceExpand(true)
    } else {
      setForceExpand(false)
    }
  })

  const toggleActivePlugins = (pluginId: string) => {
    setStore((prev) => {
      const isActive = prev.state.activePlugins.includes(pluginId)

      const updatedPlugins = isActive
        ? prev.state.activePlugins.filter((id) => id !== pluginId)
        : [...prev.state.activePlugins, pluginId]
      if (updatedPlugins.length > MAX_ACTIVE_PLUGINS) return prev
      return {
        ...prev,
        state: {
          ...prev.state,
          activePlugins: updatedPlugins,
        },
      }
    })
  }

  return { plugins, toggleActivePlugins, activePlugins }
}

export const useDevtoolsState = () => {
  const { store, setStore } = useDevtoolsContext()
  const state = createMemo(() => store.state)
  const setState = (newState: Partial<DevtoolsStore['state']>) => {
    setStore((prev) => ({
      ...prev,
      state: {
        ...prev.state,
        ...newState,
      },
    }))
  }
  return { state, setState }
}

export const useDevtoolsSettings = () => {
  const { store, setStore } = useDevtoolsContext()

  const settings = createMemo(() => store.settings)

  const setSettings = (newSettings: Partial<DevtoolsStore['settings']>) => {
    setStore((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }))
  }

  return { setSettings, settings }
}

export const usePersistOpen = () => {
  const { state, setState } = useDevtoolsState()

  const persistOpen = createMemo(() => state().persistOpen)

  const setPersistOpen = (value: boolean) => {
    setState({ persistOpen: value })
  }

  return { persistOpen, setPersistOpen }
}

export const useHeight = () => {
  const { state, setState } = useDevtoolsState()

  const height = createMemo(() => state().height)

  const setHeight = (newHeight: number) => {
    setState({ height: newHeight })
  }

  return { height, setHeight }
}
