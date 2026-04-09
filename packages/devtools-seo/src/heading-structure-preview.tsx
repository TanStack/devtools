import { For, Show, createMemo, createSignal } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useSeoStyles } from './use-seo-styles'
import { pickSeverityClass } from './seo-severity'
import { useLocationChanges } from './hooks/use-location-changes'
import type { SeoSeverity } from './seo-severity'
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
      text: node.textContent.trim() || '',
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
      severity: 'error',
      message: `Multiple H1 headings detected (${h1Count}).`,
    })
  }

  if (headings[0] && headings[0].level !== 1) {
    issues.push({
      severity: 'error',
      message: `First heading is ${headings[0].tag.toUpperCase()} instead of H1.`,
    })
  }

  for (let index = 0; index < headings.length; index++) {
    const current = headings[index]!
    if (!current.text) {
      issues.push({
        severity: 'error',
        message: `${current.tag.toUpperCase()} is empty.`,
      })
    }
    if (index > 0) {
      const previous = headings[index - 1]!
      if (current.level - previous.level > 1) {
        issues.push({
          severity: 'error',
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

function headingIndentClass(
  s: ReturnType<ReturnType<typeof useSeoStyles>>,
  level: HeadingItem['level'],
): string {
  switch (level) {
    case 1:
      return s.seoHeadingTreeIndent1
    case 2:
      return s.seoHeadingTreeIndent2
    case 3:
      return s.seoHeadingTreeIndent3
    case 4:
      return s.seoHeadingTreeIndent4
    case 5:
      return s.seoHeadingTreeIndent5
    case 6:
      return s.seoHeadingTreeIndent6
  }
}

function headingTagClass(
  s: ReturnType<ReturnType<typeof useSeoStyles>>,
  level: HeadingItem['level'],
): string {
  const base = s.seoHeadingTag
  switch (level) {
    case 1:
      return `${base} ${s.seoHeadingTagL1}`
    case 2:
      return `${base} ${s.seoHeadingTagL2}`
    case 3:
      return `${base} ${s.seoHeadingTagL3}`
    case 4:
      return `${base} ${s.seoHeadingTagL4}`
    case 5:
      return `${base} ${s.seoHeadingTagL5}`
    case 6:
      return `${base} ${s.seoHeadingTagL6}`
  }
}

export function HeadingStructurePreviewSection() {
  const styles = useSeoStyles()
  const [tick, setTick] = createSignal(0)

  useLocationChanges(() => {
    setTick((t) => t + 1)
  })

  const headings = createMemo(() => {
    void tick()
    return extractHeadings()
  })

  const issues = createMemo(() => validateHeadings(headings()))
  const s = styles()

  const issueBulletClass = (sev: SeoSeverity) =>
    `${s.seoIssueBullet} ${pickSeverityClass(sev, {
      error: s.seoIssueBulletError,
      warning: s.seoIssueBulletWarning,
      info: s.seoIssueBulletInfo,
    })}`

  const issueBadgeClass = (sev: SeoSeverity) =>
    `${s.seoIssueSeverityBadge} ${pickSeverityClass(sev, {
      error: s.seoIssueSeverityBadgeError,
      warning: s.seoIssueSeverityBadgeWarning,
      info: s.seoIssueSeverityBadgeInfo,
    })}`

  return (
    <Section>
      <SectionDescription>
        Visualizes heading structure (`h1`-`h6`) in DOM order and highlights
        common hierarchy issues. This section scans once when opened.
      </SectionDescription>

      <div class={s.serpPreviewBlock}>
        <div class={s.seoHeadingTreeHeaderRow}>
          <div class={s.serpPreviewLabelFlat}>Heading tree</div>
          <span class={s.seoHeadingTreeCount}>
            {headings().length} heading{headings().length === 1 ? '' : 's'}
          </span>
        </div>
        <Show
          when={headings().length > 0}
          fallback={
            <div class={s.seoMissingTagsSection}>
              No headings found on this page.
            </div>
          }
        >
          <ul class={s.seoHeadingTreeList}>
            <For each={headings()}>
              {(heading) => (
                <li
                  class={`${s.seoHeadingTreeItem} ${headingIndentClass(s, heading.level)}`}
                >
                  <span class={headingTagClass(s, heading.level)}>
                    {heading.tag.toUpperCase()}
                  </span>
                  <span
                    class={
                      heading.text
                        ? s.seoHeadingLineText
                        : s.seoHeadingLineTextEmpty
                    }
                  >
                    {heading.text || '(empty)'}
                  </span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      <Show when={issues().length > 0}>
        <div class={s.serpPreviewBlock}>
          <div class={s.serpPreviewLabel}>Structure issues</div>
          <ul class={s.seoIssueList}>
            <For each={issues()}>
              {(issue) => (
                <li class={s.seoIssueRow}>
                  <span class={issueBulletClass(issue.severity)}>●</span>
                  <span class={s.seoIssueMessage}>{issue.message}</span>
                  <span class={issueBadgeClass(issue.severity)}>
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
