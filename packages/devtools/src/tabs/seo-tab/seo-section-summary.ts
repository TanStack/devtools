import type { SeoSeverity } from './seo-severity'

/** Single check result used across SEO section summaries and the overview. */
export type SeoIssue = {
  severity: SeoSeverity
  message: string
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
}

export type SeoDetailView =
  | 'social-previews'
  | 'serp-preview'
  | 'json-ld-preview'
  | 'heading-structure'
  | 'links-preview'

export function worstSeverity(issues: Array<SeoIssue>): SeoSeverity | null {
  if (issues.some((i) => i.severity === 'error')) return 'error'
  if (issues.some((i) => i.severity === 'warning')) return 'warning'
  if (issues.some((i) => i.severity === 'info')) return 'info'
  return null
}

export function countBySeverity(issues: Array<SeoIssue>): {
  error: number
  warning: number
  info: number
} {
  return {
    error: issues.filter((i) => i.severity === 'error').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  }
}

/**
 * 0–100 health for one subsection’s issues, using the same penalty weights as
 * aggregateSeoHealth().
 */
export function sectionHealthScore(issues: Array<SeoIssue>): number {
  const counts = countBySeverity(issues)
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
  counts: ReturnType<typeof countBySeverity>
} {
  const all = summaries.flatMap((s) => s.issues)
  const counts = countBySeverity(all)
  const penalty = Math.min(
    100,
    counts.error * 22 + counts.warning * 9 + counts.info * 2,
  )
  const score = Math.max(0, 100 - penalty)
  const label: 'Good' | 'Fair' | 'Poor' =
    counts.error > 0 ? 'Poor' : counts.warning > 0 ? 'Fair' : 'Good'
  return { score, label, counts }
}
