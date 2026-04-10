import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { For, createMemo, createSignal } from 'solid-js'
import { useHeadChanges } from '../hooks/use-head-changes'
import { useLocationChanges } from '../hooks/use-location-changes'
import { tokens } from '../utils/tokens'
import { useSeoStyles } from '../utils/use-seo-styles'
import type { SeoIssue, SeoSectionSummary } from '../utils/seo-section-summary'

const ELLIPSIS = '...'
const DESKTOP_TITLE_MAX_WIDTH_PX = 620
const MOBILE_TITLE_MAX_WIDTH_PX = 328
const DESKTOP_DESCRIPTION_TOTAL_WIDTH_PX = 960
const DESKTOP_DESCRIPTION_MAX_LINES = 2
const MOBILE_DESCRIPTION_WIDTH_PX = 320
const MOBILE_DESCRIPTION_MAX_LINES = 3
const TITLE_FONT = `400 20px ${tokens.font.fontFamily.sans}`
const DESCRIPTION_FONT = `400 14px ${tokens.font.fontFamily.sans}`

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

type SerpPreviewState = {
  displayTitleDesktop: string
  displayTitleMobile: string
  displayDescriptionDesktop: string
  displayDescriptionMobile: string
  overflow: SerpOverflow
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
          'The meta description exceeds the desktop preview space and may be trimmed.',
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

let serpMeasureContext: CanvasRenderingContext2D | null | undefined = undefined

function getSerpMeasureContext(): CanvasRenderingContext2D | null {
  if (serpMeasureContext !== undefined) {
    return serpMeasureContext
  }

  if (typeof document === 'undefined') {
    serpMeasureContext = null
    return serpMeasureContext
  }

  serpMeasureContext = document.createElement('canvas').getContext('2d')
  return serpMeasureContext
}

function normalizeSnippetText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function measureTextWidth(text: string, font: string): number {
  const context = getSerpMeasureContext()

  if (!context) {
    return text.length
  }

  context.font = font
  return context.measureText(text).width
}

function splitLongToken(
  token: string,
  maxWidth: number,
  font: string,
): Array<string> {
  const chars = Array.from(token)
  const chunks: Array<string> = []
  let current = ''

  for (const char of chars) {
    const candidate = current + char

    if (current && measureTextWidth(candidate, font) > maxWidth) {
      chunks.push(current)
      current = char
      continue
    }

    current = candidate
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

function wrapTextByWidth(
  text: string,
  maxWidth: number,
  font: string,
): Array<string> {
  const normalized = normalizeSnippetText(text)

  if (!normalized) {
    return []
  }

  const words = normalized.split(' ')
  const lines: Array<string> = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word

    if (measureTextWidth(candidate, font) <= maxWidth) {
      currentLine = candidate
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = ''
    }

    if (measureTextWidth(word, font) <= maxWidth) {
      currentLine = word
      continue
    }

    const chunks = splitLongToken(word, maxWidth, font)
    lines.push(...chunks.slice(0, -1))
    currentLine = chunks[chunks.length - 1] || ''
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function truncateToWidth(text: string, maxWidth: number, font: string): string {
  if (measureTextWidth(text, font) <= maxWidth) {
    return text
  }

  const chars = Array.from(text)
  let low = 0
  let high = chars.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = chars.slice(0, mid).join('').trimEnd() + ELLIPSIS

    if (measureTextWidth(candidate, font) <= maxWidth) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return chars.slice(0, low).join('').trimEnd() + ELLIPSIS
}

function truncateToLines(
  text: string,
  maxWidth: number,
  maxLines: number,
  font: string,
): string {
  const lines = wrapTextByWidth(text, maxWidth, font)

  if (lines.length <= maxLines) {
    return text
  }

  const chars = Array.from(text)
  let low = 0
  let high = chars.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = chars.slice(0, mid).join('').trimEnd() + ELLIPSIS

    if (wrapTextByWidth(candidate, maxWidth, font).length <= maxLines) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return chars.slice(0, low).join('').trimEnd() + ELLIPSIS
}

function truncateToTotalWrappedWidth(
  text: string,
  totalWidth: number,
  maxLines: number,
  font: string,
): string {
  const chars = Array.from(text)
  const fits = (value: string) => {
    const lines = wrapTextByWidth(value, totalWidth / maxLines, font)
    if (lines.length > maxLines) {
      return false
    }

    const usedWidth = lines.reduce(
      (sum, line) => sum + measureTextWidth(line, font),
      0,
    )

    return usedWidth <= totalWidth
  }

  if (fits(text)) {
    return text
  }

  let low = 0
  let high = chars.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = chars.slice(0, mid).join('').trimEnd() + ELLIPSIS

    if (fits(candidate)) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return chars.slice(0, low).join('').trimEnd() + ELLIPSIS
}

function getSerpPreviewState(data: SerpData): SerpPreviewState {
  const titleText = data.title || 'No title'
  const descText = data.description || 'No meta description.'
  const desktopDescriptionLines = wrapTextByWidth(
    descText,
    DESKTOP_DESCRIPTION_TOTAL_WIDTH_PX / DESKTOP_DESCRIPTION_MAX_LINES,
    DESCRIPTION_FONT,
  )

  return {
    displayTitleDesktop: truncateToWidth(
      titleText,
      DESKTOP_TITLE_MAX_WIDTH_PX,
      TITLE_FONT,
    ),
    displayTitleMobile: truncateToWidth(
      titleText,
      MOBILE_TITLE_MAX_WIDTH_PX,
      TITLE_FONT,
    ),
    displayDescriptionDesktop: truncateToTotalWrappedWidth(
      descText,
      DESKTOP_DESCRIPTION_TOTAL_WIDTH_PX,
      DESKTOP_DESCRIPTION_MAX_LINES,
      DESCRIPTION_FONT,
    ),
    displayDescriptionMobile: truncateToLines(
      descText,
      MOBILE_DESCRIPTION_WIDTH_PX,
      MOBILE_DESCRIPTION_MAX_LINES,
      DESCRIPTION_FONT,
    ),
    overflow: {
      titleOverflow:
        measureTextWidth(titleText, TITLE_FONT) > DESKTOP_TITLE_MAX_WIDTH_PX,
      descriptionOverflow:
        desktopDescriptionLines.length > DESKTOP_DESCRIPTION_MAX_LINES ||
        desktopDescriptionLines.reduce(
          (sum, line) => sum + measureTextWidth(line, DESCRIPTION_FONT),
          0,
        ) > DESKTOP_DESCRIPTION_TOTAL_WIDTH_PX,
      descriptionOverflowMobile:
        wrapTextByWidth(descText, MOBILE_DESCRIPTION_WIDTH_PX, DESCRIPTION_FONT)
          .length > MOBILE_DESCRIPTION_MAX_LINES,
    },
  }
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

/**
 * Title, meta description, favicon, and truncation signals for the SEO overview.
 */
export function getSerpPreviewSummary(): SeoSectionSummary {
  const data = getSerpFromHead()
  const previewState = getSerpPreviewState(data)
  const overflow = previewState.overflow

  const issues: Array<SeoIssue> = []

  if (!data.favicon) {
    issues.push({
      severity: 'info',
      message: 'No favicon or icon set on the page.',
    })
  }
  if (!data.title.trim()) {
    issues.push({
      severity: 'error',
      message: 'No title tag set on the page.',
    })
  }
  if (!data.description.trim()) {
    issues.push({
      severity: 'error',
      message: 'No meta description set on the page.',
    })
  }
  if (overflow.titleOverflow) {
    issues.push({
      severity: 'warning',
      message:
        'The title is wider than 600px and it may not be displayed in full length.',
    })
  }
  if (overflow.descriptionOverflow) {
    issues.push({
      severity: 'warning',
      message:
        'The meta description exceeds the desktop preview space and may be trimmed.',
    })
  }
  if (overflow.descriptionOverflowMobile) {
    issues.push({
      severity: 'warning',
      message:
        'Description exceeds the 3-line limit for mobile view. Please shorten your text to fit within 3 lines.',
    })
  }

  const hint =
    data.title.trim() && data.description.trim()
      ? 'Title and description present'
      : !data.title.trim()
        ? 'Missing title'
        : 'Missing meta description'

  return { issues, hint }
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
  displayTitleDesktop: string
  displayTitleMobile: string
  displayDescriptionDesktop: string
  displayDescriptionMobile: string
  isMobile: boolean
  label: string
  issues: Array<string>
}) {
  const styles = useSeoStyles()

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
          {(props.isMobile
            ? props.displayTitleMobile
            : props.displayTitleDesktop) ||
            props.data.title ||
            'No title'}
        </div>
        {!props.isMobile && (
          <div class={styles().serpSnippetDesc}>
            {props.displayDescriptionDesktop ||
              props.data.description ||
              'No meta description.'}
          </div>
        )}
        {props.isMobile && (
          <div class={styles().serpSnippetDescMobile}>
            {props.displayDescriptionMobile ||
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
              {(issue) => (
                <li
                  class={`${styles().seoIssueText} ${styles().seoSerpIssueListItem}`}
                >
                  {issue}
                </li>
              )}
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

  useLocationChanges(() => {
    setSerp(getSerpFromHead())
  })

  const serpPreviewState = createMemo(() => {
    return getSerpPreviewState(serp())
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
              displayTitleDesktop={serpPreviewState().displayTitleDesktop}
              displayTitleMobile={serpPreviewState().displayTitleMobile}
              displayDescriptionDesktop={
                serpPreviewState().displayDescriptionDesktop
              }
              displayDescriptionMobile={
                serpPreviewState().displayDescriptionMobile
              }
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
