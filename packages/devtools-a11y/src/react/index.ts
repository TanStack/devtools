// React component
export { A11yDevtoolsPanel } from './A11yDevtoolsPanel'

// Hooks
export {
  useA11yAudit,
  useA11yRef,
  useA11yOverlay,
  useA11yEvents,
} from './hooks'

// Re-export core types and utilities
export {
  createA11yPlugin,
  a11yEventClient,
  runAudit,
  filterByThreshold,
  groupIssuesByImpact,
  highlightElement,
  highlightAllIssues,
  clearHighlights,
  exportAuditResults,
} from '../index'

export type {
  A11yPluginOptions,
  A11yAuditOptions,
  A11yAuditResult,
  A11yIssue,
  SeverityThreshold,
  RuleSetPreset,
} from '../types'
