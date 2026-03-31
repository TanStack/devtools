import { For } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { seoSeverityColor, type SeoSeverity } from './seo-severity'

type Issue = {
  severity: SeoSeverity
  message: string
}

type CanonicalData = {
  currentUrl: string
  canonicalRaw: Array<string>
  canonicalResolved: Array<string>
  robots: Array<string>
  indexable: boolean
  follow: boolean
  issues: Array<Issue>
}

function getCanonicalData(): CanonicalData {
  const currentUrl = window.location.href
  const current = new URL(currentUrl)

  const canonicalLinks = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel]'),
  ).filter((link) => link.rel.toLowerCase().split(/\s+/).includes('canonical'))

  const canonicalRaw = canonicalLinks.map((link) => link.getAttribute('href') || '')
  const canonicalResolved: Array<string> = []
  const issues: Array<Issue> = []

  if (canonicalLinks.length === 0) {
    issues.push({ severity: 'error', message: 'No canonical link found.' })
  }
  if (canonicalLinks.length > 1) {
    issues.push({ severity: 'error', message: 'Multiple canonical links found.' })
  }

  for (const raw of canonicalRaw) {
    if (!raw.trim()) {
      issues.push({ severity: 'error', message: 'Canonical href is empty.' })
      continue
    }
    try {
      const resolved = new URL(raw, currentUrl)
      canonicalResolved.push(resolved.href)

      if (resolved.hash) {
        issues.push({
          severity: 'warning',
          message: 'Canonical URL contains a hash fragment.',
        })
      }
      if (resolved.origin !== current.origin) {
        issues.push({
          severity: 'warning',
          message: 'Canonical URL points to a different origin.',
        })
      }
    } catch {
      issues.push({ severity: 'error', message: `Canonical URL is invalid: ${raw}` })
    }
  }

  const robotsMetas = Array.from(
    document.head.querySelectorAll<HTMLMetaElement>('meta[name]'),
  ).filter((meta) => {
    const name = meta.getAttribute('name')?.toLowerCase()
    return name === 'robots' || name === 'googlebot'
  })

  const robots = robotsMetas
    .map((meta) => meta.getAttribute('content') || '')
    .flatMap((content) =>
      content
        .split(',')
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean),
    )

  const indexable = !robots.includes('noindex')
  const follow = !robots.includes('nofollow')

  if (!indexable) {
    issues.push({ severity: 'error', message: 'Page is marked as noindex.' })
  }
  if (!follow) {
    issues.push({ severity: 'warning', message: 'Page is marked as nofollow.' })
  }
  if (robots.length === 0) {
    issues.push({
      severity: 'info',
      message: 'No robots meta found. Default behavior is usually index/follow.',
    })
  }

  if (current.pathname !== '/' && /[A-Z]/.test(current.pathname)) {
    issues.push({
      severity: 'warning',
      message: 'URL path contains uppercase characters.',
    })
  }
  if (current.search) {
    issues.push({ severity: 'info', message: 'URL contains query parameters.' })
  }

  return {
    currentUrl,
    canonicalRaw,
    canonicalResolved,
    robots,
    indexable,
    follow,
    issues,
  }
}

function getScore(issues: Array<Issue>): number {
  const errors = issues.filter((issue) => issue.severity === 'error').length
  const warnings = issues.filter((issue) => issue.severity === 'warning').length
  return Math.max(0, 100 - errors * 25 - warnings * 10)
}

export function CanonicalUrlPreviewSection() {
  const styles = useStyles()
  const data = getCanonicalData()
  const score = getScore(data.issues)

  return (
    <Section>
      <SectionDescription>
        Checks canonical URL, robots directives, indexability/follow signals,
        and basic URL hygiene from the current page.
      </SectionDescription>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>SEO status</div>
        <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
          <span>Score: {score}%</span>
          <span>Indexable: {data.indexable ? 'Yes' : 'No'}</span>
          <span>Follow: {data.follow ? 'Yes' : 'No'}</span>
          <span>Canonical tags: {data.canonicalRaw.length}</span>
        </div>
      </div>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Signals</div>
        <div>
          <strong>Current URL:</strong> {data.currentUrl}
        </div>
        <div>
          <strong>Canonical:</strong>{' '}
          {data.canonicalResolved.join(', ') || data.canonicalRaw.join(', ') || 'None'}
        </div>
        <div>
          <strong>Robots directives:</strong> {data.robots.join(', ') || 'None'}
        </div>
        <div style={{ 'margin-top': '6px', 'font-size': '12px', color: '#9ca3af' }}>
          X-Robots-Tag response headers are not available in this in-page view.
        </div>
      </div>

      <div class={styles().serpPreviewBlock}>
        <div class={styles().serpPreviewLabel}>Issues</div>
        <ul class={styles().serpErrorList}>
          <For each={data.issues}>
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
