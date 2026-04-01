export type SeoSeverity = 'error' | 'warning' | 'info'

/**
 * Picks a class name (or other value) for a severity without inline styles.
 */
export function pickSeverityClass<T>(
  severity: SeoSeverity,
  map: Record<SeoSeverity, T>,
): T {
  return map[severity]
}

export type SeoHealthTier = 'good' | 'fair' | 'poor'

/**
 * Buckets a 0–100 SEO health score for shared Good / Fair / Poor styling.
 */
export function seoHealthTier(score: number): SeoHealthTier {
  if (score >= 80) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}
