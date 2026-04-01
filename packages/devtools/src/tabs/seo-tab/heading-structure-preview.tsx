import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { seoSeverityColor, type SeoSeverity } from './seo-severity'
import type { SeoSectionSummary } from './seo-section-summary'

type HeadingItem = {
  id: string
  level: 1 | 2 | 3 | 4 | 5 | 6
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  text: string
}

type HeadingIssue = {
  severity: SeoSeverity
  message: string
}

function extractHeadings(): Array<HeadingItem> {
  const nodes = Array.from(
    document.body.querySelectorAll<HTMLHeadingElement>('h1,h2,h3,h4,h5,h6'),
  )

  return nodes.map((node, index) => {
    const tag = node.tagName.toLowerCase() as HeadingItem['tag']
    const level = Number(tag[1]) as HeadingItem['level']

    return {
      id: node.id || `heading-${index}`,
      level,
      tag,
      text: node.textContent?.trim() || '',
    }
  })
}

function validateHeadings(headings: Array<HeadingItem>): Array<HeadingIssue> {
  if (headings.length === 0) {
    return [
      { severity: 'error', message: 'No heading tags found on this page.' },
    ]
  }

  const issues: Array<HeadingIssue> = []
  const h1Count = headings.filter((h) => h.level === 1).length
  if (h1Count === 0) {
    issues.push({
      severity: 'error',
      message: 'No H1 heading found on this page.',
    })
  } else if (h1Count > 1) {
    issues.push({
      severity: 'warning',
      message: `Multiple H1 headings detected (${h1Count}).`,
    })
  }

  if (headings[0] && headings[0].level !== 1) {
    issues.push({
      severity: 'warning',
      message: `First heading is ${headings[0].tag.toUpperCase()} instead of H1.`,
    })
  }

  for (let index = 0; index < headings.length; index++) {
    const current = headings[index]!
    if (!current.text) {
      issues.push({
        severity: 'warning',
        message: `${current.tag.toUpperCase()} is empty.`,
      })
    }
    if (index > 0) {
      const previous = headings[index - 1]!
      if (current.level - previous.level > 1) {
        issues.push({
          severity: 'warning',
          message: `Skipped heading level from ${previous.tag.toUpperCase()} to ${current.tag.toUpperCase()}.`,
        })
      }
    }
  }

  return issues
}

/**
 * Heading hierarchy issues and count for the SEO overview.
 */
export function getHeadingStructureSummary(): SeoSectionSummary {
  const headings = extractHeadings()
  const issues = validateHeadings(headings)
  return {
    issues,
    hint: `${headings.length} heading(s)`,
  }
}

const HEADING_LEVEL_COLORS: Record<number, string> = {
  1: '#60a5fa',
  2: '#34d399',
  3: '#a78bfa',
  4: '#f59e0b',
  5: '#f87171',
  6: '#94a3b8',
}

export function HeadingStructurePreviewSection() {
  const styles = useStyles()
  const headings = extractHeadings()
  const issues = validateHeadings(headings)

  return (
    <Section>
      <SectionDescription>
        Visualizes heading structure (`h1`-`h6`) in DOM order and highlights
        common hierarchy issues. This section scans once when opened.
      </SectionDescription>

      {/* Heading tree */}
      <div class={styles().serpPreviewBlock}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            'margin-bottom': '10px',
          }}
        >
          <div
            class={styles().serpPreviewLabel}
            style={{ 'margin-bottom': '0' }}
          >
            Heading tree
          </div>
          <span style={{ 'font-size': '11px', color: '#6b7280' }}>
            {headings.length} heading{headings.length === 1 ? '' : 's'}
          </span>
        </div>
        <Show
          when={headings.length > 0}
          fallback={
            <div class={styles().seoMissingTagsSection}>
              No headings found on this page.
            </div>
          }
        >
          <ul
            style={{
              margin: '0',
              padding: '0',
              'list-style': 'none',
              display: 'flex',
              'flex-direction': 'column',
              gap: '3px',
            }}
          >
            <For each={headings}>
              {(heading) => {
                const color = HEADING_LEVEL_COLORS[heading.level] ?? '#94a3b8'
                return (
                  <li
                    style={{
                      display: 'flex',
                      gap: '8px',
                      'align-items': 'baseline',
                      'padding-left': `${(heading.level - 1) * 14}px`,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'min-width': '26px',
                        height: '16px',
                        'border-radius': '3px',
                        'font-size': '10px',
                        'font-weight': '700',
                        'letter-spacing': '0.03em',
                        background: `${color}18`,
                        color,
                        'flex-shrink': '0',
                        'font-family': 'monospace',
                      }}
                    >
                      {heading.tag.toUpperCase()}
                    </span>
                    <span
                      class={styles().seoIssueText}
                      style={{
                        'font-size': '12px',
                        'font-style': heading.text ? 'normal' : 'italic',
                        opacity: heading.text ? 1 : 0.65,
                      }}
                    >
                      {heading.text || '(empty)'}
                    </span>
                  </li>
                )
              }}
            </For>
          </ul>
        </Show>
      </div>

      {/* Structure issues */}
      <Show when={issues.length > 0}>
        <div class={styles().serpPreviewBlock}>
          <div class={styles().serpPreviewLabel}>Structure issues</div>
          <ul class={styles().seoIssueList}>
            <For each={issues}>
              {(issue) => (
                <li class={styles().seoIssueRow}>
                  <span
                    class={styles().seoIssueBullet}
                    style={{ color: seoSeverityColor(issue.severity) }}
                  >
                    ●
                  </span>
                  <span class={styles().seoIssueMessage}>{issue.message}</span>
                  <span
                    class={styles().seoIssueSeverityBadge}
                    style={{ color: seoSeverityColor(issue.severity) }}
                  >
                    {issue.severity}
                  </span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </Section>
  )
}
