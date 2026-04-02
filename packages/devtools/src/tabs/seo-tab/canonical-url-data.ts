import type { SeoSeverity } from './seo-severity'

type CanonicalPageIssue = {
  severity: SeoSeverity
  message: string
}

/**
 * Canonical URL, robots, and basic URL hygiene derived from the current
 * document head and `window.location`.
 */
type CanonicalPageData = {
  currentUrl: string
  canonicalRaw: Array<string>
  canonicalResolved: Array<string>
  robots: Array<string>
  indexable: boolean
  follow: boolean
  issues: Array<CanonicalPageIssue>
}

export function getCanonicalPageData(): CanonicalPageData {
  const currentUrl = window.location.href
  const current = new URL(currentUrl)

  const canonicalLinks = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel]'),
  ).filter((link) => link.rel.toLowerCase().split(/\s+/).includes('canonical'))

  const canonicalRaw = canonicalLinks.map(
    (link) => link.getAttribute('href') || '',
  )
  const canonicalResolved: Array<string> = []
  const issues: Array<CanonicalPageIssue> = []

  if (canonicalLinks.length === 0) {
    issues.push({ severity: 'error', message: 'No canonical link found.' })
  }
  if (canonicalLinks.length > 1) {
    issues.push({
      severity: 'error',
      message: 'Multiple canonical links found.',
    })
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
      issues.push({
        severity: 'error',
        message: `Canonical URL is invalid: ${raw}`,
      })
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
      message:
        'No robots meta found. Default behavior is usually index/follow.',
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
