import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { seoSeverityColor, type SeoSeverity } from './seo-severity'

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
    return [{ severity: 'error', message: 'No heading tags found on this page.' }]
  }

  const issues: Array<HeadingIssue> = []
  const h1Count = headings.filter((h) => h.level === 1).length
  if (h1Count === 0) {
    issues.push({ severity: 'error', message: 'No H1 heading found on this page.' })
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

  if (issues.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Heading hierarchy looks healthy.',
    })
  }

  return issues
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
      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>
          Total headings: {headings.length}
        </div>
        <Show
          when={headings.length > 0}
          fallback={
            <div class={styles().seoMissingTagsSection}>
              No headings found on this page.
            </div>
          }
        >
          <ul class={styles().serpErrorList} style={{ 'list-style': 'none', padding: '0' }}>
            <For each={headings}>
              {(heading) => (
                <li
                  style={{
                    display: 'flex',
                    gap: '8px',
                    'align-items': 'baseline',
                    'margin-top': '6px',
                    'padding-left': `${(heading.level - 1) * 12}px`,
                  }}
                >
                  <strong>{heading.tag.toUpperCase()}</strong>
                  <span>{heading.text || '(empty heading)'}</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Structure issues</div>
        <ul class={styles().serpErrorList}>
          <For each={issues}>
            {(issue) => (
              <li style={{ color: seoSeverityColor(issue.severity), 'margin-top': '4px' }}>
                [{issue.severity}] {issue.message}
              </li>
            )}
          </For>
        </ul>
      </div>
    </Section>
  )
}
