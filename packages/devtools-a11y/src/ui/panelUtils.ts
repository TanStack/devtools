import type { A11yAuditResult, SeverityThreshold } from '../types'

export const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const

const SEVERITY_ORDER: Record<SeverityThreshold, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
}

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
