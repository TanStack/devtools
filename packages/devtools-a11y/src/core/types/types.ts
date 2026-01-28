/**
 * Severity threshold for filtering issues
 */
export type SeverityThreshold = 'critical' | 'serious' | 'moderate' | 'minor'

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
 * Rule categories (axe-core tags)
 */
export type RuleCategory =
  | 'all'
  | 'cat.aria'
  | 'cat.color'
  | 'cat.forms'
  | 'cat.keyboard'
  | 'cat.language'
  | 'cat.name-role-value'
  | 'cat.parsing'
  | 'cat.semantics'
  | 'cat.sensory-and-visual-cues'
  | 'cat.structure'
  | 'cat.tables'
  | 'cat.text-alternatives'
  | 'cat.time-and-media'

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

  /** Rule set preset (default: 'wcag21aa') */
  ruleSet?: RuleSetPreset

  /** Show visual overlays on page (default: true) */
  showOverlays?: boolean

  /** Persist settings to localStorage (default: true) */
  persistSettings?: boolean

  /** Rules to disable (by rule ID) */
  disabledRules?: Array<string>
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
