import { createComponent } from 'solid-js'
import { render } from 'solid-js/web'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DevTools from '../src/devtools'
import { DevtoolsProvider } from '../src/context/devtools-context'
import { PiPProvider } from '../src/context/pip-context'
import { PluginSectionComponent } from '../src/tabs/marketplace/plugin-section'
import { TANSTACK_DEVTOOLS_STATE } from '../src/utils/storage'
import {
  DEVTOOLS_FONT_STYLE_ID,
  DEVTOOLS_FORCED_COLORS_STYLE_ID,
  resolveSemanticTheme,
} from '@tanstack/devtools-ui/internal'
import { ClientEventBus } from '@tanstack/devtools-event-bus/client'
import {
  PANEL_CLOSE_THRESHOLD,
  PANEL_MAX_VIEWPORT_RATIO,
  WORKBENCH_HEADER_HEIGHT,
} from '../src/utils/constants'
import type {
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
  TanStackDevtoolsPluginProps,
} from '../src/context/devtools-context'

const events: Array<string> = []
const disposers: Array<() => void> = []
const originalInnerWidth = window.innerWidth
const originalInnerHeight = window.innerHeight
let popup: Window

const plugin = (id: string): TanStackDevtoolsPlugin => ({
  id,
  name: (heading) => {
    heading.textContent = `Plugin ${id}`
  },
  render: (mount, props: TanStackDevtoolsPluginProps) => {
    events.push(`render:${id}:${props.theme}:${props.devtoolsOpen}`)
    mount.textContent = id
  },
  destroy: (pluginId) => events.push(`destroy:${pluginId}`),
})

const click = (name: string) => {
  const control = [
    ...document.querySelectorAll<HTMLElement>('button,[role="button"]'),
  ].find(
    (node) =>
      node.getAttribute('aria-label') === name ||
      node.textContent?.trim() === name,
  )
  expect(control, `missing control ${name}`).toBeTruthy()
  control!.click()
}

type AuthoredStyleRule = {
  conditions: Array<string>
  selector: string
  cssText: string
}

const collectStyleRules = (
  rules: CSSRuleList,
  conditions: Array<string> = [],
): Array<AuthoredStyleRule> =>
  [...rules].flatMap((rule) => {
    const grouping = rule as CSSRule & {
      cssRules?: CSSRuleList
      conditionText?: string
      media?: MediaList
    }
    if (grouping.cssRules) {
      const condition = grouping.conditionText || grouping.media?.mediaText
      const nestedRules = collectStyleRules(
        grouping.cssRules,
        condition ? [...conditions, condition] : conditions,
      )
      if (nestedRules.length > 0) return nestedRules

      const mediaText = grouping.media?.mediaText
      if (mediaText) {
        const body = rule.cssText
          .replace(/^@media[^{}]+\{/, '')
          .replace(/\}$/, '')
        return [...body.matchAll(/([^{}]+)\{([^{}]+)\}/g)].map((match) => ({
          conditions: [...conditions, mediaText],
          selector: match[1]!.trim(),
          cssText: `${match[1]!.trim()} { ${match[2]!.trim()} }`,
        }))
      }
    }
    const styleRule = rule as CSSStyleRule
    return styleRule.selectorText
      ? [
          {
            conditions,
            selector: String(styleRule.selectorText),
            cssText: rule.cssText,
          },
        ]
      : []
  })

const authoredStyleRules = () =>
  [...document.styleSheets].flatMap((sheet) => {
    try {
      return collectStyleRules(sheet.cssRules)
    } catch {
      return []
    }
  })

const mountWorkbench = (
  plugins: Array<TanStackDevtoolsPlugin>,
  config: Partial<TanStackDevtoolsConfig> = {},
) => {
  const host = document.body.appendChild(document.createElement('div'))
  const dispose = render(
    () =>
      createComponent(DevtoolsProvider, {
        plugins,
        config: { defaultOpen: true, ...config } as TanStackDevtoolsConfig,
        get children() {
          return createComponent(PiPProvider, {
            get children() {
              return createComponent(DevTools, {})
            },
          })
        },
      }),
    host,
  )
  disposers.push(dispose)
  return host
}

beforeEach(() => {
  events.length = 0
  localStorage.clear()
  delete document.documentElement.dataset.tanstackDevtoolsTheme
  history.replaceState({}, '', '/')
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  const popupDocument = document.implementation.createHTMLDocument('PiP')
  const listeners = new Map<string, EventListener>()
  popup = {
    document: popupDocument,
    close: vi.fn(),
    addEventListener: vi.fn((type: string, listener: EventListener) =>
      listeners.set(type, listener),
    ),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn((event: Event) => {
      listeners.get(event.type)?.(event)
      return true
    }),
  } as unknown as Window
  vi.spyOn(window, 'open').mockReturnValue(popup)
})

afterEach(() => {
  try {
    while (disposers.length) disposers.pop()!()
    document.body.replaceChildren()
  } finally {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    })
  }
})

describe('workbench', { timeout: 30_000 }, () => {
  it('keeps the secondary Plugins bar fixed-height without hover timers', () => {
    vi.useFakeTimers()
    expect({
      WORKBENCH_HEADER_HEIGHT,
      PANEL_CLOSE_THRESHOLD,
      PANEL_MAX_VIEWPORT_RATIO,
    }).toEqual({
      WORKBENCH_HEADER_HEIGHT: 36,
      PANEL_CLOSE_THRESHOLD: 70,
      PANEL_MAX_VIEWPORT_RATIO: 0.9,
    })
    mountWorkbench([plugin('one')])
    const strip = document.querySelector<HTMLElement>(
      '[data-testid="plugins-strip"]',
    )!
    expect(getComputedStyle(strip).height).toBe('44px')
    const timersBeforeInteraction = vi.getTimerCount()
    strip.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    strip.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    strip.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    strip.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(getComputedStyle(strip).height).toBe('44px')
    expect(vi.getTimerCount()).toBe(timersBeforeInteraction)
  })

  it('closes only after pointer resize crosses from 70px to 69px', () => {
    localStorage.setItem(
      TANSTACK_DEVTOOLS_STATE,
      JSON.stringify({
        activeTab: 'plugins',
        activePlugins: [],
        height: 70,
        persistOpen: true,
      }),
    )
    mountWorkbench([plugin('one'), plugin('two')], {
      panelLocation: 'bottom',
    })
    const outerPanel = document.querySelector<HTMLElement>(
      '[data-testid="tanstack-devtools-panel"]',
    )!
    const contentPanel = document.querySelector<HTMLElement>(
      '[data-testid="tanstack-devtools-content-panel"]',
    )!
    vi.spyOn(contentPanel, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 800,
      bottom: 70,
      left: 0,
      width: 800,
      height: 70,
      toJSON: () => ({}),
    })
    const separator = document.querySelector<HTMLElement>('[role="separator"]')!
    const down = new MouseEvent('mousedown', { button: 0, bubbles: true })
    Object.defineProperty(down, 'pageY', { value: 100 })
    separator.dispatchEvent(down)
    const move = new MouseEvent('mousemove', { bubbles: true })
    Object.defineProperty(move, 'pageY', { value: 101 })
    try {
      document.dispatchEvent(move)
      expect(
        JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!).height,
      ).toBe(69)
      expect(outerPanel).toHaveAttribute('data-open', 'false')
    } finally {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    }
  })

  it('uses document client width and never draws an always-visible panel edge', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    })
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
      1007,
    )
    mountWorkbench([plugin('one')])
    const outerPanel = document.querySelector<HTMLElement>(
      '[data-testid="tanstack-devtools-panel"]',
    )!
    const contentPanel = document.querySelector<HTMLElement>(
      '[data-testid="tanstack-devtools-content-panel"]',
    )!
    expect(outerPanel.style.inlineSize).toBe('1007px')
    expect(getComputedStyle(outerPanel).boxSizing).toBe('border-box')
    expect(getComputedStyle(outerPanel).borderTopStyle).toBe('none')
    expect(getComputedStyle(contentPanel).width).toBe('100%')
    expect(getComputedStyle(contentPanel).boxSizing).toBe('border-box')
  })

  it('tracks document client width changes without a window resize and disconnects its observer', () => {
    let width = 1007
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(
      () => width,
    )
    const observeRoot = vi.fn()
    const disconnectRoot = vi.fn()
    let observerCallback: ResizeObserverCallback | undefined
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        private readonly callback: ResizeObserverCallback
        private observesRoot = false

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback
        }
        observe = (element: Element) => {
          if (element !== document.documentElement) return
          this.observesRoot = true
          observerCallback = this.callback
          observeRoot(element)
        }
        unobserve() {}
        disconnect = () => {
          if (this.observesRoot) disconnectRoot()
        }
      },
    )

    mountWorkbench([plugin('one')])
    const outerPanel = document.querySelector<HTMLElement>(
      '[data-testid="tanstack-devtools-panel"]',
    )!
    expect(observeRoot).toHaveBeenCalledWith(document.documentElement)
    expect(outerPanel.style.inlineSize).toBe('1007px')

    width = 991
    observerCallback!([], {} as ResizeObserver)
    expect(outerPanel.style.inlineSize).toBe('991px')

    disposers.pop()!()
    expect(disconnectRoot).toHaveBeenCalledOnce()
  })

  it.each(['bottom', 'top'] as const)(
    'collapses and restores the %s drawer without changing height or plugin lifecycle',
    (panelLocation) => {
      localStorage.setItem(
        TANSTACK_DEVTOOLS_STATE,
        JSON.stringify({
          activeTab: 'plugins',
          activePlugins: ['one'],
          height: 417,
          persistOpen: true,
        }),
      )
      mountWorkbench([plugin('one')], { panelLocation })
      const outerPanel = document.querySelector<HTMLElement>(
        '[data-testid="tanstack-devtools-panel"]',
      )!
      const storedBefore = localStorage.getItem(TANSTACK_DEVTOOLS_STATE)
      const collapse = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Collapse TanStack Devtools drawer"]',
      )!

      expect(collapse).toHaveAttribute('type', 'button')
      expect(collapse).toHaveAttribute('data-tsd-control')
      expect(collapse).toHaveAttribute('aria-expanded', 'true')
      expect(collapse).toHaveAttribute('data-panel-location', panelLocation)
      collapse.click()
      expect(outerPanel).toHaveAttribute('data-open', 'true')
      expect(outerPanel).toHaveAttribute('data-collapsed', 'true')
      expect(outerPanel.style.transform).toBe(
        panelLocation === 'top' ? 'translateY(-100%)' : 'translateY(100%)',
      )
      expect(collapse).toHaveAttribute(
        'aria-label',
        'Expand TanStack Devtools drawer',
      )
      expect(collapse).toHaveAttribute('aria-expanded', 'false')
      expect(
        document.querySelector('[data-testid="devtools-drawer-content"]'),
      ).toHaveAttribute('aria-hidden', 'true')
      expect(
        document.querySelector('[data-testid="devtools-drawer-content"]'),
      ).toHaveAttribute('inert')
      expect(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)).toBe(storedBefore)
      expect(document.querySelector('[data-plugin-mount]')).not.toBeNull()
      expect(events).not.toContain('destroy:one')

      collapse.click()
      expect(outerPanel).toHaveAttribute('data-collapsed', 'false')
      expect(outerPanel.style.height).toBe('417px')
      expect(outerPanel.style.transform).toBe('translateY(0px)')
      expect(
        document.querySelector('[data-testid="devtools-drawer-content"]'),
      ).not.toHaveAttribute('aria-hidden')
      expect(
        document.querySelector('[data-testid="devtools-drawer-content"]'),
      ).not.toHaveAttribute('inert')
      expect(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)).toBe(storedBefore)
      expect(events).not.toContain('destroy:one')
    },
  )

  it.each([
    [
      'the trigger',
      () => {
        click('Close TanStack Devtools')
        click('Open TanStack Devtools')
      },
    ],
    [
      'the open hotkey',
      () => {
        click('Close TanStack Devtools')
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: '~',
            ctrlKey: true,
            bubbles: true,
          }),
        )
      },
    ],
  ] as const)(
    'expands a collapsed drawer when Devtools opens through %s',
    async (_, openDevtools) => {
      mountWorkbench([plugin('one')])
      await Promise.resolve()
      const outerPanel = document.querySelector<HTMLElement>(
        '[data-testid="tanstack-devtools-panel"]',
      )!
      const collapse = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Collapse TanStack Devtools drawer"]',
      )!

      collapse.click()
      expect(outerPanel).toHaveAttribute('data-collapsed', 'true')

      openDevtools()
      expect(outerPanel).toHaveAttribute('data-open', 'true')
      expect(outerPanel).toHaveAttribute('data-collapsed', 'false')
    },
  )

  it('expands a collapsed drawer when an external event opens Devtools', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.resetModules()
    const [
      { default: EventDrivenDevTools },
      { DevtoolsProvider: EventDrivenDevtoolsProvider },
      { PiPProvider: EventDrivenPiPProvider },
    ] = await Promise.all([
      import('../src/devtools'),
      import('../src/context/devtools-context'),
      import('../src/context/pip-context'),
    ])
    const eventBus = new ClientEventBus()
    eventBus.start()
    try {
      const host = document.body.appendChild(document.createElement('div'))
      const dispose = render(
        () =>
          createComponent(EventDrivenDevtoolsProvider, {
            plugins: [plugin('one')],
            config: { defaultOpen: true } as TanStackDevtoolsConfig,
            get children() {
              return createComponent(EventDrivenPiPProvider, {
                get children() {
                  return createComponent(EventDrivenDevTools, {})
                },
              })
            },
          }),
        host,
      )
      disposers.push(dispose)
      const outerPanel = document.querySelector<HTMLElement>(
        '[data-testid="tanstack-devtools-panel"]',
      )!
      const collapse = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Collapse TanStack Devtools drawer"]',
      )!

      collapse.click()
      expect(outerPanel).toHaveAttribute('data-collapsed', 'true')

      window.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'tanstack-devtools-core:trigger-toggled',
            payload: { isOpen: true },
            pluginId: 'tanstack-devtools-core',
          },
        }),
      )

      expect(outerPanel).toHaveAttribute('data-collapsed', 'false')
    } finally {
      eventBus.stop()
    }
  })

  it.each([
    ['bottom', 'ArrowUp', 410],
    ['bottom', 'ArrowDown', 390],
    ['top', 'ArrowDown', 410],
    ['top', 'ArrowUp', 390],
  ] as const)('resizes a %s panel with %s', (panelLocation, key, expected) => {
    mountWorkbench([plugin('one')], { panelLocation })
    const separator = document.querySelector<HTMLElement>('[role="separator"]')!
    separator.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true }),
    )
    expect(separator).toHaveAttribute('aria-valuenow', String(expected))
    expect(separator).toHaveAttribute('data-tsd-control')
    expect(separator).toHaveAttribute('data-tsd-separator')
  })

  it('supports Shift, Home, End, 90% clamp, and PiP stylesheet installation', () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
    })
    mountWorkbench([plugin('one')])
    const separator = document.querySelector<HTMLElement>('[role="separator"]')!
    separator.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        shiftKey: true,
        bubbles: true,
      }),
    )
    expect(separator).toHaveAttribute('aria-valuenow', '450')
    separator.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    )
    expect(separator).toHaveAttribute('aria-valuenow', '70')
    separator.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    )
    expect(separator).toHaveAttribute('aria-valuenow', '900')
    const attachedHeight = JSON.parse(
      localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!,
    ).height
    click('Detach TanStack Devtools')
    expect(popup.document.querySelector('[role="separator"]')).toBeNull()
    expect(popup.document.getElementById(DEVTOOLS_FONT_STYLE_ID)).not.toBeNull()
    expect(
      popup.document.getElementById(DEVTOOLS_FORCED_COLORS_STYLE_ID),
    ).not.toBeNull()
    popup.dispatchEvent(new Event('pagehide'))
    expect(
      JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!).height,
    ).toBe(attachedHeight)
  })

  it('moves the theme attribute into PiP and restores the main document on close', () => {
    document.documentElement.dataset.tanstackDevtoolsTheme = 'host'
    mountWorkbench([plugin('one')], { theme: 'dark' })
    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('dark')

    click('Detach TanStack Devtools')
    expect(popup.document.documentElement.dataset.tanstackDevtoolsTheme).toBe(
      'dark',
    )
    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('host')

    popup.dispatchEvent(new Event('pagehide'))
    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('dark')
  })

  it('keeps the active theme when another Devtools instance unmounts', () => {
    document.documentElement.dataset.tanstackDevtoolsTheme = 'host'
    mountWorkbench([plugin('one')], { theme: 'light' })
    mountWorkbench([plugin('two')], { theme: 'dark' })
    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('dark')

    disposers.pop()!()
    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('light')

    disposers.pop()!()
    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('host')
  })

  it('authors the 360px wordmark and reduced-motion CSS without JS state flags', () => {
    mountWorkbench([plugin('one')])
    const header = document.querySelector('[data-testid="workbench-header"]')!
    const wordmark = document.querySelector<HTMLElement>(
      '[data-testid="workbench-wordmark"]',
    )!
    expect(header).toHaveAttribute('aria-label', 'TanStack Devtools')
    const rules = authoredStyleRules()
    const wordmarkClasses = [...wordmark.classList]
    expect(
      rules.some(
        (rule) =>
          rule.conditions.some((condition) =>
            /max-width:\s*360px/i.test(condition),
          ) &&
          wordmarkClasses.some((className) =>
            rule.selector.includes(`.${className}`),
          ) &&
          /display:\s*none/i.test(rule.cssText),
      ),
    ).toBe(true)
    expect(
      rules.some(
        (rule) =>
          rule.conditions.some((condition) =>
            /prefers-reduced-motion:\s*reduce/i.test(condition),
          ) && /transition-duration:\s*0ms/i.test(rule.cssText),
      ),
    ).toBe(true)
  })

  it('keeps the workbench destinations ghosted, identifiable, and destination-scoped', () => {
    mountWorkbench([plugin('one')])
    const header = document.querySelector<HTMLElement>(
      '[data-testid="workbench-header"]',
    )!
    const logo = header.querySelector<HTMLImageElement>(
      'img[alt="TanStack Devtools"]',
    )!
    const plugins = [
      ...header.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'Plugins')!
    const seo = [...header.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.trim() === 'SEO',
    )!
    const settings = header.querySelector<HTMLButtonElement>(
      'button[aria-label="Settings"]',
    )!

    expect(logo.getAttribute('src')).toMatch(/tanstack-logo\.png/)
    expect(settings).toHaveAttribute('title', 'Settings')
    expect(settings.textContent?.trim()).toBe('')
    expect(settings.querySelector('svg')).not.toBeNull()
    for (const action of header.querySelectorAll<HTMLButtonElement>('button')) {
      expect(getComputedStyle(action).borderStyle).toBe('none')
      if (action.hasAttribute('data-tsd-selected')) {
        expect(getComputedStyle(action).backgroundColor).not.toBe(
          'rgba(0, 0, 0, 0)',
        )
      } else {
        expect(getComputedStyle(action).backgroundColor).toBe(
          'rgba(0, 0, 0, 0)',
        )
      }
    }

    expect(plugins).toHaveAttribute('data-tsd-selected', 'true')
    expect(
      document.querySelector('[data-testid="plugins-strip"]'),
    ).not.toBeNull()
    seo.click()
    expect(seo).toHaveAttribute('data-tsd-selected', 'true')
    expect(plugins).not.toHaveAttribute('data-tsd-selected')
    expect(document.querySelector('[data-testid="plugins-strip"]')).toBeNull()
    settings.click()
    expect(settings).toHaveAttribute('data-tsd-selected', 'true')
    expect(seo).not.toHaveAttribute('data-tsd-selected')
    expect(document.querySelector('[data-testid="plugins-strip"]')).toBeNull()
  })

  it('promotes Marketplace to the main nav and uses the approved cogs settings icon', () => {
    mountWorkbench([plugin('one')])
    const header = document.querySelector<HTMLElement>(
      '[data-testid="workbench-header"]',
    )!
    const destinations = header.querySelector<HTMLElement>(
      '[data-testid="workbench-destinations"]',
    )!
    const marketplace = [
      ...destinations.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'Marketplace')!
    const plugins = [
      ...destinations.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'Plugins')!
    const strip = document.querySelector<HTMLElement>(
      '[data-testid="plugins-strip"]',
    )!
    const activePluginsBefore = localStorage.getItem(TANSTACK_DEVTOOLS_STATE)

    expect(marketplace).toBeInTheDocument()
    expect(
      [...strip.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'Marketplace',
      ),
    ).toBe(false)
    marketplace.click()
    expect(marketplace).toHaveAttribute('aria-current', 'page')
    expect(marketplace).toHaveAttribute('data-tsd-selected', 'true')
    expect(plugins).not.toHaveAttribute('data-tsd-selected')
    expect(getComputedStyle(marketplace).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    expect(document.querySelector('[data-testid="plugins-strip"]')).toBeNull()
    expect(
      document.querySelector('[data-testid="plugin-marketplace"]'),
    ).toBeInTheDocument()
    expect(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)).toBe(
      activePluginsBefore,
    )
    expect(events).not.toContain('destroy:one')

    const settings = header.querySelector<HTMLButtonElement>(
      'button[aria-label="Settings"]',
    )!
    expect(settings).toHaveAttribute('title', 'Settings')
    expect(settings).toHaveAttribute('data-icon', 'cogs')
    expect(settings.querySelector('svg')).not.toBeNull()

    plugins.click()
    expect(
      document.querySelector('[data-testid="plugins-strip"]'),
    ).not.toBeNull()
    expect(document.querySelector('[data-plugin-mount]')).not.toBeNull()
    expect(events).not.toContain('destroy:one')
  })

  it('connects the active destination to the strip and preserves header edge geometry', () => {
    mountWorkbench([plugin('one')], { theme: 'dark' })
    const header = document.querySelector<HTMLElement>(
      '[data-testid="workbench-header"]',
    )!
    const plugins = [
      ...header.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'Plugins')!
    const seo = [...header.querySelectorAll<HTMLButtonElement>('button')].find(
      (button) => button.textContent?.trim() === 'SEO',
    )!
    const marketplace = [
      ...header.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'Marketplace')!
    const actions = [
      'Settings',
      'Detach TanStack Devtools',
      'Close TanStack Devtools',
    ].map((label) =>
      header.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`),
    )
    const strip = document.querySelector<HTMLElement>(
      '[data-testid="plugins-strip"]',
    )!
    const logo = header.querySelector<HTMLImageElement>(
      'img[alt="TanStack Devtools"]',
    )!
    const destinations = header.querySelector<HTMLElement>(
      '[data-testid="workbench-destinations"]',
    )!

    expect(getComputedStyle(header).paddingRight).toBe('8px')
    expect(getComputedStyle(destinations).display).toBe('inline-flex')
    expect(Number.parseFloat(getComputedStyle(destinations).gap)).toBe(0)
    expect(plugins.parentElement).toBe(destinations)
    expect(marketplace.parentElement).toBe(destinations)
    expect(seo.parentElement).toBe(destinations)
    for (const destination of [plugins, marketplace, seo]) {
      expect(getComputedStyle(destination).paddingInline).toBe('12px')
    }
    for (const action of actions) {
      expect(action).not.toBeNull()
      expect(getComputedStyle(action!).width).toBe('36px')
      expect(getComputedStyle(action!).height).toBe('36px')
    }
    expect(getComputedStyle(plugins).backgroundColor).toBe(
      getComputedStyle(strip).backgroundColor,
    )
    expect(getComputedStyle(plugins).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    )
    expect(getComputedStyle(seo).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(getComputedStyle(logo).filter).not.toBe('none')
    const stripClass = [...strip.classList][0]!
    const headerClass = [...header.classList][0]!
    expect(
      authoredStyleRules().some(
        (rule) =>
          rule.selector.includes(`.${headerClass} button:hover`) &&
          /:not\(\[data-tsd-selected=["']true["']\]\)/.test(rule.selector),
      ),
    ).toBe(true)
    expect(
      authoredStyleRules().some(
        (rule) =>
          rule.selector.includes(`.${stripClass}`) &&
          /height:\s*44px/i.test(rule.cssText) &&
          /padding-block:\s*6px/i.test(rule.cssText) &&
          /padding-inline-end:\s*8px/i.test(rule.cssText) &&
          /scroll-padding-inline-end:\s*8px/i.test(rule.cssText),
      ),
    ).toBe(true)
    expect(
      authoredStyleRules().some(
        (rule) =>
          rule.conditions.some((condition) =>
            /max-width:\s*361px/i.test(condition),
          ) &&
          rule.selector.includes(`.${plugins.className}`) &&
          /padding-inline:\s*4px/i.test(rule.cssText),
      ),
    ).toBe(true)
  })

  it('reveals the resize line immediately and keeps trigger hover free of image outlines', () => {
    mountWorkbench([plugin('one')])
    const resize = document.querySelector<HTMLElement>(
      '[data-tsd-separator="resize"]',
    )!
    const resizeClass = [...resize.classList][0]!
    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Open TanStack Devtools"]',
    )!
    const triggerClasses = [...trigger.classList]
    const rules = authoredStyleRules()

    expect(getComputedStyle(resize).height).toBe('24px')
    expect(
      rules.some(
        (rule) =>
          rule.selector.includes(`.${resizeClass}:focus-visible`) &&
          /outline:/i.test(rule.cssText),
      ),
    ).toBe(false)
    expect(
      rules.some(
        (rule) =>
          rule.selector.includes(`.${resizeClass}::after`) &&
          !rule.selector.includes(':hover') &&
          !rule.selector.includes(':focus-visible') &&
          /background-color:\s*transparent/i.test(rule.cssText),
      ),
    ).toBe(true)
    for (const state of [':hover', ':focus-visible']) {
      expect(
        rules.some(
          (rule) =>
            rule.selector.includes(`.${resizeClass}${state}::after`) &&
            /background-color:/i.test(rule.cssText) &&
            !/transparent/i.test(rule.cssText),
        ),
      ).toBe(true)
    }
    expect(
      rules.some(
        (rule) =>
          triggerClasses.some((className) =>
            rule.selector.includes(`.${className}:focus-visible`),
          ) && /outline:/i.test(rule.cssText),
      ),
    ).toBe(true)
    expect(
      rules.some(
        (rule) =>
          triggerClasses.some((className) =>
            rule.selector.includes(`.${className} > img:hover`),
          ) && /outline:/i.test(rule.cssText),
      ),
    ).toBe(false)
  })

  it('adds the strip grid row only while the Plugins destination renders it', () => {
    mountWorkbench([plugin('one')])
    const panel = document.querySelector<HTMLElement>(
      '[data-testid="tanstack-devtools-content-panel"]',
    )!
    const panelClass = [...panel.classList][0]!
    const panelRules = authoredStyleRules().filter((rule) =>
      rule.selector.includes(`.${panelClass}`),
    )
    const baseRule = panelRules.find(
      (rule) =>
        !rule.selector.includes(':has(') &&
        /grid-template-rows/i.test(rule.cssText),
    )!
    const stripRule = panelRules.find(
      (rule) =>
        rule.selector.includes(':has(') &&
        /grid-template-rows/i.test(rule.cssText),
    )!

    expect(baseRule.cssText).toMatch(
      /grid-template-rows:\s*36px\s+minmax\(0,\s*1fr\)/i,
    )
    expect(stripRule.cssText).toMatch(
      /grid-template-rows:\s*36px\s+44px\s+minmax\(0,\s*1fr\)/i,
    )
  })

  it('keeps a focused plugin title visible in the horizontal strip', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    try {
      mountWorkbench(['one', 'two', 'three', 'four'].map(plugin))
      const title = document.querySelector<HTMLButtonElement>(
        '[aria-labelledby="plugin-title-container-four"]',
      )!
      title.focus()
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      })
    } finally {
      delete (HTMLElement.prototype as { scrollIntoView?: unknown })
        .scrollIntoView
    }
  })

  it('makes each mounted plugin pane independently vertically scrollable', () => {
    mountWorkbench([plugin('one')])
    const workspace = document.querySelector<HTMLElement>(
      '[data-testid="plugins-workspace"]',
    )!
    const pane = document.querySelector<HTMLElement>('[data-plugin-mount]')!
    expect(workspace.style.height).toBe('100%')
    expect(workspace.style.minHeight).toBe('0px')
    expect(workspace.style.overflow).toBe('hidden')
    expect(getComputedStyle(pane).overflowY).toBe('auto')
  })

  it('keeps pane sizing on the core mount frame without clamping plugin-owned descendants', () => {
    const owned = plugin('owned-layout')
    owned.render = (mount) => {
      const child = document.createElement('section')
      child.dataset.pluginOwnedLayout = 'true'
      child.style.display = 'inline-block'
      mount.append(child)
    }
    mountWorkbench([owned])

    const pane = document.querySelector<HTMLElement>('[data-plugin-mount]')!
    const child = pane.querySelector<HTMLElement>('[data-plugin-owned-layout]')!
    const paneClass = pane.className.split(/\s+/).find(Boolean)!
    const descendantRules = authoredStyleRules().filter(
      (rule) =>
        rule.selector.includes(`.${paneClass}`) && rule.selector.includes('>'),
    )

    expect(getComputedStyle(pane).overflowY).toBe('auto')
    expect(child.style.display).toBe('inline-block')
    expect(getComputedStyle(child).width).not.toBe('100%')
    expect(getComputedStyle(child).height).not.toBe('100%')
    expect(descendantRules).toEqual([])
  })

  it('constrains Settings to the workspace row so its panel can scroll', () => {
    mountWorkbench([plugin('one')])
    click('Settings')
    const workspace = document.querySelector<HTMLElement>(
      '[data-testid="settings-workspace"]',
    )!
    expect(workspace.style.height).toBe('100%')
    expect(workspace.style.minHeight).toBe('0px')
    expect(getComputedStyle(workspace.firstElementChild!).overflowY).toBe(
      'auto',
    )
  })

  it('keeps Marketplace search and settings in one shrinkable control row', () => {
    mountWorkbench([plugin('one')])
    click('Marketplace')
    const controls = document.querySelector<HTMLElement>(
      '[data-testid="marketplace-controls"]',
    )!
    const searchWrapper = document.querySelector<HTMLInputElement>(
      'input[aria-label="Search plugins"]',
    )!.parentElement!
    expect(controls).not.toBeNull()
    expect(getComputedStyle(controls).minWidth).toBe('0')
    expect(getComputedStyle(controls).width).toBe('100%')
    expect(getComputedStyle(searchWrapper).flexShrink).toBe('1')
  })

  it('constrains Marketplace to the workspace row so its catalog can scroll', () => {
    mountWorkbench([plugin('one')])
    click('Marketplace')
    const workspace = document.querySelector<HTMLElement>(
      '[data-testid="plugin-marketplace"]',
    )!
    expect(workspace.style.height).toBe('100%')
    expect(workspace.style.minHeight).toBe('0px')
    expect(getComputedStyle(workspace.firstElementChild!).overflowY).toBe(
      'auto',
    )
  })

  it.each(['light', 'dark'] as const)(
    'keeps the Marketplace feature banner separated from its cards by the semantic section gap in %s mode',
    (theme) => {
      const host = document.body.appendChild(document.createElement('div'))
      disposers.push(
        render(
          () =>
            createComponent(DevtoolsProvider, {
              plugins: [],
              config: {
                defaultOpen: true,
                theme,
              } as TanStackDevtoolsConfig,
              get children() {
                return createComponent(PluginSectionComponent, {
                  section: {
                    id: 'featured',
                    displayName: 'Featured',
                    cards: [],
                  },
                  isCollapsed: () => false,
                  onToggleCollapse: vi.fn(),
                  onCardAction: vi.fn(),
                })
              },
            }),
          host,
        ),
      )

      const title = [...document.querySelectorAll('h4')].find((heading) =>
        heading.textContent?.includes('Want to be featured here?'),
      )!
      const banner = title.parentElement!.parentElement as HTMLElement
      const cards = banner.nextElementSibling as HTMLElement
      const content = banner.parentElement as HTMLElement

      expect(cards).not.toBeNull()
      expect(getComputedStyle(content).display).toBe('flex')
      expect(getComputedStyle(content).flexDirection).toBe('column')
      expect(getComputedStyle(content).gap).toBe(
        resolveSemanticTheme(theme).gap.sectionLarge,
      )
      expect(getComputedStyle(banner).marginTop).toBe('0px')
    },
  )

  it('preserves destination transitions and rejects a fourth plugin without destroying', () => {
    mountWorkbench(['one', 'two', 'three', 'four'].map(plugin))
    for (const name of ['Plugin one', 'Plugin two', 'Plugin three']) click(name)
    expect(
      [...document.querySelectorAll('[id^="plugin-container-"]')].map(
        (node) => node.id,
      ),
    ).toEqual([
      'plugin-container-one',
      'plugin-container-two',
      'plugin-container-three',
    ])
    expect(
      document.querySelectorAll('[data-tsd-separator="plugin-pane"]'),
    ).toHaveLength(2)
    for (const destination of ['SEO', 'Settings', 'Plugins']) {
      click(destination)
      expect(
        [...document.querySelectorAll<HTMLButtonElement>('button')].find(
          (button) =>
            button.getAttribute('aria-label') === destination ||
            button.textContent?.trim() === destination,
        ),
      ).toHaveAttribute('data-tsd-selected', 'true')
      if (destination !== 'Plugins') click('Plugins')
      click('Plugin four')
      expect(
        document.querySelector('#plugin-container-four'),
      ).not.toBeInTheDocument()
      expect(events).not.toContain('destroy:one')
    }
    click('Plugin two')
    expect(events).toContain('destroy:two')
    expect(
      document.querySelector('#plugin-container-two'),
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      plugins: [],
      message: 'Browse Marketplace to discover available plugins.',
    },
    {
      plugins: [plugin('one'), plugin('two')],
      message: 'Select a plugin to open it',
    },
  ])('renders the registered-plugin zero state', ({ plugins, message }) => {
    mountWorkbench(plugins)
    expect(document.body).toHaveTextContent(message)
    if (plugins.length === 0) {
      expect(
        [...document.querySelectorAll('button,[role="button"]')].some(
          (node) => node.textContent?.trim() === 'Browse Marketplace',
        ),
      ).toBe(false)
    }
  })

  it('auto-activates one registered plugin and preserves its destroy lifecycle', () => {
    mountWorkbench([plugin('one')])
    expect(
      JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!).activePlugins,
    ).toEqual(['one'])
    expect(
      events.filter((event) => event.startsWith('render:one:')),
    ).toHaveLength(1)
    click('Plugin one')
    expect(
      JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!).activePlugins,
    ).toEqual([])
    expect(events.filter((event) => event === 'destroy:one')).toHaveLength(1)
  })

  it('preserves live callback targets, exact IDs, and activation render order', () => {
    mountWorkbench([plugin('one'), plugin('two')])
    expect(
      document.querySelector('#plugin-title-container-one'),
    ).toHaveTextContent('Plugin one')
    click('Plugin one')
    click('Plugin two')
    expect(
      events
        .filter((event) => event.startsWith('render:'))
        .map((event) => event.split(':')[1]),
    ).toEqual(['one', 'one', 'two'])
  })

  it('styles string title controls semantically while isolating callback title resets', () => {
    const stringTitle: TanStackDevtoolsPlugin = {
      id: 'string',
      name: 'String title',
      render: () => {},
    }
    const callbackTitle = plugin('callback')
    mountWorkbench([stringTitle, callbackTitle], { theme: 'dark' })

    const stringControl = document.querySelector<HTMLElement>(
      '[data-plugin-title-control][aria-labelledby="plugin-title-container-string"]',
    )!
    const callbackHeading = document.querySelector<HTMLElement>(
      '#plugin-title-container-callback',
    )!
    const stringHeading = document.querySelector<HTMLElement>(
      '#plugin-title-container-string',
    )!

    expect(document.documentElement.dataset.tanstackDevtoolsTheme).toBe('dark')
    stringControl.click()
    expect(stringControl).toHaveAttribute('data-tsd-selected', 'true')
    expect(stringControl.className).not.toBe('')
    expect(stringHeading.getAttribute('style')).toBeNull()
    expect(callbackHeading.style.all).toBe('initial')
    expect(
      authoredStyleRules().some(
        (rule) =>
          rule.selector.includes(`.${stringControl.className}`) &&
          /:hover/.test(rule.selector) &&
          /background/.test(rule.cssText),
      ),
    ).toBe(true)
    expect(
      authoredStyleRules().some(
        (rule) =>
          rule.selector.includes(`.${stringControl.className}`) &&
          /:focus-visible/.test(rule.selector) &&
          /outline:\s*2px/.test(rule.cssText),
      ),
    ).toBe(true)
  })

  it('surfaces a plugin title callback failure during mount', () => {
    const bad = plugin('bad')
    bad.name = () => {
      throw new Error('name boom')
    }
    expect(() => mountWorkbench([bad])).toThrow('name boom')
  })

  it('moves among Marketplace and core destinations without plugin destruction', () => {
    mountWorkbench([plugin('one')])
    const activeBefore = JSON.parse(
      localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!,
    ).activePlugins
    expect(activeBefore).toEqual(['one'])
    click('Marketplace')
    expect(
      document.querySelector('[data-testid="plugin-marketplace"]'),
    ).toBeInTheDocument()
    expect(
      JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!).activePlugins,
    ).toEqual(activeBefore)
    click('Settings')
    click('Plugins')
    expect(
      document.querySelector('[data-testid="plugin-marketplace"]'),
    ).not.toBeInTheDocument()
    expect(events).not.toContain('destroy:one')
  })

  it('preserves active IDs across Close, Escape, theme change, and reopen render effects', () => {
    mountWorkbench([plugin('one')])
    click('Close TanStack Devtools')
    click('Open TanStack Devtools')
    click('Settings')
    expect(
      document.querySelector('button[aria-label="Settings"]'),
    ).toHaveAttribute('data-tsd-selected', 'true')
    expect(
      document.querySelector('[data-testid="settings-workspace"]'),
    ).toBeInTheDocument()
    const themeLabel = [...document.querySelectorAll('label')].find(
      (label) => label.textContent?.trim() === 'Theme',
    )!
    const theme = document.getElementById(
      themeLabel.htmlFor,
    ) as HTMLSelectElement
    theme.value = 'dark'
    theme.dispatchEvent(new Event('change', { bubbles: true }))
    click('Plugins')
    expect(events).toContain('render:one:dark:true')
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(
      JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_STATE)!).activePlugins,
    ).toEqual(['one'])
    expect(events).toContain('render:one:dark:false')
    expect(events).not.toContain('destroy:one')
  })

  it('keeps equal-width frames and static separators for three active plugins', () => {
    mountWorkbench(['one', 'two', 'three'].map(plugin))
    for (const name of ['Plugin one', 'Plugin two', 'Plugin three']) click(name)
    const panes = [
      ...document.querySelectorAll<HTMLElement>('[data-plugin-mount]'),
    ]
    expect(panes).toHaveLength(3)
    for (const pane of panes) {
      expect(pane.style.flex).toBe('1 1 0px')
      expect(pane.style.minWidth).toBe('0px')
    }
    expect(
      document.querySelectorAll('[data-tsd-separator="plugin-pane"]'),
    ).toHaveLength(2)
  })

  it('keeps callback title resets isolated from the semantic control wrapper', () => {
    const owned = plugin('owned')
    owned.name = (title) => {
      if (title.querySelector('[data-callback-title]')) return
      const child = document.createElement('span')
      child.dataset.callbackTitle = 'true'
      child.textContent = 'Owned title'
      title.append(child)
    }
    mountWorkbench([owned, plugin('other')])
    const title = document.querySelector<HTMLElement>(
      '#plugin-title-container-owned',
    )!
    const wrapper = title.closest<HTMLElement>('[data-plugin-title-control]')!
    expect(title.style.all).toBe('initial')
    expect(wrapper.style.all).toBe('')
    expect(wrapper.className).not.toBe('')
  })

  it('surfaces an auto-active plugin render failure during mount', () => {
    const bad = plugin('bad')
    bad.render = () => {
      throw new Error('render boom')
    }
    expect(() => mountWorkbench([bad])).toThrow('render boom')
  })
})
