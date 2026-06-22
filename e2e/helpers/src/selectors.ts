export type TabId = 'plugins' | 'seo' | 'settings'

export const SELECTORS = {
  /** The trigger button is selected by its accessible name. */
  triggerName: 'Open TanStack Devtools',
  mainPanel: 'tsd-main-panel',
  resizeHandle: 'tsd-resize-handle',
  pipButton: 'tsd-pip-button',
  closeButton: 'tsd-close-button',
  tab: (id: TabId) => `tsd-tab-${id}`,
  // event-probe plugin
  probePanel: 'tsd-probe-panel',
  probeEmitButton: 'tsd-probe-emit',
  probeEventRow: 'tsd-probe-event-row',
} as const
