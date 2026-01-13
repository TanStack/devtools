/**
 * Severity threshold for filtering issues
 */
export type SeverityThreshold = 'critical' | 'serious' | 'moderate' | 'minor'

/**
 * WCAG conformance levels
 */
export type WCAGLevel =
  | 'wcag2a'
  | 'wcag2aa'
  | 'wcag2aaa'
  | 'wcag21a'
  | 'wcag21aa'
  | 'wcag21aaa'
  | 'wcag22aa'

/**
 * Rule set presets
 */
export type RuleSetPreset =
  | 'wcag2a'
  | 'wcag2aa'
  | 'wcag21aa'
  | 'wcag22aa'
  | 'section508'
  | 'best-practice'
  | 'all'

/**
 * Represents a single node affected by an accessibility issue
 */
export interface A11yNode {
  /** CSS selector for the element */
  selector: string
  /** HTML snippet of the element */
  html: string
  /** XPath to the element (optional) */
  xpath?: string
  /** Failure summary for this specific node */
  failureSummary?: string
}

/**
 * Represents a single accessibility issue
 */
export interface A11yIssue {
  /** Unique identifier for this issue instance */
  id: string
  /** The axe-core rule ID */
  ruleId: string
  /** Impact severity level */
  impact: SeverityThreshold
  /** Human-readable description of the issue */
  message: string
  /** Detailed help text */
  help: string
  /** URL to learn more about this issue */
  helpUrl: string
  /** WCAG tags associated with this rule */
  wcagTags: Array<string>
  /** DOM nodes affected by this issue */
  nodes: Array<A11yNode>
  /** Whether this issue meets the current severity threshold */
  meetsThreshold: boolean
  /** Timestamp when this issue was detected */
  timestamp: number
}

/**
 * Grouped issues by impact level
 */
export interface GroupedIssues {
  critical: Array<A11yIssue>
  serious: Array<A11yIssue>
  moderate: Array<A11yIssue>
  minor: Array<A11yIssue>
}

/**
 * Summary statistics for an audit
 */
export interface A11ySummary {
  total: number
  critical: number
  serious: number
  moderate: number
  minor: number
  passes: number
  incomplete: number
}

/**
 * Result of an accessibility audit
 */
export interface A11yAuditResult {
  /** All issues found */
  issues: Array<A11yIssue>
  /** Summary statistics */
  summary: A11ySummary
  /** Timestamp when the audit was run */
  timestamp: number
  /** URL of the page audited */
  url: string
  /** Description of the context (document, selector, or element) */
  context: string
  /** Time taken to run the audit in ms */
  duration: number
}

/**
 * Scanner engine option
 */
export type ScannerEngine = 'axe-core' | 'html-codesniffer'

/**
 * Configuration for custom rules
 */
export interface CustomRulesConfig {
  /** Enable click-handler-on-non-interactive rule (default: true) */
  clickHandlerOnNonInteractive?: boolean
  /** Enable mouse-only-event-handlers rule (default: true) */
  mouseOnlyEventHandlers?: boolean
  /** Enable static-element-interaction rule (default: true) */
  staticElementInteraction?: boolean
}

/**
 * Options for running an audit
 */
export interface A11yAuditOptions {
  /** Scanner engine to use (default: 'axe-core') */
  engine?: ScannerEngine
  /** Minimum severity to report (default: 'serious') */
  threshold?: SeverityThreshold
  /** DOM context to audit (default: document) */
  context?: Document | Element | string
  /** Rule set preset to use (default: 'wcag21aa') */
  ruleSet?: RuleSetPreset
  /** Specific rules to enable (overrides ruleSet) */
  enabledRules?: Array<string>
  /** Specific rules to disable */
  disabledRules?: Array<string>
  /** Selectors to exclude from auditing */
  exclude?: Array<string>
  /** Configuration for custom rules (default: all enabled) */
  customRules?: CustomRulesConfig
}

/**
 * Options for the A11y plugin
 */
export interface A11yPluginOptions {
  /** Minimum severity threshold (default: 'serious') */
  threshold?: SeverityThreshold
  /** Run audit automatically on mount (default: false) */
  runOnMount?: boolean
  /** Enable live monitoring with MutationObserver (default: false) */
  liveMonitoring?: boolean
  /** Debounce delay for live monitoring in ms (default: 1000) */
  liveMonitoringDelay?: number
  /** Rule set preset (default: 'wcag21aa') */
  ruleSet?: RuleSetPreset
  /** Show visual overlays on page (default: true) */
  showOverlays?: boolean
  /** Persist settings to localStorage (default: true) */
  persistSettings?: boolean
  /** Scanner engine to use (default: 'axe-core') */
  engine?: ScannerEngine
  /** Rules to disable (by rule ID) */
  disabledRules?: Array<string>
}

/**
 * State of the A11y plugin
 */
export interface A11yPluginState {
  /** Whether an audit is currently running */
  isScanning: boolean
  /** Latest audit results */
  results: A11yAuditResult | null
  /** Previous audit results (for diff detection) */
  previousResults: A11yAuditResult | null
  /** Current configuration */
  config: Required<A11yPluginOptions>
  /** Currently selected issue ID */
  selectedIssueId: string | null
  /** Whether overlays are visible */
  overlaysVisible: boolean
  /** Whether live monitoring is active */
  isLiveMonitoring: boolean
  /** Error message if any */
  error: string | null
}

/**
 * Plugin ID constant
 */
export const A11Y_PLUGIN_ID = 'a11y' as const

/**
 * Event payloads for the event client.
 * Keys must follow the pattern `{pluginId}:{eventSuffix}`
 */
export interface A11yEventMap {
  /** Emitted when audit results are available */
  'a11y:results': A11yAuditResult
  /** Emitted when an audit starts */
  'a11y:scan-start': { context: string }
  /** Emitted when an audit completes */
  'a11y:scan-complete': { duration: number; issueCount: number }
  /** Emitted when an audit fails */
  'a11y:scan-error': { error: string }
  /** Request to highlight an element */
  'a11y:highlight': { selector: string; impact: SeverityThreshold }
  /** Request to clear all highlights */
  'a11y:clear-highlights': Record<string, never>
  /** Request to highlight all issues */
  'a11y:highlight-all': { issues: Array<A11yIssue> }
  /** Configuration changed */
  'a11y:config-change': Partial<A11yPluginOptions>
  /** Live monitoring status changed */
  'a11y:live-monitoring': { enabled: boolean }
  /** New issues detected (diff from previous scan) */
  'a11y:new-issues': { issues: Array<A11yIssue> }
  /** Issues resolved (diff from previous scan) */
  'a11y:resolved-issues': { issues: Array<A11yIssue> }
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv'

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat
  /** Include passing rules in export */
  includePasses?: boolean
  /** Include incomplete rules in export */
  includeIncomplete?: boolean
  /** Custom filename (without extension) */
  filename?: string
}
