export type TabId = 'plugins' | 'seo' | 'settings'

/**
 * How long a tab or strip entry must be held before a drag begins. Mirrors
 * `DRAG_HOLD_MS` in the workspace; a little longer here so a slow machine does not
 * release the button early.
 */
export const DRAG_HOLD_MS = 650

export const SELECTORS = {
  /** The trigger button is selected by its accessible name. */
  triggerName: 'Open TanStack Devtools',
  mainPanel: 'tanstack-devtools-panel',
  resizeHandle: 'tsd-resize-handle',
  pipButton: 'tsd-pip-button',
  closeButton: 'tsd-close-button',
  tab: (id: TabId) => `tsd-tab-${id}`,
  // plugin workspace
  workspace: 'plugins-workspace',
  splitter: 'plugin-splitter',
  dropOverlay: 'plugin-drop-overlay',
  dragPreview: 'plugin-drag-preview',
  workspaceStatus: 'plugin-workspace-status',
  pluginPane: (pluginId: string) => `plugin-pane-${pluginId}`,
  pluginTab: (pluginId: string) => `plugin-tab-${pluginId}`,
  pluginTabClose: (pluginId: string) => `plugin-tab-close-${pluginId}`,
  // event-probe plugin
  probePanel: 'tsd-probe-panel',
  probeEmitButton: 'tsd-probe-emit',
  probeEventRow: 'tsd-probe-event-row',
  probeServerRow: 'tsd-probe-server-row',
} as const
