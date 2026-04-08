import type { SeoSeverity } from './seo-severity'

/** Single check result used across SEO section summaries and the overview. */
export type SeoIssue = {
  severity: SeoSeverity
  message: string
}

export type SeoIssueCounts = {
  error: number
  warning: number
  info: number
}

/**
 * Summary of one SEO subsection for the overview: issues plus an optional
 * one-line hint (counts, presence, etc.).
 */
export type SeoSectionSummary = {
  issues: Array<SeoIssue>
  hint?: string
  /** When `issues` is capped, total issues before capping. */
  issueCount?: number
  /** Per-severity totals before any display cap is applied. */
  totalCounts?: SeoIssueCounts
}

export type SeoDetailView =
  | 'social-previews'
  | 'serp-preview'
  | 'json-ld-preview'
  | 'heading-structure'
  | 'links-preview'

function countRawIssues(issues: Array<SeoIssue>): SeoIssueCounts {
  return issues.reduce<SeoIssueCounts>(
    (counts, issue) => {
      counts[issue.severity] += 1
      return counts
    },
    { error: 0, warning: 0, info: 0 },
  )
}

export function countBySeverity(
  summaryOrIssues: SeoSectionSummary | Array<SeoIssue>,
): SeoIssueCounts {
  return Array.isArray(summaryOrIssues)
    ? countRawIssues(summaryOrIssues)
    : (summaryOrIssues.totalCounts ?? countRawIssues(summaryOrIssues.issues))
}

export function totalIssueCount(summary: SeoSectionSummary): number {
  if (summary.issueCount != null) return summary.issueCount
  const counts = countBySeverity(summary)
  return counts.error + counts.warning + counts.info
}

export function worstSeverity(
  summaryOrIssues: SeoSectionSummary | Array<SeoIssue>,
): SeoSeverity | null {
  const counts = countBySeverity(summaryOrIssues)
  if (counts.error > 0) return 'error'
  if (counts.warning > 0) return 'warning'
  if (counts.info > 0) return 'info'
  return null
}

/**
 * 0–100 health for one subsection’s issues, using the same penalty weights as
 * aggregateSeoHealth().
 */
export function sectionHealthScore(
  summaryOrIssues: SeoSectionSummary | Array<SeoIssue>,
): number {
  const counts = countBySeverity(summaryOrIssues)
  const penalty = Math.min(
    100,
    counts.error * 22 + counts.warning * 9 + counts.info * 2,
  )
  return Math.max(0, 100 - penalty)
}

/**
 * Merges section summaries into a simple score and label for the overview.
 * Heuristic: errors and warnings reduce the score; info has a small effect.
 */
export function aggregateSeoHealth(summaries: Array<SeoSectionSummary>): {
  score: number
  label: 'Good' | 'Fair' | 'Poor'
  counts: SeoIssueCounts
} {
  const counts = summaries.reduce<SeoIssueCounts>(
    (allCounts, summary) => {
      const summaryCounts = countBySeverity(summary)
      allCounts.error += summaryCounts.error
      allCounts.warning += summaryCounts.warning
      allCounts.info += summaryCounts.info
      return allCounts
    },
    { error: 0, warning: 0, info: 0 },
  )
  const penalty = Math.min(
    100,
    counts.error * 22 + counts.warning * 9 + counts.info * 2,
  )
  const score = Math.max(0, 100 - penalty)
  const label: 'Good' | 'Fair' | 'Poor' =
    counts.error > 0 ? 'Poor' : counts.warning > 0 ? 'Fair' : 'Good'
  return { score, label, counts }
}
