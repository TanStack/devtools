import type { A11yAuditResult, ExportOptions } from '../types'

/**
 * Export audit results to JSON format
 */
export function exportToJson(
  result: A11yAuditResult,
  _options: Partial<ExportOptions> = {},
): string {
  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      url: result.url,
      auditTimestamp: result.timestamp,
      duration: result.duration,
      context: result.context,
    },
    summary: result.summary,
    issues: result.issues.map((issue) => ({
      id: issue.id,
      ruleId: issue.ruleId,
      impact: issue.impact,
      message: issue.message,
      help: issue.help,
      helpUrl: issue.helpUrl,
      wcagTags: issue.wcagTags,
      nodes: issue.nodes.map((node) => ({
        selector: node.selector,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export audit results to CSV format
 */
export function exportToCsv(
  result: A11yAuditResult,
  _options: Partial<ExportOptions> = {},
): string {
  const headers = [
    'Rule ID',
    'Impact',
    'Message',
    'Help URL',
    'WCAG Tags',
    'Selector',
    'HTML',
  ]

  const rows: Array<Array<string>> = []

  for (const issue of result.issues) {
    for (const node of issue.nodes) {
      rows.push([
        issue.ruleId,
        issue.impact,
        issue.message.replace(/"/g, '""'),
        issue.helpUrl,
        issue.wcagTags.join('; '),
        node.selector,
        node.html.replace(/"/g, '""'),
      ])
    }
  }

  return [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')
}

/**
 * Download a file with the given content
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export audit results and trigger download
 */
export function exportAuditResults(
  result: A11yAuditResult,
  options: ExportOptions,
): void {
  const { format, filename } = options
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const defaultFilename = `a11y-audit-${timestamp}`

  if (format === 'json') {
    const content = exportToJson(result, options)
    downloadFile(
      content,
      `${filename || defaultFilename}.json`,
      'application/json',
    )
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (format === 'csv') {
    const content = exportToCsv(result, options)
    downloadFile(content, `${filename || defaultFilename}.csv`, 'text/csv')
  }
}

/**
 * Generate a summary report as a formatted string
 */
export function generateSummaryReport(result: A11yAuditResult): string {
  const { summary } = result

  const lines = [
    '='.repeat(50),
    'ACCESSIBILITY AUDIT REPORT',
    '='.repeat(50),
    '',
    `URL: ${result.url}`,
    `Date: ${new Date(result.timestamp).toLocaleString()}`,
    `Duration: ${result.duration.toFixed(2)}ms`,
    '',
    '-'.repeat(50),
    'SUMMARY',
    '-'.repeat(50),
    '',
    `Total Issues: ${summary.total}`,
    `  - Critical: ${summary.critical}`,
    `  - Serious: ${summary.serious}`,
    `  - Moderate: ${summary.moderate}`,
    `  - Minor: ${summary.minor}`,
    '',
    `Passing Rules: ${summary.passes}`,
    `Incomplete Checks: ${summary.incomplete}`,
    '',
  ]

  if (result.issues.length > 0) {
    lines.push('-'.repeat(50))
    lines.push('ISSUES')
    lines.push('-'.repeat(50))
    lines.push('')

    const issuesByImpact = {
      critical: result.issues.filter((i) => i.impact === 'critical'),
      serious: result.issues.filter((i) => i.impact === 'serious'),
      moderate: result.issues.filter((i) => i.impact === 'moderate'),
      minor: result.issues.filter((i) => i.impact === 'minor'),
    }

    for (const [impact, issues] of Object.entries(issuesByImpact)) {
      if (issues.length > 0) {
        lines.push(`[${impact.toUpperCase()}]`)
        for (const issue of issues) {
          lines.push(`  - ${issue.ruleId}: ${issue.message}`)
          lines.push(`    Selector: ${issue.nodes[0]?.selector}`)
          lines.push(`    Learn more: ${issue.helpUrl}`)
          lines.push('')
        }
      }
    }
  }

  lines.push('='.repeat(50))

  return lines.join('\n')
}
