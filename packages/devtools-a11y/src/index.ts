// Core plugin
export { createA11yPlugin } from './plugin'
export type { A11yDevtoolsPlugin } from './plugin'

// Event client
export { a11yEventClient } from './event-client'

// Scanner
export {
  runAudit,
  groupIssuesByImpact,
  filterByThreshold,
  meetsThreshold,
  diffAuditResults,
  getAvailableRules,
  LiveMonitor,
  getLiveMonitor,
} from './scanner'

// Overlay
export {
  highlightElement,
  highlightAllIssues,
  clearHighlights,
  initOverlayAdapter,
  overlayAdapter,
} from './overlay'

// Export utilities
export {
  exportToJson,
  exportToCsv,
  exportAuditResults,
  generateSummaryReport,
} from './export'

// Config
export {
  loadConfig,
  saveConfig,
  clearConfig,
  mergeConfig,
  DEFAULT_CONFIG,
} from './config'

// Types
export type {
  SeverityThreshold,
  WCAGLevel,
  RuleSetPreset,
  A11yNode,
  A11yIssue,
  GroupedIssues,
  A11ySummary,
  A11yAuditResult,
  A11yAuditOptions,
  A11yPluginOptions,
  A11yPluginState,
  A11yEventMap,
  ExportFormat,
  ExportOptions,
} from './types'

export { A11Y_PLUGIN_ID } from './types'
