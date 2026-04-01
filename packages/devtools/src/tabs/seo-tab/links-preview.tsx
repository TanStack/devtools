import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { seoSeverityColor, type SeoSeverity } from './seo-severity'

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

function analyzeLinks(): Array<LinkRow> {
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

export function LinksPreviewSection() {
  const styles = useStyles()
  const links = analyzeLinks()
  const issueCount = links.reduce((count, row) => count + row.issues.length, 0)

  const counts = links.reduce(
    (acc, row) => {
      acc[row.kind] += 1
      return acc
    },
    { internal: 0, external: 0, 'non-web': 0, invalid: 0 } as Record<
      LinkKind,
      number
    >,
  )

  return (
    <Section>
      <SectionDescription>
        Scans page links and reports link details including internal/external
        classification, URL quality, and common SEO/security flags.
      </SectionDescription>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Links summary</div>
        <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
          <span>Total: {links.length}</span>
          <span>Internal: {counts.internal}</span>
          <span>External: {counts.external}</span>
          <span>Non-web: {counts['non-web']}</span>
          <span>Invalid: {counts.invalid}</span>
          <Show when={issueCount > 0}>
            <span>Issues: {issueCount}</span>
          </Show>
        </div>
      </div>

      <Show
        when={links.length > 0}
        fallback={
          <div class={styles().seoMissingTagsSection}>
            No links found on this page.
          </div>
        }
      >
        <div class={styles().serpPreviewBlock}>
          <div class={styles().serpPreviewLabel}>Links report</div>
          <ul
            class={styles().serpErrorList}
            style={{ 'list-style': 'none', padding: '0' }}
          >
            <For each={links}>
              {(row) => (
                <li
                  style={{ 'margin-bottom': '12px', 'padding-bottom': '8px' }}
                >
                  <div>
                    <strong>{row.text || '(no text)'}</strong> - {row.kind}
                  </div>
                  <div style={{ 'font-size': '12px', color: '#9ca3af' }}>
                    {row.resolvedHref || row.href}
                  </div>
                  <Show when={row.issues.length > 0}>
                    <ul class={styles().serpErrorList}>
                      <For each={row.issues}>
                        {(issue) => (
                          <li
                            style={{ color: seoSeverityColor(issue.severity) }}
                          >
                            [{issue.severity}] {issue.message}
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </Section>
  )
}
