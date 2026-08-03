import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'
import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'
import { DevtoolsProvider } from '../src/context/devtools-context'
import {
  WorkbenchSecondaryTab,
  WorkbenchSecondaryTabs,
} from '../src/components/workbench-secondary-tabs'
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

const contrastRatio = (foreground: string, background: string) => {
  const luminance = (color: string) => {
    const channels = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((channel) => channel / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  }
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (values[0]! + 0.05) / (values[1]! + 0.05)
}

const mountTabs = (theme: TanStackDevtoolsTheme) => {
  const host = document.body.appendChild(document.createElement('div'))
  const dispose = render(
    () => (
      <DevtoolsProvider
        plugins={[]}
        config={{ defaultOpen: true, theme } as TanStackDevtoolsConfig}
      >
        {(() => {
          const [active, setActive] = createSignal<'one' | 'two'>('one')
          return (
            <WorkbenchSecondaryTabs
              ariaLabel="Test secondary tabs"
              dataTestId="secondary-tabs"
            >
              <WorkbenchSecondaryTab
                selected={active() === 'one'}
                ariaCurrent={active() === 'one' ? 'page' : undefined}
                onClick={() => setActive('one')}
              >
                One
              </WorkbenchSecondaryTab>
              <WorkbenchSecondaryTab
                selected={active() === 'two'}
                ariaCurrent={active() === 'two' ? 'page' : undefined}
                onClick={() => setActive('two')}
              >
                Two
              </WorkbenchSecondaryTab>
            </WorkbenchSecondaryTabs>
          )
        })()}
      </DevtoolsProvider>
    ),
    host,
  )
  disposers.push(dispose)
  return host
}

it('routes both Plugins and SEO through the shared secondary tab primitives', () => {
  const root = process.cwd()
  const plugins = readFileSync(
    join(root, 'src/components/plugins-strip.tsx'),
    'utf8',
  )
  const seo = readFileSync(join(root, 'src/tabs/seo-tab/index.tsx'), 'utf8')

  for (const source of [plugins, seo]) {
    expect(source).toMatch(/WorkbenchSecondaryTabs/)
    expect(source).toMatch(/WorkbenchSecondaryTab/)
    expect(source).toMatch(
      /components[\\/]workbench-secondary-tabs|\.\/workbench-secondary-tabs/,
    )
  }
})

describe.each(['light', 'dark'] as const)(
  '%s shared secondary tabs',
  (theme) => {
    it('keeps fixed scroll geometry and semantic inactive, selected, and focus hooks', () => {
      const host = mountTabs(theme)
      const bar = host.querySelector<HTMLElement>(
        '[data-testid="secondary-tabs"]',
      )!
      const tabs = [...bar.querySelectorAll<HTMLButtonElement>('button')]
      const one = tabs[0]!
      const two = tabs[1]!
      const semantic = resolveSemanticTheme(theme)

      expect(bar).toHaveAttribute('data-workbench-secondary-tabs')
      expect({
        height: getComputedStyle(bar).height,
        minHeight: getComputedStyle(bar).minHeight,
        flexBasis: getComputedStyle(bar).flexBasis,
        flexShrink: getComputedStyle(bar).flexShrink,
        paddingBlock: getComputedStyle(bar).paddingBlock,
        paddingInlineStart: getComputedStyle(bar).paddingInlineStart,
        paddingInlineEnd: getComputedStyle(bar).paddingInlineEnd,
        overflowX: getComputedStyle(bar).overflowX,
        scrollPaddingInlineStart:
          getComputedStyle(bar).scrollPaddingInlineStart,
        scrollPaddingInlineEnd: getComputedStyle(bar).scrollPaddingInlineEnd,
        gap: Number.parseFloat(getComputedStyle(bar).gap),
      }).toEqual({
        height: '44px',
        minHeight: '44px',
        flexBasis: '44px',
        flexShrink: '0',
        paddingBlock: '6px',
        paddingInlineStart: '8px',
        paddingInlineEnd: '8px',
        overflowX: 'auto',
        scrollPaddingInlineStart: '8px',
        scrollPaddingInlineEnd: '8px',
        gap: 0,
      })
      expect(getComputedStyle(bar).borderBottomWidth).not.toBe('1px')
      expect(one).toHaveAttribute('data-workbench-secondary-tab')
      expect(one).toHaveAttribute('data-tsd-selected', 'true')
      expect(one).toHaveAttribute('aria-current', 'page')
      expect(getComputedStyle(one).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(getComputedStyle(two).color).toBe(
        resolvedCssColor(semantic.color.text.secondary),
      )
      expect(
        contrastRatio(
          getComputedStyle(two).color,
          getComputedStyle(bar).backgroundColor,
        ),
      ).toBeGreaterThanOrEqual(4.5)

      two.click()
      expect(two).toHaveAttribute('data-tsd-selected', 'true')
      expect(two).toHaveAttribute('aria-current', 'page')
      expect(one).not.toHaveAttribute('data-tsd-selected')
      expect(one).not.toHaveAttribute('aria-current')
    })
  },
)
