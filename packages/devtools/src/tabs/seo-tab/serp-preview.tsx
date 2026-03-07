import { createSignal } from 'solid-js'
import { useStyles } from '../../styles/use-styles'
import { useHeadChanges } from '../../hooks/use-head-changes'
import { Section, SectionDescription } from '@tanstack/devtools-ui'

type SerpData = {
  title: string
  description: string
  siteName: string
  favicon: string | null
  url: string
}

function getSerpFromHead(): SerpData {
  const title = document.title || ''
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const metaTags = Array.from(document.head.querySelectorAll('meta'))
  const descriptionMeta = metaTags.find(
    (m) => m.getAttribute('name')?.toLowerCase() === 'description',
  )
  const description =
    descriptionMeta?.getAttribute('content')?.trim() || ''

  const siteNameMeta = metaTags.find(
    (m) => m.getAttribute('property') === 'og:site_name',
  )
  const siteName =
    siteNameMeta?.getAttribute('content')?.trim() ||
    (typeof window !== 'undefined'
      ? window.location.hostname.replace(/^www\./, '')
      : '')

  const linkTags = Array.from(document.head.querySelectorAll('link'))
  const iconLink = linkTags.find(
    (l) =>
      l.getAttribute('rel')?.toLowerCase().split(/\s+/).includes('icon'),
  )
  let favicon: string | null = iconLink?.getAttribute('href') || null
  if (favicon && typeof window !== 'undefined') {
    try {
      favicon = new URL(favicon, url).href
    } catch {
      favicon = null
    }
  }

  return { title, description, siteName, favicon, url }
}

export function SerpPreviewSection() {
  const [serp, setSerp] = createSignal<SerpData>(getSerpFromHead())
  const styles = useStyles()

  useHeadChanges(() => {
    setSerp(getSerpFromHead())
  })

  const data = serp()

  return (
    <Section>
      <SectionDescription>
        See how your title tag and meta description may look in Google search
        results. Data is read from the current page.
      </SectionDescription>
      <div class={styles().serpSnippet}>
        <div class={styles().serpSnippetUrlRow}>
          {data.favicon ? (
            <img
              src={data.favicon}
              alt=""
              class={styles().serpSnippetFavicon}
            />
          ) : null}
          <span>{data.siteName || data.url}</span>
        </div>
        <div class={styles().serpSnippetTitle}>
          {data.title || 'No title'}
        </div>
        <div class={styles().serpSnippetDesc}>
          {data.description || 'No meta description.'}
        </div>
      </div>
    </Section>
  )
}
