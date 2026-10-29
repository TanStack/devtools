import { createContext, render } from 'preact'
import { useContext, useState } from 'preact/hooks'
import { act } from 'preact/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TanStackDevtoolsCore } from '@tanstack/devtools'
import { TanStackDevtools } from '../src/devtools'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'

// The real core does a full Solid mount. The adapter only needs these methods.
vi.mock('@tanstack/devtools', () => ({
  TanStackDevtoolsCore: vi.fn(
    class {
      mount = vi.fn()
      unmount = vi.fn()
      setConfig = vi.fn()
    },
  ),
}))

const CoreMock = vi.mocked(TanStackDevtoolsCore)

const AppContext = createContext('default')

function Consumer() {
  return <span data-testid="value">{useContext(AppContext)}</span>
}

describe('TanStackDevtools (Preact adapter)', () => {
  const host = document.createElement('div')

  afterEach(() => {
    act(() => {
      render(null, host)
    })
    document.body.innerHTML = ''
    CoreMock.mockClear()
  })

  it('renders plugins with the context of the app', () => {
    let setValue: (value: string) => void = () => {}

    function App() {
      const [value, set] = useState('from app')
      setValue = set
      return (
        <AppContext.Provider value={value}>
          <TanStackDevtools
            plugins={[{ id: 'p', name: 'P', render: <Consumer /> }]}
          />
        </AppContext.Provider>
      )
    }

    act(() => {
      render(<App />, host)
    })

    const { plugins } = CoreMock.mock.calls[0]![0] as {
      plugins: Array<TanStackDevtoolsPlugin>
    }
    // The adapter only portals into containers it can find by id.
    const container = document.createElement('div')
    container.id = 'p'
    document.body.appendChild(container)

    act(() => {
      plugins[0]!.render(container, { theme: 'dark', devtoolsOpen: true })
    })
    expect(container.textContent).toBe('from app')

    act(() => {
      setValue('updated')
    })
    expect(container.textContent).toBe('updated')

    act(() => {
      render(null, host)
    })
    expect(container.textContent).toBe('')
  })
})
