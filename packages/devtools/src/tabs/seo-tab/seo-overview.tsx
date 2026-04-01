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
import { seoSeverityColor, type SeoSeverity } from './seo-severity'

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

function healthBarColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
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

  return (
    <Section>
      <SectionDescription>
        Quick check for indexability, URL signals, and a roll-up of every SEO
        subsection. Open a row to inspect and fix details.
      </SectionDescription>

      {/* Overall health */}
      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Overall health</div>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '6px',
          }}
        >
          <span style={{ 'font-size': '12px', color: '#9ca3af' }}>
            {bundle().health.label}
          </span>
          <span
            style={{
              'font-size': '13px',
              'font-weight': '600',
              color: healthBarColor(bundle().health.score),
            }}
          >
            {bundle().health.score}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '5px',
            background: '#1f2937',
            'border-radius': '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${bundle().health.score}%`,
              height: '100%',
              background: healthBarColor(bundle().health.score),
              'border-radius': '999px',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            'margin-top': '8px',
            'font-size': '11px',
          }}
        >
          <span style={{ color: '#dc2626' }}>
            {bundle().health.counts.error} error{bundle().health.counts.error === 1 ? '' : 's'}
          </span>
          <span style={{ color: '#d97706' }}>
            {bundle().health.counts.warning} warning{bundle().health.counts.warning === 1 ? '' : 's'}
          </span>
          <span style={{ color: '#6b7280' }}>
            {bundle().health.counts.info} info
          </span>
        </div>
      </div>

      {/* Indexability & URL */}
      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Indexability & URL</div>
        <div style={{ display: 'flex', gap: '6px', 'margin-bottom': '10px', 'flex-wrap': 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              'align-items': 'center',
              gap: '4px',
              padding: '2px 8px',
              'border-radius': '999px',
              'font-size': '11px',
              'font-weight': '500',
              background: bundle().canonical.indexable ? '#16a34a18' : '#dc262618',
              color: bundle().canonical.indexable ? '#16a34a' : '#dc2626',
            }}
          >
            ● {bundle().canonical.indexable ? 'Indexable' : 'Noindex'}
          </span>
          <span
            style={{
              display: 'inline-flex',
              'align-items': 'center',
              gap: '4px',
              padding: '2px 8px',
              'border-radius': '999px',
              'font-size': '11px',
              'font-weight': '500',
              background: bundle().canonical.follow ? '#16a34a18' : '#d9770618',
              color: bundle().canonical.follow ? '#16a34a' : '#d97706',
            }}
          >
            ● {bundle().canonical.follow ? 'Follow' : 'Nofollow'}
          </span>
          <span
            style={{
              display: 'inline-flex',
              'align-items': 'center',
              padding: '2px 8px',
              'border-radius': '999px',
              'font-size': '11px',
              'font-weight': '500',
              background: '#37415118',
              color: '#9ca3af',
            }}
          >
            {bundle().canonical.canonicalRaw.length} canonical tag{bundle().canonical.canonicalRaw.length === 1 ? '' : 's'}
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
        <div style={{ 'margin-top': '8px', 'font-size': '11px', color: '#6b7280' }}>
          X-Robots-Tag response headers are not available in this in-page view.
        </div>
      </div>

      {/* URL & robots issues */}
      <Show when={bundle().canonical.issues.length > 0}>
        <div class={styles().serpPreviewBlock}>
          <div class={styles().serpPreviewLabel}>URL & robots issues</div>
          <ul class={styles().seoIssueList}>
            <For each={bundle().canonical.issues}>
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

      {/* Sections nav */}
      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Sections</div>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
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
                  onClick={() => props.goTo(row.id)}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                    width: '100%',
                    'text-align': 'left',
                    padding: '8px 10px',
                    border: '1px solid #1f2937',
                    'border-radius': '6px',
                    background: '#111827',
                    cursor: 'pointer',
                    color: '#e5e7eb',
                    'font-size': '13px',
                  }}
                >
                  <span
                    style={{
                      'flex-shrink': '0',
                      width: '20px',
                      height: '20px',
                      'border-radius': '4px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-size': '11px',
                      'font-weight': '700',
                      background: sev() ? `${seoSeverityColor(sev()!)}18` : '#16a34a18',
                      color: sev() ? seoSeverityColor(sev()!) : '#16a34a',
                    }}
                    aria-hidden="true"
                  >
                    {severityGlyph(sev())}
                  </span>
                  <span style={{ 'flex-grow': '1', 'min-width': '0' }}>
                    <div style={{ 'font-weight': '500', 'font-size': '13px' }}>{row.title}</div>
                    <div style={{ 'font-size': '11px', color: '#6b7280', 'margin-top': '1px' }}>
                      {row.summary.hint ? `${row.summary.hint} · ` : ''}
                      {issueLine()}
                    </div>
                  </span>
                  <span style={{ color: '#4b5563', 'flex-shrink': '0' }}>›</span>
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </Section>
  )
}
