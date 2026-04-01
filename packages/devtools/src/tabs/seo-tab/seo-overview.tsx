import { For, Show, createMemo, createSignal } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useHeadChanges } from '../../hooks/use-head-changes'
import { useStyles } from '../../styles/use-styles'
import { getCanonicalPageData } from './canonical-url-data'
import { getSocialPreviewsSummary } from './social-previews'
import { getSerpPreviewSummary } from './serp-preview'
import { getJsonLdPreviewSummary } from './json-ld-preview'
import { getHeadingStructureSummary } from './heading-structure-preview'
import { getLinksPreviewSummary } from './links-preview'
import {
  aggregateSeoHealth,
  worstSeverity,
  type SeoDetailView,
  type SeoSectionSummary,
} from './seo-section-summary'
import {
  pickSeverityClass,
  seoHealthTier,
  type SeoSeverity,
} from './seo-severity'

type OverviewRow = {
  id: SeoDetailView
  title: string
  summary: SeoSectionSummary
}

function severityGlyph(severity: SeoSeverity | null): string {
  if (severity === 'error') return '✕'
  if (severity === 'warning') return '!'
  if (severity === 'info') return 'i'
  return '✓'
}

function MetaRow(props: { label: string; value: string }) {
  const styles = useStyles()
  return (
    <div class={styles().seoMetaRow}>
      <span class={styles().seoMetaRowLabel}>{props.label}</span>
      <span class={styles().seoMetaRowValue}>{props.value}</span>
    </div>
  )
}

export function SeoOverviewSection(props: { goTo: (view: SeoDetailView) => void }) {
  const styles = useStyles()
  const [tick, setTick] = createSignal(0)

  useHeadChanges(() => {
    setTick((t) => t + 1)
  })

  const bundle = createMemo(() => {
    void tick()
    const canonical = getCanonicalPageData()
    const social = getSocialPreviewsSummary()
    const serp = getSerpPreviewSummary()
    const jsonLd = getJsonLdPreviewSummary()
    const headings = getHeadingStructureSummary()
    const links = getLinksPreviewSummary()

    const rows: Array<OverviewRow> = [
      { id: 'social-previews', title: 'Social previews', summary: social },
      { id: 'serp-preview', title: 'SERP preview', summary: serp },
      { id: 'json-ld-preview', title: 'JSON-LD', summary: jsonLd },
      { id: 'heading-structure', title: 'Heading structure', summary: headings },
      { id: 'links-preview', title: 'Links', summary: links },
    ]

    const canonicalSummary: SeoSectionSummary = {
      issues: canonical.issues,
      hint: canonical.indexable ? 'Indexable' : 'Noindex',
    }

    const health = aggregateSeoHealth([
      canonicalSummary,
      social,
      serp,
      jsonLd,
      headings,
      links,
    ])

    return { canonical, rows, health }
  })

  const healthScoreClass = (score: number) => {
    const s = styles()
    const tier = seoHealthTier(score)
    return tier === 'good'
      ? s.seoHealthScoreGood
      : tier === 'fair'
        ? s.seoHealthScoreFair
        : s.seoHealthScorePoor
  }

  const healthRectClass = (score: number) => {
    const s = styles()
    const tier = seoHealthTier(score)
    return tier === 'good'
      ? s.seoHealthRectGood
      : tier === 'fair'
        ? s.seoHealthRectFair
        : s.seoHealthRectPoor
  }

  const sectionIconClass = (sev: SeoSeverity | null) => {
    const s = styles()
    if (sev === null) return `${s.seoOverviewSectionIcon} ${s.seoOverviewSectionIconPass}`
    return `${s.seoOverviewSectionIcon} ${pickSeverityClass(sev, {
      error: s.seoOverviewSectionIconError,
      warning: s.seoOverviewSectionIconWarn,
      info: s.seoOverviewSectionIconInfo,
    })}`
  }

  const issueBulletClass = (sev: SeoSeverity) => {
    const s = styles()
    return `${s.seoIssueBullet} ${pickSeverityClass(sev, {
      error: s.seoIssueBulletError,
      warning: s.seoIssueBulletWarning,
      info: s.seoIssueBulletInfo,
    })}`
  }

  const issueBadgeClass = (sev: SeoSeverity) => {
    const s = styles()
    return `${s.seoIssueSeverityBadge} ${pickSeverityClass(sev, {
      error: s.seoIssueSeverityBadgeError,
      warning: s.seoIssueSeverityBadgeWarning,
      info: s.seoIssueSeverityBadgeInfo,
    })}`
  }

  return (
    <Section>
      <SectionDescription>
        Quick check for indexability, URL signals, and a roll-up of every SEO
        subsection. Open a row to inspect and fix details.
      </SectionDescription>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Overall health</div>
        <div class={styles().seoHealthHeaderRow}>
          <span class={styles().seoHealthLabelMuted}>{bundle().health.label}</span>
          <span class={healthScoreClass(bundle().health.score)}>
            {bundle().health.score}%
          </span>
        </div>
        <div class={styles().seoHealthTrack}>
          <svg
            class={styles().seoHealthBarSvg}
            viewBox="0 0 100 5"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              class={healthRectClass(bundle().health.score)}
              x="0"
              y="0"
              width={Math.min(100, Math.max(0, bundle().health.score))}
              height="5"
              rx="2.5"
            />
          </svg>
        </div>
        <div class={styles().seoHealthCountsRow}>
          <span class={styles().seoHealthCountError}>
            {bundle().health.counts.error} error{bundle().health.counts.error === 1 ? '' : 's'}
          </span>
          <span class={styles().seoHealthCountWarning}>
            {bundle().health.counts.warning} warning
            {bundle().health.counts.warning === 1 ? '' : 's'}
          </span>
          <span class={styles().seoHealthCountInfo}>
            {bundle().health.counts.info} info
          </span>
        </div>
      </div>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Indexability & URL</div>
        <div class={styles().seoOverviewPillsRow}>
          <span
            class={
              bundle().canonical.indexable
                ? styles().seoPillStatusOk
                : styles().seoPillStatusBad
            }
          >
            ● {bundle().canonical.indexable ? 'Indexable' : 'Noindex'}
          </span>
          <span
            class={
              bundle().canonical.follow
                ? styles().seoPillStatusOk
                : styles().seoPillStatusWarn
            }
          >
            ● {bundle().canonical.follow ? 'Follow' : 'Nofollow'}
          </span>
          <span class={styles().seoPillMetaCount}>
            {bundle().canonical.canonicalRaw.length} canonical tag
            {bundle().canonical.canonicalRaw.length === 1 ? '' : 's'}
          </span>
        </div>
        <MetaRow label="Current URL" value={bundle().canonical.currentUrl} />
        <MetaRow
          label="Canonical"
          value={
            bundle().canonical.canonicalResolved.join(', ') ||
            bundle().canonical.canonicalRaw.join(', ') ||
            'None'
          }
        />
        <MetaRow
          label="Robots directives"
          value={bundle().canonical.robots.join(', ') || 'None'}
        />
        <div class={styles().seoOverviewFootnote}>
          X-Robots-Tag response headers are not available in this in-page view.
        </div>
      </div>

      <Show when={bundle().canonical.issues.length > 0}>
        <div class={styles().serpPreviewBlock}>
          <div class={styles().serpPreviewLabel}>URL & robots issues</div>
          <ul class={styles().seoIssueList}>
            <For each={bundle().canonical.issues}>
              {(issue) => (
                <li class={styles().seoIssueRow}>
                  <span class={issueBulletClass(issue.severity)}>●</span>
                  <span class={styles().seoIssueMessage}>{issue.message}</span>
                  <span class={issueBadgeClass(issue.severity)}>{issue.severity}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Sections</div>
        <div class={styles().seoOverviewSectionList}>
          <For each={bundle().rows}>
            {(row) => {
              const sev = () => worstSeverity(row.summary.issues)
              const issueLine = () => {
                const total = row.summary.issueCount ?? row.summary.issues.length
                const capped = row.summary.issueCount != null
                if (total === 0) return 'No issues'
                const suffix =
                  capped && row.summary.issueCount! > row.summary.issues.length
                    ? ` (${row.summary.issues.length} of ${row.summary.issueCount} shown)`
                    : ''
                return `${total} issue${total === 1 ? '' : 's'}${suffix}`
              }
              return (
                <button
                  type="button"
                  aria-label={`Open ${row.title} for details`}
                  class={styles().seoOverviewSectionButton}
                  onClick={() => props.goTo(row.id)}
                >
                  <span class={sectionIconClass(sev())} aria-hidden="true">
                    {severityGlyph(sev())}
                  </span>
                  <span class={styles().seoOverviewSectionBody}>
                    <div class={styles().seoOverviewSectionTitle}>{row.title}</div>
                    <div class={styles().seoOverviewSectionHint}>
                      {row.summary.hint ? `${row.summary.hint} · ` : ''}
                      {issueLine()}
                    </div>
                  </span>
                  <span class={styles().seoOverviewSectionChevron}>›</span>
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </Section>
  )
}
