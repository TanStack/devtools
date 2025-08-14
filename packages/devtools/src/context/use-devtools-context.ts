import { createMemo, useContext } from 'solid-js'
import { DevtoolsContext } from './devtools-context.jsx'
/* import type { DevtoolsPlugin } from './devtools-context' */
import type { DevtoolsStore } from './devtools-store.js'

/**
 * Returns an object containing the current state and setState function of the ShellContext.
 * Throws an error if used outside of a ShellContextProvider.
 */
export const useDevtoolsContext = () => {
  const context = useContext(DevtoolsContext)
  if (context === undefined) {
    throw new Error(
      'useDevtoolsShellContext must be used within a ShellContextProvider',
    )
  }
  return context
}

export const usePlugins = () => {
  const { store, setStore } = useDevtoolsContext()

  const plugins = createMemo(() => store.plugins)
  const activePlugin = createMemo(() => store.state.activePlugin)

  const setActivePlugin = (pluginId: string) => {
    setStore((prev) => ({
      ...prev,
      state: {
        ...prev.state,
        activePlugin: pluginId,
      },
    }))
  }

  return { plugins, setActivePlugin, activePlugin }
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

declare global {
  interface Window {
    TDT_MOUNTED: boolean | undefined
  }
}

export const useDetachedWindowControls = () => {
  const { store, setStore } = useDevtoolsContext()
  const detachedWindowOwner = createMemo(() => store.detachedWindowOwner)
  const detachedWindow = createMemo(() => store.detachedWindow)
  const mounted = createMemo(() => Boolean(window.TDT_MOUNTED))
  const setDetachedWindowOwner = (isDetachedWindowOwner: boolean) => {
    setStore((prev) => ({
      ...prev,
      detachedWindowOwner: isDetachedWindowOwner,
    }))
  }

  return {
    detachedWindow: detachedWindow() || mounted(),
    detachedWindowOwner,
    setDetachedWindowOwner,
    isDetached: Boolean(detachedWindow() || detachedWindowOwner()),
  }
}
