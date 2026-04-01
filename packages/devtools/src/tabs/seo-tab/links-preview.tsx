import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { pickSeverityClass, type SeoSeverity } from './seo-severity'
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

/** Display order in the links report: internal, external, non-web, then invalid. */
const LINK_KIND_DISPLAY_ORDER: Record<LinkKind, number> = {
  internal: 0,
  external: 1,
  'non-web': 2,
  invalid: 3,
}

export function sortLinksForDisplay(links: Array<LinkRow>): Array<LinkRow> {
  return [...links].sort(
    (a, b) => LINK_KIND_DISPLAY_ORDER[a.kind] - LINK_KIND_DISPLAY_ORDER[b.kind],
  )
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

const KIND_LABEL: Record<LinkKind, string> = {
  internal: 'Internal',
  external: 'External',
  'non-web': 'Non-web',
  invalid: 'Invalid',
}

function linkKindBadgeClass(
  s: ReturnType<ReturnType<typeof useStyles>>,
  kind: LinkKind,
): string {
  switch (kind) {
    case 'internal':
      return `${s.seoLinkKindBadge} ${s.seoLinkKindInternal}`
    case 'external':
      return `${s.seoLinkKindBadge} ${s.seoLinkKindExternal}`
    case 'non-web':
      return `${s.seoLinkKindBadge} ${s.seoLinkKindNonWeb}`
    case 'invalid':
      return `${s.seoLinkKindBadge} ${s.seoLinkKindInvalid}`
  }
}

export function LinksPreviewSection() {
  const styles = useStyles()
  const links = analyzeLinks()
  const linksForReport = sortLinksForDisplay(links)
  const issueCount = links.reduce((count, row) => count + row.issues.length, 0)

  const counts = links.reduce(
    (acc, row) => {
      acc[row.kind] += 1
      return acc
    },
    { internal: 0, external: 0, 'non-web': 0, invalid: 0 } as Record<LinkKind, number>,
  )

  const s = styles()
  const bulletSev = (sev: SeoSeverity) =>
    pickSeverityClass(sev, {
      error: s.seoIssueBulletError,
      warning: s.seoIssueBulletWarning,
      info: s.seoIssueBulletInfo,
    })

  return (
    <Section>
      <SectionDescription>
        Scans page links and reports link details including internal/external
        classification, URL quality, and common SEO/security flags.
      </SectionDescription>

      <div class={s.serpPreviewBlock}>
        <div class={s.serpPreviewLabel}>Links summary</div>
        <div class={s.seoChipRow}>
          <span class={`${s.seoPill} ${s.seoPillMuted}`}>{links.length} total</span>
          <span class={`${s.seoPill} ${s.seoPillInternal}`}>
            {counts.internal} internal
          </span>
          <span class={`${s.seoPill} ${s.seoPillBlue}`}>
            {counts.external} external
          </span>
          <Show when={counts['non-web'] > 0}>
            <span class={`${s.seoPill} ${s.seoPillAmber}`}>
              {counts['non-web']} non-web
            </span>
          </Show>
          <Show when={counts.invalid > 0}>
            <span class={`${s.seoPill} ${s.seoPillRed}`}>
              {counts.invalid} invalid
            </span>
          </Show>
          <Show when={issueCount > 0}>
            <span class={`${s.seoPill} ${s.seoPillAmber}`}>
              {issueCount} issue{issueCount === 1 ? '' : 's'}
            </span>
          </Show>
        </div>
      </div>

      <Show
        when={links.length > 0}
        fallback={
          <div class={s.seoMissingTagsSection}>No links found on this page.</div>
        }
      >
        <div class={s.serpPreviewBlock}>
          <div class={s.serpPreviewLabel}>Links report</div>
          <ul class={s.seoLinksReportList}>
            <For each={linksForReport}>
              {(row) => (
                <li class={s.seoLinksReportItem}>
                  <div class={s.seoLinksReportTopRow}>
                    <span class={linkKindBadgeClass(s, row.kind)}>
                      {KIND_LABEL[row.kind]}
                    </span>
                    <span class={s.seoLinksAnchorText}>
                      {row.text || '(no text)'}
                    </span>
                  </div>
                  <div class={s.seoLinksHrefLine}>{row.resolvedHref || row.href}</div>
                  <Show when={row.issues.length > 0}>
                    <ul class={s.seoIssueListNested}>
                      <For each={row.issues}>
                        {(issue) => (
                          <li class={s.seoIssueRowCompact}>
                            <span
                              class={`${s.seoIssueBullet} ${bulletSev(issue.severity)}`}
                            >
                              ●
                            </span>
                            <span class={s.seoIssueMessage}>{issue.message}</span>
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
