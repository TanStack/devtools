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

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Overall</div>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'font-size': '13px',
            'margin-bottom': '6px',
          }}
        >
          <strong>{bundle().health.label}</strong>
          <span style={{ color: healthBarColor(bundle().health.score) }}>
            {bundle().health.score}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#374151',
            'border-radius': '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${bundle().health.score}%`,
              height: '100%',
              background: healthBarColor(bundle().health.score),
            }}
          />
        </div>
        <div style={{ 'font-size': '12px', 'margin-top': '6px', color: '#9ca3af' }}>
          {bundle().health.counts.error} error(s), {bundle().health.counts.warning}{' '}
          warning(s), {bundle().health.counts.info} info — across all checks below.
        </div>
      </div>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Indexability & URL</div>
        <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
          <span>Indexable: {bundle().canonical.indexable ? 'Yes' : 'No'}</span>
          <span>Follow: {bundle().canonical.follow ? 'Yes' : 'No'}</span>
          <span>Canonical tags: {bundle().canonical.canonicalRaw.length}</span>
        </div>
        <div style={{ 'margin-top': '8px' }}>
          <strong>Current URL:</strong> {bundle().canonical.currentUrl}
        </div>
        <div>
          <strong>Canonical:</strong>{' '}
          {bundle().canonical.canonicalResolved.join(', ') ||
            bundle().canonical.canonicalRaw.join(', ') ||
            'None'}
        </div>
        <div>
          <strong>Robots directives:</strong>{' '}
          {bundle().canonical.robots.join(', ') || 'None'}
        </div>
        <div
          style={{ 'margin-top': '6px', 'font-size': '12px', color: '#9ca3af' }}
        >
          X-Robots-Tag response headers are not available in this in-page view.
        </div>
      </div>

      <Show when={bundle().canonical.issues.length > 0}>
        <div class={styles().serpPreviewBlock}>
          <div class={styles().serpPreviewLabel}>URL & robots issues</div>
          <ul class={styles().serpErrorList}>
            <For each={bundle().canonical.issues}>
              {(issue) => (
                <li
                  style={{
                    color: seoSeverityColor(issue.severity),
                    'margin-top': '4px',
                  }}
                >
                  [{issue.severity}] {issue.message}
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Sections</div>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
          <For each={bundle().rows}>
            {(row) => {
              const sev = () => worstSeverity(row.summary.issues)
              const issueLine = () => {
                const total =
                  row.summary.issueCount ?? row.summary.issues.length
                const capped = row.summary.issueCount != null
                if (total === 0) return 'No issues'
                const suffix = capped && row.summary.issueCount! > row.summary.issues.length
                  ? ` (showing ${row.summary.issues.length} of ${row.summary.issueCount})`
                  : ''
                return `${total} issue(s)${suffix}`
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
                    padding: '10px 12px',
                    border: '1px solid #374151',
                    'border-radius': '8px',
                    background: '#111827',
                    cursor: 'pointer',
                    color: '#e5e7eb',
                    'font-size': '13px',
                  }}
                >
                  <span
                    style={{
                      'flex-shrink': '0',
                      width: '22px',
                      height: '22px',
                      'border-radius': '6px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-size': '12px',
                      'font-weight': '700',
                      background: sev()
                        ? `${seoSeverityColor(sev()!)}22`
                        : '#16a34a22',
                      color: sev() ? seoSeverityColor(sev()!) : '#16a34a',
                    }}
                    aria-hidden="true"
                  >
                    {severityGlyph(sev())}
                  </span>
                  <span style={{ 'flex-grow': '1', 'min-width': '0' }}>
                    <div style={{ 'font-weight': '600' }}>{row.title}</div>
                    <div style={{ 'font-size': '12px', color: '#9ca3af' }}>
                      {row.summary.hint ? `${row.summary.hint} · ` : ''}
                      {issueLine()}
                    </div>
                  </span>
                  <span style={{ color: '#6b7280', 'flex-shrink': '0' }}>→</span>
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </Section>
  )
}
