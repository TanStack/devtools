import { createEffect, createMemo, createSignal, For } from 'solid-js'
import { useStyles } from '../../styles/use-styles'
import { useHeadChanges } from '../../hooks/use-head-changes'
import { Section, SectionDescription } from '@tanstack/devtools-ui'

const TITLE_MAX_WIDTH_PX = 600
const DESCRIPTION_MAX_WIDTH_PX = 960
const ELLIPSIS = '...'

function truncateToWidth(
  el: HTMLDivElement,
  text: string,
  maxPx: number,
): string {
  el.textContent = text
  if (el.offsetWidth <= maxPx) return text
  for (let i = text.length - 1; i >= 0; i--) {
    el.textContent = text.slice(0, i) + ELLIPSIS
    if (el.offsetWidth <= maxPx) return text.slice(0, i) + ELLIPSIS
  }
  return ELLIPSIS
}

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
  const description = descriptionMeta?.getAttribute('content')?.trim() || ''

  const siteNameMeta = metaTags.find(
    (m) => m.getAttribute('property') === 'og:site_name',
  )
  const siteName =
    siteNameMeta?.getAttribute('content')?.trim() ||
    (typeof window !== 'undefined'
      ? window.location.hostname.replace(/^www\./, '')
      : '')

  const linkTags = Array.from(document.head.querySelectorAll('link'))
  const iconLink = linkTags.find((l) =>
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

type SerpOverflow = {
  titleOverflow: boolean
  descriptionOverflow: boolean
}

function getSerpReports(data: SerpData, overflow: SerpOverflow): string[] {
  const issues: string[] = []
  if (!data.title?.trim()) {
    issues.push('No title tag set on the page.')
  }
  if (!data.description?.trim()) {
    issues.push('No meta description set on the page.')
  }
  if (overflow.titleOverflow) {
    issues.push(
      'The title is wider than 600px and it may not be displayed in full length.',
    )
  }
  if (overflow.descriptionOverflow) {
    issues.push(
      'The meta description may get trimmed at ~960 pixels on desktop and at ~680px on mobile. Keep it below ~158 characters.',
    )
  }
  return issues
}

export function SerpPreviewSection() {
  const [serp, setSerp] = createSignal<SerpData>(getSerpFromHead())
  const [titleOverflow, setTitleOverflow] = createSignal(false)
  const [descriptionOverflow, setDescriptionOverflow] = createSignal(false)
  const [displayTitle, setDisplayTitle] = createSignal('')
  const [displayDescription, setDisplayDescription] = createSignal('')
  const [titleMeasureEl, setTitleMeasureEl] = createSignal<
    HTMLDivElement | undefined
  >(undefined)
  const [descMeasureEl, setDescMeasureEl] = createSignal<
    HTMLDivElement | undefined
  >(undefined)
  const styles = useStyles()

  useHeadChanges(() => {
    setSerp(getSerpFromHead())
  })

  createEffect(() => {
    const titleEl = titleMeasureEl()
    const descEl = descMeasureEl()
    const data = serp()
    if (!titleEl || !descEl) return

    const titleText = data.title || 'No title'
    const descText = data.description || 'No meta description.'

    const truncatedTitle = truncateToWidth(
      titleEl,
      titleText,
      TITLE_MAX_WIDTH_PX,
    )
    setDisplayTitle(truncatedTitle)
    setTitleOverflow(truncatedTitle !== titleText)

    const truncatedDesc = truncateToWidth(
      descEl,
      descText,
      DESCRIPTION_MAX_WIDTH_PX,
    )
    setDisplayDescription(truncatedDesc)
    setDescriptionOverflow(truncatedDesc !== descText)
  })

  const reports = createMemo(() =>
    getSerpReports(serp(), {
      titleOverflow: titleOverflow(),
      descriptionOverflow: descriptionOverflow(),
    }),
  )

  const data = serp()

  return (
    <Section>
      <SectionDescription>
        See how your title tag and meta description may look in Google search
        results. Data is read from the current page.
      </SectionDescription>
      <div class={styles().serpSnippet}>
        <div class={styles().serpSnippetTopRow}>
          {data.favicon ? (
            <img
              src={data.favicon}
              alt=""
              class={styles().serpSnippetFavicon}
            />
          ) : null}
          <div class={styles().serpSnippetSiteColumn}>
            <span class={styles().serpSnippetSiteName}>
              {data.siteName || data.url}
            </span>
            <span class={styles().serpSnippetSiteUrl}>{data.url}</span>
          </div>
        </div>
        <div class={styles().serpSnippetTitle}>
          {displayTitle() || data.title || 'No title'}
        </div>
        <div
          ref={setTitleMeasureEl}
          class={`${styles().serpSnippetTitle} ${styles().serpMeasureHidden}`}
          aria-hidden="true"
        />
        <div class={styles().serpSnippetDesc}>
          {displayDescription() || data.description || 'No meta description.'}
        </div>
        <div
          ref={setDescMeasureEl}
          class={`${styles().serpSnippetDesc} ${styles().serpMeasureHidden}`}
          aria-hidden="true"
        />
      </div>
      {reports().length > 0 ? (
        <div class={styles().seoMissingTagsSection}>
          <strong>SERP preview issues:</strong>
          <ul class={styles().serpErrorList}>
            <For each={reports()}>
              {(issue) => <li class={styles().serpReportItem}>{issue}</li>}
            </For>
          </ul>
        </div>
      ) : null}
    </Section>
  )
}
