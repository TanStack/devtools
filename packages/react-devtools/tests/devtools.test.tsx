import '@testing-library/jest-dom/vitest'
import React from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TanStackDevtoolsCore } from '@tanstack/devtools'
import { TanStackDevtools } from '../src/devtools'
import type {
  TanStackDevtoolsPlugin,
  TanStackDevtoolsPluginProps,
} from '@tanstack/devtools'

// The real core does a full Solid DOM mount which is heavy in jsdom. Mock it
// down to the methods the React adapter actually calls (constructor + mount +
// unmount + setConfig), so we can drive the portal wiring in isolation.
vi.mock('@tanstack/devtools', () => ({
  TanStackDevtoolsCore: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    setConfig: vi.fn(),
  })),
}))

const CoreMock = vi.mocked(TanStackDevtoolsCore)

describe('TanStackDevtools (React adapter)', () => {
  beforeEach(() => {
    CoreMock.mockClear()
  })

  afterEach(() => {
    document.querySelectorAll('#p').forEach((el) => el.remove())
  })

  it('constructs the core, mounts into the ref div, portals the plugin element, and unmounts', () => {
    let unmount: () => void = () => {}

    act(() => {
      const result = render(
        <TanStackDevtools
          plugins={[{ id: 'p', name: 'P', render: <div data-testid="x" /> }]}
        />,
      )
      unmount = result.unmount
    })

    // Constructed exactly once.
    expect(CoreMock).toHaveBeenCalledTimes(1)

    const coreInstance = CoreMock.mock.results[0]!.value as {
      mount: ReturnType<typeof vi.fn>
      unmount: ReturnType<typeof vi.fn>
      setConfig: ReturnType<typeof vi.fn>
    }

    // mount() was called with the ref div the adapter renders.
    expect(coreInstance.mount).toHaveBeenCalledTimes(1)
    const mountTarget = coreInstance.mount.mock.calls[0]![0] as HTMLElement
    expect(mountTarget).toBeInstanceOf(HTMLDivElement)

    // Grab the plugins the adapter passed to the core constructor.
    const ctorArg = CoreMock.mock.calls[0]![0] as {
      plugins: Array<TanStackDevtoolsPlugin>
    }
    const corePlugin = ctorArg.plugins[0]!
    expect(corePlugin.id).toBe('p')

    // The container is only registered if the element is findable by id in the
    // owner document (adapter does `e.ownerDocument.getElementById(id)`), so the
    // fake element must carry id='p' and live in the document.
    const fakeEl = document.createElement('div')
    fakeEl.setAttribute('id', 'p')
    document.body.appendChild(fakeEl)

    const props: TanStackDevtoolsPluginProps = {
      theme: 'dark',
      devtoolsOpen: true,
    }

    // Drive the adapter's render callback: convertRender -> setPluginContainers
    // + setPluginComponents, which then portals the React element into fakeEl.
    act(() => {
      ;(corePlugin.render as (el: HTMLElement, props: any) => void)(
        fakeEl,
        props,
      )
    })

    // The plugin React element is portaled into the core-provided container.
    expect(fakeEl.querySelector('[data-testid="x"]')).toBeInTheDocument()

    // Unmounting tears down the core and throws nothing.
    expect(() => {
      act(() => {
        unmount()
      })
    }).not.toThrow()
    expect(coreInstance.unmount).toHaveBeenCalledTimes(1)
  })
})
