import { createMemo, createSignal, useContext as getContext } from 'solid-js'
import { MAX_ACTIVE_PLUGINS } from '../utils/constants.js'
import { appendPane, closeTab, flattenTabs } from '../utils/layout-tree.js'
import { DevtoolsContext } from './devtools-context.jsx'
import type { LayoutNode } from '../utils/layout-tree.js'
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
  /**
   * Derived, never stored. The layout tree is the only record of what is open,
   * so this cannot drift out of step with it.
   *
   * Compared by contents, not identity: `flattenTabs` builds a fresh array every
   * time, and without this every unrelated store write would look like a change
   * and re-run each plugin's `render`.
   */
  const activePlugins = createMemo(() => flattenTabs(store.state.layout), [], {
    equals: (a, b) => a.length === b.length && a.every((id, i) => id === b[i]),
  })
  const layout = createMemo(() => store.state.layout)

  const setLayout = (next: LayoutNode | null) => {
    setStore((previous) => ({
      ...previous,
      state: { ...previous.state, layout: next },
    }))
  }

  const toggleActivePlugins = (pluginId: string) => {
    setStore((previous) => {
      const current = previous.state.layout
      const isActive = flattenTabs(current).includes(pluginId)

      if (isActive) {
        // `destroy` is deliberately not called here. It hangs off the pane's own
        // teardown in `PluginWorkspace`, so it fires exactly once however the
        // pane was closed — this toggle, a tab's close button, or a whole group
        // going away — and it fires before the mount node is detached.
        return {
          ...previous,
          state: { ...previous.state, layout: closeTab(current, pluginId) },
        }
      }

      if (flattenTabs(current).length >= MAX_ACTIVE_PLUGINS) return previous

      // Opening from the strip adds a pane alongside the others at an equal
      // share, which is the side-by-side behaviour the strip has always had.
      // Dragging decides placement for itself.
      return {
        ...previous,
        state: { ...previous.state, layout: appendPane(current, pluginId) },
      }
    })
  }

  return { plugins, toggleActivePlugins, activePlugins, layout, setLayout }
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

/**
 * Whether the strip and destination content are collapsed behind the main
 * header. Deliberately not part of the persisted store: it is a momentary view
 * state, and a reload should bring the panel back in full.
 *
 * The shell mounts once per document, so one module-level signal is enough and
 * saves threading the toggle through every strip that hosts the control.
 */
const [collapsed, setCollapsed] = createSignal(false)

export const createCollapsed = () => ({
  isCollapsed: collapsed,
  toggleCollapsed: () => setCollapsed((previous) => !previous),
  setCollapsed,
})

export const createHeight = () => {
  const { state, setState } = createDevtoolsState()
  const height = createMemo(() => state().height)
  const setHeight = (newHeight: number) => {
    setState({ height: newHeight })
  }
  return { height, setHeight }
}
