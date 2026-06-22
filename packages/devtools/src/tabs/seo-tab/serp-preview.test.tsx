import { render } from '@solidjs/testing-library'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DevtoolsProvider } from '../../context/devtools-context'
import { SerpPreviewSection } from './serp-preview'

const TITLE_FALLBACK = 'No title'
const DESCRIPTION_FALLBACK = 'No meta description.'
const NO_TITLE_ISSUE = 'No title tag set on the page.'
const NO_DESCRIPTION_ISSUE = 'No meta description set on the page.'
const TITLE_OVERFLOW_ISSUE =
  'The title is wider than 600px and it may not be displayed in full length.'

// Track nodes we inject into <head> so we can remove them after each test.
const injectedNodes: Array<Node> = []
let originalTitle = ''

const addMetaDescription = (content: string) => {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'description')
  meta.setAttribute('content', content)
  document.head.appendChild(meta)
  injectedNodes.push(meta)
  return meta
}

const addIconLink = (href: string) => {
  const link = document.createElement('link')
  link.setAttribute('rel', 'icon')
  link.setAttribute('href', href)
  document.head.appendChild(link)
  injectedNodes.push(link)
  return link
}

const renderSection = () =>
  render(() => (
    <DevtoolsProvider>
      <ThemeContextProvider theme="dark">
        <SerpPreviewSection />
      </ThemeContextProvider>
    </DevtoolsProvider>
  ))

describe('SerpPreviewSection', () => {
  beforeEach(() => {
    localStorage.clear()
    originalTitle = document.title
    document.title = ''
  })

  afterEach(() => {
    document.title = originalTitle
    for (const node of injectedNodes) {
      node.parentNode?.removeChild(node)
    }
    injectedNodes.length = 0
  })

  it('renders both previews with the seeded title and description', () => {
    document.title = 'T'
    addMetaDescription('A short meta description.')
    addIconLink('https://example.com/favicon.ico')

    const { getByText, getAllByText } = renderSection()

    // Both preview labels are present.
    expect(getByText('Desktop preview')).toBeInTheDocument()
    expect(getByText('Mobile preview')).toBeInTheDocument()

    // Title appears in both the desktop and mobile snippets.
    expect(getAllByText('T').length).toBeGreaterThanOrEqual(2)
    // Description appears in both snippets too.
    expect(
      getAllByText('A short meta description.').length,
    ).toBeGreaterThanOrEqual(2)

    // No title/description fallbacks should be shown.
    expect(() => getByText(TITLE_FALLBACK)).toThrow()
    expect(() => getByText(NO_TITLE_ISSUE)).toThrow()
    expect(() => getByText(NO_DESCRIPTION_ISSUE)).toThrow()
  })

  it('truncates a long title and lists a title-length issue', () => {
    const longTitle = 'A'.repeat(80)
    document.title = longTitle
    addMetaDescription('A short meta description.')
    addIconLink('https://example.com/favicon.ico')

    const { getAllByText, getAllByText: getAll } = renderSection()

    // The full 80-char title is never rendered verbatim.
    expect(() => getAllByText(longTitle)).toThrow()

    // The truncated form ends with the ellipsis and is shorter than the source.
    const truncatedNodes = getAll(/A+\.\.\.$/)
    expect(truncatedNodes.length).toBeGreaterThanOrEqual(2)
    const truncatedText = truncatedNodes[0]!.textContent
    expect(truncatedText.endsWith('...')).toBe(true)
    expect(truncatedText.length).toBeLessThan(longTitle.length)

    // The title-overflow issue is listed (once per preview).
    expect(getAllByText(TITLE_OVERFLOW_ISSUE).length).toBeGreaterThanOrEqual(2)
  })

  it('shows fallbacks and missing-tag issues when head is empty', () => {
    // No title, no meta description, no icon seeded.
    const { getAllByText } = renderSection()

    // Title + description fallbacks render in both previews.
    expect(getAllByText(TITLE_FALLBACK).length).toBeGreaterThanOrEqual(2)
    expect(getAllByText(DESCRIPTION_FALLBACK).length).toBeGreaterThanOrEqual(2)

    // The corresponding issue messages are listed (once per preview).
    expect(getAllByText(NO_TITLE_ISSUE).length).toBeGreaterThanOrEqual(2)
    expect(getAllByText(NO_DESCRIPTION_ISSUE).length).toBeGreaterThanOrEqual(2)
  })
})
