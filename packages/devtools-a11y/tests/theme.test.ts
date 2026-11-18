import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { createComponent } from 'solid-js'
import { render } from 'solid-js/web'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'
import { A11yIssueCard } from '../src/core/components/IssueCard'
import { getSeverityStyle } from '../src/core/styles/severity-theme'
import {
  clearHighlights,
  highlightAllIssues,
  highlightElement,
} from '../src/core/utils/ui.utils'
import type { A11yIssue } from '../src/core/types/types'

const packageRoot = process.cwd()
const coreRoot = join(packageRoot, 'src/core')
const files = (path: string): Array<string> =>
  readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name)
    return entry.isDirectory()
      ? files(child)
      : ['.ts', '.tsx'].includes(extname(child))
        ? [child]
        : []
  })
const rawColor = /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/i
const gradient = /\b(?:linear|radial|conic)-gradient\(/i
const namedExemptions = new Map([
  [
    'semantic-color-exempt: transparent-overlay',
    /^src[\\/]core[\\/]utils[\\/]ui\.utils\.ts$/,
  ],
])

afterEach(() => {
  clearHighlights()
  document.body.replaceChildren()
})

describe.each(['light', 'dark'] as const)('%s accessibility theme', (theme) => {
  it('maps severity to exact shared roles and distinguishable outlines', () => {
    expect(getSeverityStyle('critical', theme)).toMatchObject({
      role: 'error',
      label: 'Critical',
      outline: '3px solid',
    })
    expect(getSeverityStyle('serious', theme)).toMatchObject({
      role: 'error',
      label: 'Serious',
      outline: '2px solid',
    })
    expect(getSeverityStyle('moderate', theme)).toMatchObject({
      role: 'warning',
      label: 'Moderate',
      outline: '2px solid',
    })
    expect(getSeverityStyle('minor', theme)).toMatchObject({
      role: 'info',
      label: 'Minor',
      outline: '2px dashed',
    })
    const semantic = resolveSemanticTheme(theme)
    expect(getSeverityStyle('critical', theme).colors).toEqual(
      semantic.color.status.error,
    )
    expect(getSeverityStyle('moderate', theme).colors).toEqual(
      semantic.color.status.warning,
    )
  })

  it('renders selected IssueCard surface/control markers and visible severity text', () => {
    const issue: A11yIssue = {
      id: 'issue-1',
      ruleId: 'image-alt',
      impact: 'critical',
      message: 'Add alt text',
      help: 'Images need alt text',
      helpUrl: 'https://example.test/image-alt',
      wcagTags: ['wcag111'],
      nodes: [
        {
          selector: '#bad-image',
          html: '<img id="bad-image">',
          failureSummary: 'Missing alt',
        },
      ],
      meetsThreshold: true,
      timestamp: 1,
    }
    const host = document.body.appendChild(document.createElement('div'))
    const dispose = render(
      () =>
        createComponent(ThemeContextProvider, {
          theme,
          get children() {
            return createComponent(A11yIssueCard, {
              issue,
              impact: 'critical',
              selected: true,
              onSelect: () => {},
              onDisableRule: () => {},
            })
          },
        }),
      host,
    )
    expect(host.querySelector('[data-tsd-surface]')).toHaveAttribute(
      'data-tsd-selected',
      'true',
    )
    expect(host.querySelector('[data-severity="critical"]')).toHaveTextContent(
      'Critical',
    )
    const selectButton = host.querySelector('button[aria-pressed]')
    expect(selectButton).toHaveAttribute('type', 'button')
    expect(selectButton).toHaveAttribute('aria-pressed', 'true')
    expect(selectButton).toHaveAttribute('data-tsd-control')
    expect(host.querySelector('a')?.className).not.toBe('')
    expect(
      host.querySelector('button:not([aria-pressed])')?.className,
    ).not.toBe('')
    expect(document.head.textContent).toContain(
      resolveSemanticTheme(theme).color.state.selectionText,
    )
    dispose()
  })

  it('injects theme-aware overlay CSS and written tooltip severity', () => {
    const target = document.body.appendChild(document.createElement('img'))
    target.id = 'bad-image'
    highlightElement('#bad-image', 'critical', {
      showTooltip: true,
      ruleId: 'image-alt',
      theme,
    })
    const style = document.getElementById('tsd-a11y-highlight-styles')!
    expect(style.textContent).toContain(
      getSeverityStyle('critical', theme).colors.border,
    )
    expect(document.querySelector('[data-a11y-overlay]')).toHaveTextContent(
      'Critical: image-alt',
    )
    expect(style.textContent).toContain(
      `font: ${resolveSemanticTheme(theme).type.bodyXs.weight} ${resolveSemanticTheme(theme).type.bodyXs.size}`,
    )
  })

  it('uses written severity labels for every multi-issue tooltip entry', () => {
    const target = document.body.appendChild(document.createElement('img'))
    target.id = 'bad-image'
    highlightAllIssues(
      [
        {
          id: 'issue-critical',
          ruleId: 'image-alt',
          impact: 'critical',
          message: 'Add alt text',
          help: 'Images need alt text',
          helpUrl: 'https://example.test/image-alt',
          wcagTags: [],
          nodes: [
            {
              selector: '#bad-image',
              html: '<img id="bad-image">',
              failureSummary: 'Missing alt',
            },
          ],
          meetsThreshold: true,
          timestamp: 1,
        },
        {
          id: 'issue-minor',
          ruleId: 'image-redundant-alt',
          impact: 'minor',
          message: 'Avoid redundant alt text',
          help: 'Images need useful alt text',
          helpUrl: 'https://example.test/image-redundant-alt',
          wcagTags: [],
          nodes: [
            {
              selector: '#bad-image',
              html: '<img id="bad-image">',
              failureSummary: 'Redundant alt',
            },
          ],
          meetsThreshold: true,
          timestamp: 1,
        },
      ],
      theme,
    )
    expect(document.querySelector('[data-a11y-overlay]')).toHaveTextContent(
      '2 issues: Critical: image-alt | Minor: image-redundant-alt',
    )
  })
})

it('rejects every unapproved raw color and gradient in accessibility-owned source', () => {
  const violations = files(coreRoot).flatMap((path) => {
    const file = relative(packageRoot, path)
    return readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .flatMap((line, index) => {
        if (!rawColor.test(line) && !gradient.test(line)) return []
        const exempt = [...namedExemptions].some(
          ([marker, allowedPath]) =>
            line.includes(marker) && allowedPath.test(file),
        )
        return exempt ? [] : [`${file}:${index + 1}: ${line.trim()}`]
      })
  })
  expect(violations, violations.join('\n')).toEqual([])
})
