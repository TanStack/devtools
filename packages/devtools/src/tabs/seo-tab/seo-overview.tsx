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
  countBySeverity,
  sectionHealthScore,
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

function sectionStatusPhrase(severity: SeoSeverity | null): string {
  if (severity === null) return 'No blocking issues'
  if (severity === 'error') return 'Has errors'
  if (severity === 'warning') return 'Has warnings'
  return 'Info only'
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

function lerpByte(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

/** Red → amber → green (Lighthouse-style) for the ring stroke. */
function scoreToRingColor(score: number): string {
  const s = Math.max(0, Math.min(100, score))
  const red = { r: 255, g: 78, b: 66 }
  const amber = { r: 255, g: 164, b: 0 }
  const green = { r: 12, g: 206, b: 107 }
  if (s <= 50) {
    const t = s / 50
    return `rgb(${lerpByte(red.r, amber.r, t)},${lerpByte(red.g, amber.g, t)},${lerpByte(red.b, amber.b, t)})`
  }
  const t = (s - 50) / 50
  return `rgb(${lerpByte(amber.r, green.r, t)},${lerpByte(amber.g, green.g, t)},${lerpByte(amber.b, green.b, t)})`
}

function SeoSubsectionScoreRing(props: { score: number }) {
  const styles = useStyles()
  const s = styles()
  const score = Math.max(0, Math.min(100, props.score))
  const size = 36
  const stroke = 3
  const r = (size - stroke) / 2 - 0.25
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const arcLength = (score / 100) * circumference
  const strokeColor = scoreToRingColor(score)
  const label = String(Math.round(score))

  return (
    <span
      class={s.seoOverviewScoreRingWrap}
      aria-hidden="true"
      title={`${Math.round(score)} out of 100`}
    >
      <svg
        class={s.seoOverviewScoreRingSvg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          class={s.seoOverviewScoreRingTrack}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          stroke-width={stroke}
          stroke-linecap="round"
          stroke-dasharray={`${arcLength} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          class={s.seoOverviewScoreRingLabel}
          x={cx}
          y={cy}
          dominant-baseline="central"
          text-anchor="middle"
        >
          {label}
        </text>
      </svg>
    </span>
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

  const healthFillClass = (score: number) => {
    const s = styles()
    const tier = seoHealthTier(score)
    const tierFill =
      tier === 'good'
        ? s.seoHealthFillGood
        : tier === 'fair'
          ? s.seoHealthFillFair
          : s.seoHealthFillPoor
    return `${s.seoHealthFill} ${tierFill}`
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
        Indexability, URL signals, and a combined read on the other SEO panels.
        Use the list below to jump straight into a subsection.
      </SectionDescription>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Overall health</div>
        <div class={styles().seoHealthHeaderRow}>
          <span class={styles().seoHealthLabelMuted}>{bundle().health.label}</span>
          <span class={healthScoreClass(bundle().health.score)}>
            {bundle().health.score}%
          </span>
        </div>
        <div
          class={styles().seoHealthTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(bundle().health.score)}
          aria-label={`Overall SEO health ${Math.round(bundle().health.score)} percent`}
        >
          <div
            class={healthFillClass(bundle().health.score)}
            style={{ width: `${Math.min(100, Math.max(0, bundle().health.score))}%` }}
          />
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
        <div class={styles().serpPreviewLabel}>Subsections</div>
        <p class={styles().seoOverviewCheckListCaption}>
          Ring score matches overall SEO math (errors / warnings / info). Counts
          on the right are raw totals for that panel.
        </p>
        <div class={styles().seoOverviewCheckList}>
          <For each={bundle().rows}>
            {(row) => {
              const sev = worstSeverity(row.summary.issues)
              const c = countBySeverity(row.summary.issues)
              const subsectionScore = sectionHealthScore(row.summary.issues)
              const totalIssues =
                row.summary.issueCount ?? row.summary.issues.length
              const cappedSuffix =
                row.summary.issueCount != null &&
                row.summary.issueCount > row.summary.issues.length
                  ? ` (${row.summary.issues.length} of ${row.summary.issueCount} listed)`
                  : ''
              const issueLine =
                totalIssues === 0
                  ? 'No issues'
                  : `${totalIssues} issue${totalIssues === 1 ? '' : 's'}${cappedSuffix}`
              const metaLine = row.summary.hint
                ? `${row.summary.hint} · ${issueLine}`
                : issueLine
              const ariaBits = [
                `${row.title}. Score ${Math.round(subsectionScore)} out of 100.`,
                sectionStatusPhrase(sev) + '.',
                metaLine,
                `${c.error} errors, ${c.warning} warnings, ${c.info} info.`,
                'Open subsection.',
              ]
              return (
                <button
                  type="button"
                  aria-label={ariaBits.join(' ')}
                  class={styles().seoOverviewCheckRow}
                  onClick={() => props.goTo(row.id)}
                >
                  <SeoSubsectionScoreRing score={subsectionScore} />
                  <span class={styles().seoOverviewCheckBody}>
                    <span class={styles().seoOverviewCheckTitle}>{row.title}</span>
                    <span class={styles().seoOverviewCheckMeta}>{metaLine}</span>
                  </span>
                  <span
                    class={styles().seoOverviewCheckCounts}
                    aria-hidden="true"
                  >
                    <span
                      class={
                        c.error > 0
                          ? styles().seoOverviewCheckNError
                          : styles().seoOverviewCheckNZero
                      }
                    >
                      {c.error}
                    </span>
                    <span class={styles().seoOverviewCheckNSep}>/</span>
                    <span
                      class={
                        c.warning > 0
                          ? styles().seoOverviewCheckNWarn
                          : styles().seoOverviewCheckNZero
                      }
                    >
                      {c.warning}
                    </span>
                    <span class={styles().seoOverviewCheckNSep}>/</span>
                    <span
                      class={
                        c.info > 0
                          ? styles().seoOverviewCheckNInfo
                          : styles().seoOverviewCheckNZero
                      }
                    >
                      {c.info}
                    </span>
                  </span>
                  <span class={styles().seoOverviewCheckChevron} aria-hidden="true">
                    ›
                  </span>
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </Section>
  )
}
