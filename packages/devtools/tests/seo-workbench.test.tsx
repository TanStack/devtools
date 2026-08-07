import { render } from 'solid-js/web'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'
import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'
import { DevtoolsProvider } from '../src/context/devtools-context'
import { SeoTab } from '../src/tabs/seo-tab'
import type { TanStackDevtoolsConfig } from '../src/context/devtools-context'

const disposers: Array<() => void> = []

afterEach(() => {
  while (disposers.length) disposers.pop()!()
  document.body.replaceChildren()
})

const resolvedCssColor = (color: string) => {
  const probe = document.body.appendChild(document.createElement('span'))
  probe.style.color = color
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

const mountSeo = (theme: TanStackDevtoolsTheme) => {
  const host = document.body.appendChild(document.createElement('div'))
  const dispose = render(
    () => (
      <DevtoolsProvider
        plugins={[]}
        config={{ defaultOpen: true, theme } as TanStackDevtoolsConfig}
      >
        <ThemeContextProvider theme={theme}>
          <SeoTab />
        </ThemeContextProvider>
      </DevtoolsProvider>
    ),
    host,
  )
  disposers.push(dispose)
  return host
}

describe.each(['light', 'dark'] as const)('%s SEO workbench', (theme) => {
  it('uses shared filled tabs and semantic preview title foregrounds', () => {
    const host = mountSeo(theme)
    const semantic = resolveSemanticTheme(theme)
    const primaryColor = resolvedCssColor(semantic.color.text.primary)
    const secondaryColor = resolvedCssColor(semantic.color.text.secondary)
    const linkColor = resolvedCssColor(semantic.color.text.link)
    const bar = host.querySelector<HTMLElement>(
      'nav[aria-label="SEO sections"]',
    )!
    const tabs = [...bar.querySelectorAll<HTMLButtonElement>('button')]
    const socialTab = tabs[0]!
    const serpTab = tabs[1]!

    expect(bar).toHaveAttribute('data-workbench-secondary-tabs')
    expect(getComputedStyle(bar).height).toBe('44px')
    // The shared strip is part of the chrome band, so it closes with the same
    // translucent ink hairline the header uses.
    expect(getComputedStyle(bar).borderBottomWidth).toBe('1px')
    expect(socialTab).toHaveAttribute('data-tsd-selected', 'true')
    expect(getComputedStyle(socialTab).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )

    // The network name is a muted uppercase label; the shared title carries the
    // primary foreground.
    const socialHeadings = [
      ...host.querySelectorAll<HTMLElement>(
        '[data-testid="social-preview-heading"]',
      ),
    ]
    const socialTitles = [
      ...host.querySelectorAll<HTMLElement>(
        '[data-testid="social-preview-title"]',
      ),
    ]
    expect(socialHeadings.length).toBeGreaterThan(0)
    expect(socialTitles.length).toBeGreaterThan(0)
    expect(
      socialHeadings.every(
        (heading) => getComputedStyle(heading).color === secondaryColor,
      ),
    ).toBe(true)
    expect(
      socialTitles.every(
        (title) => getComputedStyle(title).color === primaryColor,
      ),
    ).toBe(true)

    serpTab.click()
    expect(serpTab).toHaveAttribute('data-tsd-selected', 'true')
    expect(serpTab).toHaveAttribute('aria-current', 'page')
    expect(socialTab).not.toHaveAttribute('data-tsd-selected')
    // Same split as the social cards: the block label is the muted uppercase
    // one, the site name carries the primary foreground.
    const serpLabels = [
      ...host.querySelectorAll<HTMLElement>(
        '[data-testid="serp-preview-label"]',
      ),
    ]
    const primaryTitles = [
      ...host.querySelectorAll<HTMLElement>(
        '[data-testid="serp-preview-site-name"]',
      ),
    ]
    const linkTitles = [
      ...host.querySelectorAll<HTMLElement>(
        '[data-testid="serp-preview-title"]',
      ),
    ]
    expect(serpLabels.length).toBeGreaterThan(0)
    expect(primaryTitles.length).toBeGreaterThan(0)
    expect(linkTitles).toHaveLength(2)
    expect(
      serpLabels.every(
        (label) => getComputedStyle(label).color === secondaryColor,
      ),
    ).toBe(true)
    expect(
      primaryTitles.every(
        (title) => getComputedStyle(title).color === primaryColor,
      ),
    ).toBe(true)
    expect(
      linkTitles.every((title) => getComputedStyle(title).color === linkColor),
    ).toBe(true)
  }, 10_000)
})
