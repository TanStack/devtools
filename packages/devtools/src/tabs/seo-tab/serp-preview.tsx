import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { For, createMemo, createSignal } from 'solid-js'
import { useHeadChanges } from '../../hooks/use-head-changes'
import { useStyles } from '../../styles/use-styles'

/** Google typically truncates titles at ~60 characters. */
const TITLE_MAX_CHARS = 60
/** Meta description is often trimmed at ~158 characters on desktop. */
const DESCRIPTION_MAX_CHARS = 158
/** Approximate characters that fit in 3 lines at mobile width (~340px, ~14px font). */
const DESCRIPTION_MOBILE_MAX_CHARS = 120
const ELLIPSIS = '...'

type SerpData = {
  title: string
  description: string
  siteName: string
  favicon: string | null
  url: string
}

type SerpOverflow = {
  titleOverflow: boolean
  descriptionOverflow: boolean
  descriptionOverflowMobile: boolean
}

type SerpCheck = {
  message: string
  hasIssue: (data: SerpData, overflow: SerpOverflow) => boolean
}

type SerpPreview = {
  label: string
  isMobile: boolean
  extraChecks: Array<SerpCheck>
}

const COMMON_CHECKS: Array<SerpCheck> = [
  {
    message: 'No favicon or icon set on the page.',
    hasIssue: (data) => !data.favicon,
  },
  {
    message: 'No title tag set on the page.',
    hasIssue: (data) => !data.title.trim(),
  },
  {
    message: 'No meta description set on the page.',
    hasIssue: (data) => !data.description.trim(),
  },
  {
    message:
      'The title is wider than 600px and it may not be displayed in full length.',
    hasIssue: (_, overflow) => overflow.titleOverflow,
  },
]

const SERP_PREVIEWS: Array<SerpPreview> = [
  {
    label: 'Desktop preview',
    isMobile: false,
    extraChecks: [
      {
        message:
          'The meta description may get trimmed at ~960 pixels on desktop and at ~680px on mobile. Keep it below ~158 characters.',
        hasIssue: (_, overflow) => overflow.descriptionOverflow,
      },
    ],
  },
  {
    label: 'Mobile preview',
    isMobile: true,
    extraChecks: [
      {
        message:
          'Description exceeds the 3-line limit for mobile view. Please shorten your text to fit within 3 lines.',
        hasIssue: (_, overflow) => overflow.descriptionOverflowMobile,
      },
    ],
  },
]

function truncateToChars(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  if (maxChars <= ELLIPSIS.length) return ELLIPSIS
  return text.slice(0, maxChars - ELLIPSIS.length) + ELLIPSIS
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

function getSerpIssues(
  data: SerpData,
  overflow: SerpOverflow,
  checks: Array<SerpCheck>,
): Array<string> {
  return checks.filter((c) => c.hasIssue(data, overflow)).map((c) => c.message)
}

function SerpSnippetPreview(props: {
  data: SerpData
  displayTitle: string
  displayDescription: string
  isMobile: boolean
  label: string
  issues: Array<string>
}) {
  const styles = useStyles()

  return (
    <div class={styles().serpPreviewBlock}>
      <div class={styles().serpPreviewLabel}>{props.label}</div>
      <div
        class={
          props.isMobile ? styles().serpSnippetMobile : styles().serpSnippet
        }
      >
        <div class={styles().serpSnippetTopRow}>
          {props.data.favicon ? (
            <img
              src={props.data.favicon}
              alt="favicon icon"
              class={styles().serpSnippetFavicon}
            />
          ) : (
            <div class={styles().serpSnippetDefaultFavicon} />
          )}
          <div class={styles().serpSnippetSiteColumn}>
            <span class={styles().serpSnippetSiteName}>
              {props.data.siteName || props.data.url}
            </span>
            <span class={styles().serpSnippetSiteUrl}>{props.data.url}</span>
          </div>
        </div>
        <div class={styles().serpSnippetTitle}>
          {props.displayTitle || props.data.title || 'No title'}
        </div>
        {!props.isMobile && (
          <div class={styles().serpSnippetDesc}>
            {props.displayDescription ||
              props.data.description ||
              'No meta description.'}
          </div>
        )}
        {props.isMobile && (
          <div class={styles().serpSnippetDescMobile}>
            {props.displayDescription ||
              props.data.description ||
              'No meta description.'}
          </div>
        )}
      </div>
      {props.issues.length > 0 ? (
        <div class={styles().seoMissingTagsSection}>
          <strong>Issues for {props.label}:</strong>
          <ul class={styles().serpErrorList}>
            <For each={props.issues}>
              {(issue) => <li class={styles().serpReportItem}>{issue}</li>}
            </For>
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function SerpPreviewSection() {
  const [serp, setSerp] = createSignal<SerpData>(getSerpFromHead())

  useHeadChanges(() => {
    setSerp(getSerpFromHead())
  })

  const serpPreviewState = createMemo(() => {
    const data = serp()
    const titleText = data.title || 'No title'
    const descText = data.description || 'No meta description.'

    const displayTitle = truncateToChars(titleText, TITLE_MAX_CHARS)
    const displayDescription = truncateToChars(descText, DESCRIPTION_MAX_CHARS)

    return {
      displayTitle,
      displayDescription,
      overflow: {
        titleOverflow: titleText.length > TITLE_MAX_CHARS,
        descriptionOverflow: descText.length > DESCRIPTION_MAX_CHARS,
        descriptionOverflowMobile:
          descText.length > DESCRIPTION_MOBILE_MAX_CHARS,
      },
    }
  })

  return (
    <Section>
      <SectionDescription>
        See how your title tag and meta description may look in Google search
        results. Data is read from the current page.
      </SectionDescription>
      <For each={SERP_PREVIEWS}>
        {(preview) => {
          const issues = createMemo(() =>
            getSerpIssues(serp(), serpPreviewState().overflow, [
              ...COMMON_CHECKS,
              ...preview.extraChecks,
            ]),
          )

          return (
            <SerpSnippetPreview
              data={serp()}
              displayTitle={serpPreviewState().displayTitle}
              displayDescription={serpPreviewState().displayDescription}
              isMobile={preview.isMobile}
              label={preview.label}
              issues={issues()}
            />
          )
        }}
      </For>
    </Section>
  )
}
