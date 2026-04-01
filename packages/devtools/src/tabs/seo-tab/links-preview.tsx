import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { seoSeverityColor, type SeoSeverity } from './seo-severity'
import type { SeoSectionSummary } from './seo-section-summary'

type LinkKind = 'internal' | 'external' | 'non-web' | 'invalid'

type LinkIssue = {
  severity: SeoSeverity
  message: string
}

type LinkRow = {
  text: string
  href: string
  resolvedHref: string | null
  kind: LinkKind
  issues: Array<LinkIssue>
}

function classifyLink(anchor: HTMLAnchorElement): LinkRow {
  const href = anchor.getAttribute('href')?.trim() || ''
  const text =
    anchor.textContent?.trim() ||
    anchor.getAttribute('aria-label')?.trim() ||
    anchor.getAttribute('title')?.trim() ||
    ''
  const issues: Array<LinkIssue> = []

  if (!text) {
    issues.push({
      severity: 'error',
      message: 'Missing link text or accessible label.',
    })
  }

  if (/^\s*javascript:/i.test(href)) {
    issues.push({ severity: 'error', message: 'Uses javascript: URL.' })
    return { text, href, resolvedHref: null, kind: 'invalid', issues }
  }

  if (href.startsWith('#')) {
    return { text, href, resolvedHref: null, kind: 'non-web', issues }
  }

  let resolved: URL | null = null
  try {
    resolved = new URL(href, window.location.href)
  } catch {
    issues.push({ severity: 'error', message: 'Invalid URL format.' })
    return { text, href, resolvedHref: null, kind: 'invalid', issues }
  }

  const protocol = resolved.protocol.toLowerCase()
  if (protocol === 'mailto:' || protocol === 'tel:') {
    issues.push({
      severity: 'info',
      message: `Non-web link protocol (${protocol}).`,
    })
    return { text, href, resolvedHref: resolved.href, kind: 'non-web', issues }
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    issues.push({
      severity: 'warning',
      message: `Unexpected protocol (${protocol}).`,
    })
    return { text, href, resolvedHref: resolved.href, kind: 'non-web', issues }
  }

  const isExternal = resolved.origin !== window.location.origin
  if (isExternal) {
    const target = (anchor.getAttribute('target') || '').toLowerCase()
    const relTokens = (anchor.getAttribute('rel') || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    if (target === '_blank' && !relTokens.includes('noopener')) {
      issues.push({
        severity: 'warning',
        message: 'External _blank link should include rel="noopener".',
      })
    }
    if (!relTokens.includes('nofollow')) {
      issues.push({
        severity: 'info',
        message: 'External link does not include nofollow.',
      })
    }
  }

  return {
    text,
    href,
    resolvedHref: resolved.href,
    kind: isExternal ? 'external' : 'internal',
    issues,
  }
}

const LINK_SUMMARY_ISSUE_CAP = 32

export function analyzeLinks(): Array<LinkRow> {
  const anchors = Array.from(
    document.body.querySelectorAll<HTMLAnchorElement>('a[href]'),
  )
  return anchors
    .filter(
      (anchor) =>
        !anchor.closest('[data-testid="tanstack_devtools"]') &&
        !anchor.closest('[data-devtools-root]'),
    )
    .map(classifyLink)
}

/**
 * Link-level issues (capped) and totals for the SEO overview.
 */
export function getLinksPreviewSummary(): SeoSectionSummary {
  const links = analyzeLinks()
  const allIssues = links.flatMap((row) => row.issues)
  return {
    issues: allIssues.slice(0, LINK_SUMMARY_ISSUE_CAP),
    issueCount: allIssues.length,
    hint: `${links.length} link(s)`,
  }
}

const KIND_BADGE: Record<LinkKind, { label: string; color: string }> = {
  internal: { label: 'Internal', color: '#6b7280' },
  external: { label: 'External', color: '#3b82f6' },
  'non-web': { label: 'Non-web', color: '#d97706' },
  invalid: { label: 'Invalid', color: '#dc2626' },
}

export function LinksPreviewSection() {
  const styles = useStyles()
  const links = analyzeLinks()
  const issueCount = links.reduce((count, row) => count + row.issues.length, 0)

  const counts = links.reduce(
    (acc, row) => {
      acc[row.kind] += 1
      return acc
    },
    { internal: 0, external: 0, 'non-web': 0, invalid: 0 } as Record<LinkKind, number>,
  )

  return (
    <Section>
      <SectionDescription>
        Scans page links and reports link details including internal/external
        classification, URL quality, and common SEO/security flags.
      </SectionDescription>

      {/* Summary stats */}
      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Links summary</div>
        <div style={{ display: 'flex', gap: '6px', 'flex-wrap': 'wrap' }}>
          <span
            style={{
              padding: '2px 8px',
              'border-radius': '999px',
              'font-size': '11px',
              'font-weight': '500',
              background: '#37415118',
              color: '#9ca3af',
            }}
          >
            {links.length} total
          </span>
          <span
            style={{
              padding: '2px 8px',
              'border-radius': '999px',
              'font-size': '11px',
              'font-weight': '500',
              background: '#6b728018',
              color: '#6b7280',
            }}
          >
            {counts.internal} internal
          </span>
          <span
            style={{
              padding: '2px 8px',
              'border-radius': '999px',
              'font-size': '11px',
              'font-weight': '500',
              background: '#3b82f618',
              color: '#3b82f6',
            }}
          >
            {counts.external} external
          </span>
          <Show when={counts['non-web'] > 0}>
            <span
              style={{
                padding: '2px 8px',
                'border-radius': '999px',
                'font-size': '11px',
                'font-weight': '500',
                background: '#d9770618',
                color: '#d97706',
              }}
            >
              {counts['non-web']} non-web
            </span>
          </Show>
          <Show when={counts.invalid > 0}>
            <span
              style={{
                padding: '2px 8px',
                'border-radius': '999px',
                'font-size': '11px',
                'font-weight': '500',
                background: '#dc262618',
                color: '#dc2626',
              }}
            >
              {counts.invalid} invalid
            </span>
          </Show>
          <Show when={issueCount > 0}>
            <span
              style={{
                padding: '2px 8px',
                'border-radius': '999px',
                'font-size': '11px',
                'font-weight': '500',
                background: '#d9770618',
                color: '#d97706',
              }}
            >
              {issueCount} issue{issueCount === 1 ? '' : 's'}
            </span>
          </Show>
        </div>
      </div>

      {/* Links list */}
      <Show
        when={links.length > 0}
        fallback={
          <div class={styles().seoMissingTagsSection}>No links found on this page.</div>
        }
      >
        <div class={styles().serpPreviewBlock}>
          <div class={styles().serpPreviewLabel}>Links report</div>
          <ul style={{ margin: '0', padding: '0', 'list-style': 'none', display: 'flex', 'flex-direction': 'column', gap: '0' }}>
            <For each={links}>
              {(row, index) => {
                const badge = KIND_BADGE[row.kind]
                return (
                  <li
                    style={{
                      padding: '8px 0',
                      'border-bottom': index() < links.length - 1 ? '1px solid #1f2937' : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '8px',
                        'margin-bottom': '2px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          'align-items': 'center',
                          padding: '1px 6px',
                          'border-radius': '3px',
                          'font-size': '10px',
                          'font-weight': '600',
                          'letter-spacing': '0.03em',
                          background: `${badge.color}18`,
                          color: badge.color,
                          'flex-shrink': '0',
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        class={styles().seoIssueText}
                        style={{
                          'font-size': '12px',
                          'font-weight': '500',
                          overflow: 'hidden',
                          'white-space': 'nowrap',
                          'text-overflow': 'ellipsis',
                        }}
                      >
                        {row.text || '(no text)'}
                      </span>
                    </div>
                    <div
                      style={{
                        'font-size': '11px',
                        color: '#6b7280',
                        overflow: 'hidden',
                        'white-space': 'nowrap',
                        'text-overflow': 'ellipsis',
                        'padding-left': '2px',
                      }}
                    >
                      {row.resolvedHref || row.href}
                    </div>
                    <Show when={row.issues.length > 0}>
                      <ul class={styles().seoIssueListNested}>
                        <For each={row.issues}>
                          {(issue) => (
                            <li class={styles().seoIssueRowCompact}>
                              <span
                                class={styles().seoIssueBullet}
                                style={{ color: seoSeverityColor(issue.severity) }}
                              >
                                ●
                              </span>
                              <span class={styles().seoIssueMessage}>{issue.message}</span>
                            </li>
                          )}
                        </For>
                      </ul>
                    </Show>
                  </li>
                )
              }}
            </For>
          </ul>
        </div>
      </Show>
    </Section>
  )
}
