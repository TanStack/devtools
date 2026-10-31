import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createComponent } from 'solid-js'
import { render } from 'solid-js/web'
import {
  Button,
  Checkbox,
  Header,
  HeaderLogo,
  Input,
  JsonTree,
  MainPanel,
  Section,
  SectionDescription,
  SectionIcon,
  SectionTitle,
  Select,
  Tag,
  TanStackLogo,
} from '../src'
import { ThemeContextProvider } from '../src/components/theme'
import { tokens } from '../src/styles/tokens'
import {
  DEVTOOLS_FORCED_COLORS_STYLE_ID,
  DEVTOOLS_FONT_STYLE_ID,
  ensureDevtoolsStyles,
  forcedColorsCss,
  resolveSemanticTheme,
} from '../src/internal'
import type { ButtonVariant } from '../src/components/button'
import { CopiedCopier } from '../src/components/icons'
import type { TanStackDevtoolsTheme } from '../src'

const disposers: Array<() => void> = []
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
})

function mount(theme: 'light' | 'dark') {
  const host = document.createElement('div')
  document.body.append(host)
  disposers.push(
    render(
      () =>
        createComponent(ThemeContextProvider, {
          theme,
          get children() {
            return [
              createComponent(Button, { disabled: true, children: 'Button' }),
              createComponent(Input, {
                label: 'Input',
                description: 'Input description',
              }),
              createComponent(Select, {
                label: 'Select',
                description: 'Select description',
                options: [{ label: 'One', value: 'one' }],
              }),
              createComponent(Checkbox, {
                label: 'Checkbox',
                description: 'Checkbox description',
              }),
              createComponent(Checkbox, {
                label: 'Checked checkbox',
                checked: true,
              }),
              createComponent(Header, {
                get children() {
                  return createComponent(HeaderLogo, {
                    flavor: { light: '#111111', dark: '#ffffff' },
                    children: 'DEVTOOLS',
                  })
                },
              }),
              createComponent(TanStackLogo, {}),
              createComponent(MainPanel, { children: 'Panel' }),
              createComponent(Section, {
                get children() {
                  return [
                    createComponent(SectionTitle, {
                      children: 'Section title',
                    }),
                    createComponent(SectionDescription, {
                      children: 'Section description',
                    }),
                    createComponent(SectionIcon, { children: '!' }),
                  ]
                },
              }),
              createComponent(JsonTree, {
                value: {
                  nested: {
                    key: 'value',
                    count: 1,
                    enabled: true,
                    deep: { x: true },
                  },
                },
                copyable: true,
              }),
            ]
          },
        }),
      host,
    ),
  )
  return host
}

describe.each(['light', 'dark'] as const)('%s primitives', (theme) => {
  it('mounts accessible disabled native controls with forced-colors hooks', () => {
    const host = mount(theme)
    const controlNodes = [...host.querySelectorAll('[data-tsd-control]')]
    expect(
      controlNodes.filter((control) => control.hasAttribute('disabled')),
    ).toHaveLength(1)
    for (const control of host.querySelectorAll('input, select')) {
      expect(
        (control as HTMLInputElement | HTMLSelectElement).labels?.length,
      ).toBe(1)
    }
    expect(host.querySelectorAll('[aria-describedby]')).toHaveLength(3)
    const checkboxes = host.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes[0]?.getAttribute('data-tsd-selected')).toBeNull()
    expect(checkboxes[1]?.getAttribute('data-tsd-selected')).toBe('true')
    const surfaces = {
      Header: host.querySelector('header[data-tsd-surface]'),
      MainPanel: [...host.querySelectorAll('div[data-tsd-surface]')].find(
        (node) => node.textContent === 'Panel',
      ),
      Section: host.querySelector('section[data-tsd-surface]'),
      Logo: host.querySelector('svg[data-tsd-surface]'),
      JsonTree: [...host.querySelectorAll('[data-tsd-surface]')].find((node) =>
        node.textContent?.includes('nested'),
      ),
    }
    expect(Object.values(surfaces).every(Boolean)).toBe(true)
    const namedControls = {
      Button: host.querySelector('button[data-tsd-control][disabled]'),
      Input: host.querySelector(
        'input:not([type="checkbox"])[data-tsd-control]',
      ),
      Select: host.querySelector('select[data-tsd-control]'),
      Checkbox: host.querySelector('input[type="checkbox"][data-tsd-control]'),
      HeaderLogo: host.querySelector('header button[data-tsd-control]'),
      TreeExpander: host.querySelector(
        '[role="button"][aria-expanded][data-tsd-control]',
      ),
      TreeCopy: host.querySelector('button[data-copy-state][data-tsd-control]'),
    }
    expect(Object.values(namedControls).every(Boolean)).toBe(true)
    expect(host.querySelector('header[data-tsd-separator]')).toBeTruthy()
    expect(host.querySelector('section [data-tsd-separator]')).toBeTruthy()
    expect(
      host.querySelector('[data-tsd-surface] [data-tsd-separator]'),
    ).toBeTruthy()
    for (const kind of [
      'property',
      'string',
      'number',
      'keyword',
      'comment',
      'punctuation',
    ]) {
      expect(host.querySelector(`[data-tsd-syntax="${kind}"]`)).toBeTruthy()
    }
    expect(host.querySelector('section h3')?.textContent).toBe('Section title')
    expect(host.querySelector('section p')?.textContent).toBe(
      'Section description',
    )
    expect(host.querySelector('section span')?.textContent).toBe('!')
    expect(
      document.querySelectorAll(`#${DEVTOOLS_FONT_STYLE_ID}`),
    ).toHaveLength(1)
    expect(
      document.querySelectorAll(`#${DEVTOOLS_FORCED_COLORS_STYLE_ID}`),
    ).toHaveLength(1)
  })
})

describe.each(['light', 'dark'] as const)('%s Button variants', (theme) => {
  it('renders every solid, outline, and ghost variant with semantic focus colors', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const variants: Array<ButtonVariant> = [
      'primary',
      'secondary',
      'danger',
      'success',
      'info',
      'warning',
    ]
    disposers.push(
      render(
        () =>
          createComponent(ThemeContextProvider, {
            theme,
            get children() {
              return variants.flatMap((variant) => [
                createComponent(Button, {
                  variant,
                  children: `${variant} solid`,
                }),
                createComponent(Button, {
                  variant,
                  outline: true,
                  children: `${variant} outline`,
                }),
                createComponent(Button, {
                  variant,
                  ghost: true,
                  children: `${variant} ghost`,
                }),
              ])
            },
          }),
        host,
      ),
    )
    expect(host.querySelectorAll('button[data-tsd-control]')).toHaveLength(18)
    const cssText = document.head.textContent ?? ''
    const semantic = resolveSemanticTheme(theme)
    expect(cssText).toContain(semantic.color.border.focus)
    expect(cssText).not.toContain('line-height:1.3')
    for (const status of Object.values(semantic.color.status)) {
      expect(cssText).toContain(status.solidFill)
      expect(cssText).toContain(status.text)
    }
  })
})

describe.each(['light', 'dark'] as const)('%s Tag legacy matrix', (theme) => {
  it('renders a Tag for every legacy color key', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const keys = Object.keys(tokens.colors) as Array<keyof typeof tokens.colors>
    disposers.push(
      render(
        () =>
          createComponent(ThemeContextProvider, {
            theme,
            get children() {
              return keys.map((color) =>
                createComponent(Tag, { color, label: color }),
              )
            },
          }),
        host,
      ),
    )
    expect(host.querySelectorAll('[data-tsd-control]')).toHaveLength(
      keys.length,
    )
    expect(host.querySelector('[data-tsd-selected]')).toBeNull()
  })
})

it('keeps CopiedCopier theme required', () => {
  expectTypeOf<Parameters<typeof CopiedCopier>[0]>().toEqualTypeOf<{
    theme: TanStackDevtoolsTheme
  }>()
})

it('keeps the authored Check icon signature and uses current color for both states', async () => {
  const iconsSource = await readFile(
    resolve(process.cwd(), 'src/components/icons.tsx'),
    'utf8',
  )
  const checkStart = iconsSource.indexOf('export function Check(')
  const checkEnd = iconsSource.indexOf(
    'export function CheckCircle()',
    checkStart,
  )
  const checkSource = iconsSource.slice(checkStart, checkEnd)

  expect(checkStart).toBeGreaterThanOrEqual(0)
  expect(checkEnd).toBeGreaterThan(checkStart)
  expect(checkSource).toContain(
    'export function Check(props: { checked: boolean; theme: TanStackDevtoolsTheme })',
  )
  expect(checkSource).not.toMatch(/#(?:9B8AFB|6938EF)/i)
  expect(checkSource.match(/stroke="currentColor"/g)).toHaveLength(2)
})

it('installs forced-colors styles exactly once per popup document', () => {
  const popup = document.implementation.createHTMLDocument('popup')
  ensureDevtoolsStyles(popup)
  ensureDevtoolsStyles(popup)
  expect(
    popup.querySelectorAll(`#${DEVTOOLS_FORCED_COLORS_STYLE_ID}`),
  ).toHaveLength(1)
  expect(popup.querySelectorAll(`#${DEVTOOLS_FONT_STYLE_ID}`)).toHaveLength(1)
  expect(forcedColorsCss).toContain('forced-color-adjust: auto')
  expect(forcedColorsCss).toContain('[data-tsd-selected="true"]')
  expect(forcedColorsCss).toContain('border-color: HighlightText')
  for (const systemColor of [
    'Canvas',
    'CanvasText',
    'ButtonFace',
    'ButtonText',
    'Highlight',
    'HighlightText',
  ]) {
    expect(forcedColorsCss).toContain(systemColor)
  }
  expect(forcedColorsCss).toContain(
    '[data-tsd-separator] { border-color: CanvasText; }',
  )
  expect(forcedColorsCss).toContain(
    '[data-tsd-surface] { forced-color-adjust: auto; background: Canvas; color: CanvasText; }',
  )
  expect(forcedColorsCss).toContain(
    '[data-tsd-control] { forced-color-adjust: auto; background: ButtonFace; color: ButtonText; border-color: ButtonText; }',
  )
  expect(forcedColorsCss).toContain(
    '[data-tsd-control]:focus-visible { outline: 2px solid ButtonText; outline-offset: 2px; }',
  )
  expect(forcedColorsCss).toContain(
    '[data-tsd-separator="resize"] { border: 1px solid CanvasText; }',
  )
})

it('installs provider styles in the document that owns its rendered content', () => {
  const popup = document.implementation.createHTMLDocument('popup')
  const globalFontStyle = document.getElementById(DEVTOOLS_FONT_STYLE_ID)
  const globalForcedColorsStyle = document.getElementById(
    DEVTOOLS_FORCED_COLORS_STYLE_ID,
  )
  globalFontStyle?.remove()
  globalForcedColorsStyle?.remove()

  const host = popup.body.appendChild(popup.createElement('div'))
  const dispose = render(
    () =>
      createComponent(ThemeContextProvider, {
        theme: 'light',
        children: 'Popup content',
      }),
    host,
  )

  expect(popup.querySelector(`#${DEVTOOLS_FONT_STYLE_ID}`)).toBeTruthy()
  expect(
    popup.querySelector(`#${DEVTOOLS_FORCED_COLORS_STYLE_ID}`),
  ).toBeTruthy()
  expect(document.querySelector(`#${DEVTOOLS_FONT_STYLE_ID}`)).toBeNull()
  expect(
    document.querySelector(`#${DEVTOOLS_FORCED_COLORS_STYLE_ID}`),
  ).toBeNull()

  dispose()
  globalFontStyle && document.head.append(globalFontStyle)
  globalForcedColorsStyle && document.head.append(globalForcedColorsStyle)
})
