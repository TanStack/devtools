import { createComponent } from 'solid-js'
import { render } from 'solid-js/web'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DevTools from '../src/devtools'
import { TanStackDevtoolsCore } from '../src/core'
import { DevtoolsProvider } from '../src/context/devtools-context'
import { PiPProvider } from '../src/context/pip-context'
import { mountDevtools } from '../src/mount-impl'
import type { TanStackDevtoolsConfig } from '../src/context/devtools-context'

vi.mock('../src/mount-impl', () => ({ mountDevtools: vi.fn() }))
const mockedMount = vi.mocked(mountDevtools)

const shellDisposers = new Map<HTMLElement, () => void>()
const mountShell = (config: Partial<TanStackDevtoolsConfig>) => {
  const host = document.body.appendChild(document.createElement('div'))
  const dispose = render(
    () =>
      createComponent(DevtoolsProvider, {
        plugins: [],
        config: config as TanStackDevtoolsConfig,
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
  shellDisposers.set(host, dispose)
  return host
}
const disposeShell = (host: HTMLElement) => {
  shellDisposers.get(host)?.()
  shellDisposers.delete(host)
  host.remove()
}

beforeEach(() => {
  localStorage.clear()
  history.replaceState({}, '', '/')
  mockedMount.mockReset()
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  for (const [host, dispose] of shellDisposers) {
    dispose()
    host.remove()
  }
  shellDisposers.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('devtools core boundaries', () => {
  it('preserves default and custom triggers', () => {
    const defaultHost = mountShell({})
    expect(
      document.querySelector('button[aria-label="Open TanStack Devtools"] img'),
    ).toHaveAttribute('alt', 'TanStack Devtools')
    disposeShell(defaultHost)
    const customTrigger = vi.fn((element: HTMLElement) => {
      element.textContent = 'Custom trigger'
    })
    const customHost = mountShell({ customTrigger })
    expect(document.body).toHaveTextContent('Custom trigger')
    expect(customTrigger).toHaveBeenCalledOnce()
    disposeShell(customHost)
  })

  it('preserves URL gating and the configured open hotkey', () => {
    const blocked = mountShell({
      requireUrlFlag: true,
      urlFlag: 'tanstack-devtools',
    })
    expect(
      document.querySelector('[aria-label="Open TanStack Devtools"]'),
    ).toBeNull()
    disposeShell(blocked)
    history.replaceState({}, '', '/?tanstack-devtools')
    mountShell({
      requireUrlFlag: true,
      urlFlag: 'tanstack-devtools',
      openHotkey: ['Control', '~'],
    })
    expect(
      document.querySelector('[aria-label="Open TanStack Devtools"]'),
    ).not.toBeNull()
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: '~',
        ctrlKey: true,
        bubbles: true,
      }),
    )
    expect(
      document.querySelector('[data-testid="tanstack-devtools-panel"]'),
    ).toHaveAttribute('data-open', 'true')
  })

  it('preserves copy-path source inspection', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const target = document.body.appendChild(document.createElement('button'))
    target.dataset.tsdSource = 'src/example.tsx:12:4'
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn().mockReturnValue(target),
    })
    mountShell({ inspectHotkey: ['Shift'], sourceAction: 'copy-path' })
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }),
    )
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 4, clientY: 4, bubbles: true }),
    )
    document.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    await Promise.resolve()
    expect(writeText).toHaveBeenCalledWith('src/example.tsx:12:4')
  })

  it('aborts a pending dynamic mount and resets after repeated mount errors', async () => {
    mockedMount.mockReturnValue({
      dispose: vi.fn(),
      eventBus: { stop: vi.fn() },
    })
    const host = document.createElement('div')
    const aborted = new TanStackDevtoolsCore({})
    aborted.mount(host)
    aborted.unmount()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockedMount).not.toHaveBeenCalled()

    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockedMount.mockImplementation(() => {
      throw new Error('render boom')
    })
    const failing = new TanStackDevtoolsCore({})
    failing.mount(host)
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1))
    failing.mount(host)
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(2))
    expect(() => failing.unmount()).toThrow('Devtools is not mounted')
  })
})
