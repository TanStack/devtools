import { createMemo, useContext as getContext, onCleanup } from 'solid-js'
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
    const current = store.state.layout
    const isActive = flattenTabs(current).includes(pluginId)

    if (isActive) {
      // `destroy` is deliberately not called here. It hangs off the pane's own
      // teardown in `PluginWorkspace`, so it fires exactly once however the pane
      // was closed — this toggle, a tab's close button, or a whole group going
      // away — and it fires before the mount node is detached.
      setLayout(closeTab(current, pluginId))
      return
    }

    if (flattenTabs(current).length >= MAX_ACTIVE_PLUGINS) return

    // Opening from the strip adds a pane alongside the others at an equal share,
    // which is the side-by-side behaviour the strip has always had. Dragging
    // decides placement for itself.
    setLayout(appendPane(current, pluginId))
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
 * Whether the secondary strip is folded behind the header. Lives on the
 * persisted store so a reload keeps the height the user folded away.
 */
export const createCollapsed = () => {
  const { state, setState } = createDevtoolsState()
  const isCollapsed = createMemo(() => state().subheaderCollapsed)
  const setCollapsed = (value: boolean | ((previous: boolean) => boolean)) => {
    const next =
      typeof value === 'function' ? value(state().subheaderCollapsed) : value
    setState({ subheaderCollapsed: next })
  }
  return {
    isCollapsed,
    toggleCollapsed: () => setCollapsed((previous) => !previous),
    setCollapsed,
  }
}

/**
 * Handing a drag from the Plugins strip over to the workspace.
 *
 * The strip and the workspace are siblings, and only the workspace knows where
 * the panes are, so the workspace registers a handler here and the strip calls it
 * the moment a press becomes a drag.
 *
 * A **direct call**, not a signal: an effect reacting to a signal runs a
 * microtask later, and every pointer move in the meantime is lost — a quick flick
 * from the strip into a pane would land with no drop target ever computed.
 */
type StripDragHandler = (
  pluginId: string,
  point: { x: number; y: number },
) => void

export const createStripDrag = () => {
  const { paneDragBridge } = createDevtoolsContext()
  return {
    /** Called by the workspace during setup; cleared when it goes away. */
    acceptStripDrags: (handler: StripDragHandler) => {
      paneDragBridge.handler = handler
      onCleanup(() => {
        // Only clear our own, so a replacement that registered first survives.
        if (paneDragBridge.handler === handler) paneDragBridge.handler = null
      })
    },
    /** Called by the strip once a press has been held long enough to be a drag. */
    beginStripDrag: (pluginId: string, point: { x: number; y: number }) =>
      paneDragBridge.handler?.(pluginId, point),
  }
}

export const createHeight = () => {
  const { state, setState } = createDevtoolsState()
  const height = createMemo(() => state().height)
  const setHeight = (newHeight: number) => {
    setState({ height: newHeight })
  }
  return { height, setHeight }
}
