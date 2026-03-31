export type SeoSeverity = 'error' | 'warning' | 'info'

export function seoSeverityColor(severity: SeoSeverity): string {
  return severity === 'error'
    ? '#dc2626'
    : severity === 'warning'
      ? '#d97706'
      : '#2563eb'
}
