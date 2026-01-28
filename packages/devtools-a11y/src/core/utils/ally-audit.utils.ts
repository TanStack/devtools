import axe from 'axe-core'
import {
  getCustomRules as getCustomRulesInternal,
  runCustomRules,
} from './custom-audit.utils.js'
import { SEVERITY_ORDER } from './ui.utils.js'

// types
import type { AxeResults, RuleObject, RunOptions } from 'axe-core'
import type {
  A11yAuditOptions,
  A11yAuditResult,
  A11yIssue,
  A11yNode,
  A11ySummary,
  CustomRulesConfig,
  GroupedIssues,
  RuleSetPreset,
  SeverityThreshold,
} from '../types/types.js'

/**
 * Severity levels mapped to numeric values for comparison
 */
const IMPACT_SEVERITY: Record<SeverityThreshold, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
}

/**
 * Rule set configurations for different presets
 */
const RULE_SET_CONFIGS: Record<RuleSetPreset, Partial<RunOptions>> = {
  wcag2a: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a'],
    },
  },
  wcag2aa: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa'],
    },
  },
  wcag21aa: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  },
  wcag22aa: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
  },
  section508: {
    runOnly: {
      type: 'tag',
      values: ['section508'],
    },
  },
  'best-practice': {
    runOnly: {
      type: 'tag',
      values: ['best-practice'],
    },
  },
  all: {
    // Run all rules
  },
}

/**
 * Check if an impact level meets or exceeds the threshold
 */
export function meetsThreshold(
  impact: SeverityThreshold | null | undefined,
  threshold: SeverityThreshold,
): boolean {
  if (!impact) return false
  return IMPACT_SEVERITY[impact] >= IMPACT_SEVERITY[threshold]
}

/**
 * Convert axe-core results to our issue format
 */
function convertToIssues(
  results: AxeResults,
  threshold: SeverityThreshold,
): Array<A11yIssue> {
  const issues: Array<A11yIssue> = []

  for (const violation of results.violations) {
    const impact = violation.impact as SeverityThreshold | undefined

    for (let i = 0; i < violation.nodes.length; i++) {
      const node = violation.nodes[i]!
      const selector = node.target.join(', ')

      const a11yNode: A11yNode = {
        selector,
        html: node.html,
        xpath: node.xpath?.join(' > '),
        failureSummary: node.failureSummary,
      }

      issues.push({
        id: `${violation.id}-${i}-${Date.now()}`,
        ruleId: violation.id,
        impact: impact || 'minor',
        message: node.failureSummary || violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        wcagTags: violation.tags.filter(
          (tag) => tag.startsWith('wcag') || tag.startsWith('section508'),
        ),
        nodes: [a11yNode],
        meetsThreshold: meetsThreshold(impact, threshold),
        timestamp: Date.now(),
      })
    }
  }

  return issues
}

/**
 * Create summary statistics from issues array
 * Used when combining axe-core results with custom rule results
 */
function createSummary(
  axeResults: AxeResults,
  issues: Array<A11yIssue>,
): A11ySummary {
  const summary: A11ySummary = {
    total: issues.length,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    passes: axeResults.passes.length,
    incomplete: axeResults.incomplete.length,
  }

  for (const issue of issues) {
    const impact = issue.impact
    if (impact === 'critical') summary.critical++
    else if (impact === 'serious') summary.serious++
    else if (impact === 'moderate') summary.moderate++
    else {
      summary.minor++
    }
  }

  return summary
}

/**
 * Group issues by their impact level
 */
export function groupIssuesByImpact(issues: Array<A11yIssue>): GroupedIssues {
  const grouped: GroupedIssues = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  }

  for (const issue of issues) {
    const impact = issue.impact
    if (impact === 'critical') grouped.critical.push(issue)
    else if (impact === 'serious') grouped.serious.push(issue)
    else if (impact === 'moderate') grouped.moderate.push(issue)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    else if (impact === 'minor') grouped.minor.push(issue)
  }

  return grouped
}

/**
 * Filter issues by severity threshold
 */
export function filterByThreshold(
  issues: Array<A11yIssue>,
  threshold: SeverityThreshold,
): Array<A11yIssue> {
  return issues.filter((issue) => meetsThreshold(issue.impact, threshold))
}

/**
 * Get the context description for logging
 */
function getContextDescription(context: Document | Element | string): string {
  if (typeof context === 'string') {
    return context
  }
  if (context instanceof Document) {
    return 'document'
  }
  if (context instanceof Element) {
    return context.tagName.toLowerCase() + (context.id ? `#${context.id}` : '')
  }
  return 'unknown'
}

/**
 * Default selectors to exclude from auditing (devtools panels, overlays, etc.)
 */
const DEFAULT_EXCLUDE_SELECTORS = [
  // TanStack Devtools root container
  '[data-testid="tanstack_devtools"]',
  // A11y overlay elements
  '[data-a11y-overlay]',
  // Common devtools patterns
  '[data-devtools]',
  '[data-devtools-panel]',
]

/**
 * Run an accessibility audit using axe-core
 */
export async function runAudit(
  options: A11yAuditOptions = {},
): Promise<A11yAuditResult> {
  const {
    threshold = 'serious',
    context = document,
    ruleSet = 'wcag21aa',
    enabledRules,
    disabledRules,
    exclude = [],
    customRules = {},
  } = options

  // Merge user exclusions with default devtools exclusions
  const allExclusions = [...DEFAULT_EXCLUDE_SELECTORS, ...exclude]

  const startTime = performance.now()
  const contextDescription = getContextDescription(context)

  try {
    // Build axe-core options
    const axeOptions: RunOptions = {
      resultTypes: ['violations', 'passes', 'incomplete'],
      ...RULE_SET_CONFIGS[ruleSet],
    }

    // Handle specific rule configurations
    if (enabledRules && enabledRules.length > 0) {
      axeOptions.runOnly = {
        type: 'rule',
        values: enabledRules,
      }
    }

    // Build rules configuration for disabled rules
    if (disabledRules && disabledRules.length > 0) {
      const rules: RuleObject = {}
      for (const ruleId of disabledRules) {
        rules[ruleId] = { enabled: false }
      }
      axeOptions.rules = rules
    }

    // Determine the context to audit
    let auditContext: axe.ElementContext = context as axe.ElementContext

    // Add exclusions if specified (always include devtools exclusions)
    if (allExclusions.length > 0) {
      auditContext = {
        include: [auditContext as Element],
        exclude: allExclusions.map((sel) => [sel]),
      } as axe.ElementContext
    }

    // Run the axe-core audit
    const results = await axe.run(auditContext, axeOptions)

    // Convert axe-core results to our format
    const axeIssues = convertToIssues(results, threshold)

    // Run custom rules (if not all disabled)
    const customRulesConfig: CustomRulesConfig = {
      clickHandlerOnNonInteractive:
        customRules.clickHandlerOnNonInteractive !== false &&
        !disabledRules?.includes('click-handler-on-non-interactive'),
      mouseOnlyEventHandlers:
        customRules.mouseOnlyEventHandlers !== false &&
        !disabledRules?.includes('mouse-only-event-handlers'),
      staticElementInteraction:
        customRules.staticElementInteraction !== false &&
        !disabledRules?.includes('static-element-interaction'),
    }

    const contextElement =
      typeof context === 'string'
        ? document.querySelector(context) || document
        : context

    const customIssues = runCustomRules(contextElement, customRulesConfig)

    // Merge all issues
    const allIssues = [...axeIssues, ...customIssues]

    const duration = performance.now() - startTime

    // Create summary from combined issues
    const summary = createSummary(results, allIssues)

    return {
      issues: allIssues,
      summary,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      context: contextDescription,
      duration,
    }
  } catch (error) {
    const duration = performance.now() - startTime
    console.error('[A11y Audit] Error running axe-core:', error)

    return {
      issues: [],
      summary: {
        total: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
        passes: 0,
        incomplete: 0,
      },
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      context: contextDescription,
      duration,
    }
  }
}

/**
 * Compare two audit results and find new/resolved issues
 */
export function diffAuditResults(
  previous: A11yAuditResult | null,
  current: A11yAuditResult,
): { newIssues: Array<A11yIssue>; resolvedIssues: Array<A11yIssue> } {
  if (!previous) {
    return {
      newIssues: current.issues,
      resolvedIssues: [],
    }
  }

  // Create sets of issue identifiers for comparison
  const previousIds = new Set(
    previous.issues.map((i) => `${i.ruleId}:${i.nodes[0]?.selector}`),
  )
  const currentIds = new Set(
    current.issues.map((i) => `${i.ruleId}:${i.nodes[0]?.selector}`),
  )

  const newIssues = current.issues.filter(
    (i) => !previousIds.has(`${i.ruleId}:${i.nodes[0]?.selector}`),
  )

  const resolvedIssues = previous.issues.filter(
    (i) => !currentIds.has(`${i.ruleId}:${i.nodes[0]?.selector}`),
  )

  return { newIssues, resolvedIssues }
}

/**
 * Get a list of all available axe-core rules plus custom rules
 */
export function getAvailableRules(): Array<{
  id: string
  description: string
  tags: Array<string>
}> {
  // Get axe-core rules
  const axeRules = axe.getRules().map((rule) => ({
    id: rule.ruleId,
    description: rule.description,
    tags: rule.tags,
  }))

  // Get custom rules
  const customRules = getCustomRulesInternal()

  return [...axeRules, ...customRules]
}

export const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const

export const filterIssuesAboveThreshold = (
  issues: A11yAuditResult['issues'],
  threshold: SeverityThreshold,
  disabledRules: Array<string>,
) =>
  issues
    .filter((issue) => !disabledRules.includes(issue.ruleId))
    .filter(
      (issue) => SEVERITY_ORDER[issue.impact] >= SEVERITY_ORDER[threshold],
    )
