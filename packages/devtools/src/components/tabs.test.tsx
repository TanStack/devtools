import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { DevtoolsProvider } from '../context/devtools-context'
import { DrawClientProvider } from '../context/draw-context'
import { PiPProvider } from '../context/pip-context'
import { createDevtoolsState } from '../context/use-devtools-context'
import { Tabs } from './tabs'

describe('Tabs', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a button for every tab plus the pip and close buttons', () => {
    const { getByTestId } = render(() => (
      <DevtoolsProvider>
        <DrawClientProvider animationMs={300}>
          <PiPProvider>
            <Tabs toggleOpen={() => {}} />
          </PiPProvider>
        </DrawClientProvider>
      </DevtoolsProvider>
    ))

    expect(getByTestId('tsd-tab-plugins')).toBeInTheDocument()
    expect(getByTestId('tsd-tab-seo')).toBeInTheDocument()
    expect(getByTestId('tsd-tab-settings')).toBeInTheDocument()
    // Default pipWindow() === null, so these two render.
    expect(getByTestId('tsd-pip-button')).toBeInTheDocument()
    expect(getByTestId('tsd-close-button')).toBeInTheDocument()
  })

  it('marks the default active tab and moves the active class on store mutation', () => {
    // Capture the state setter from inside the provider tree.
    let setState!: ReturnType<typeof createDevtoolsState>['setState']
    const StateProbe = () => {
      setState = createDevtoolsState().setState
      return null
    }

    const { getByTestId } = render(() => (
      <DevtoolsProvider>
        <DrawClientProvider animationMs={300}>
          <PiPProvider>
            <StateProbe />
            <Tabs toggleOpen={() => {}} />
          </PiPProvider>
        </DrawClientProvider>
      </DevtoolsProvider>
    ))

    // Store default activeTab is 'plugins'.
    expect(getByTestId('tsd-tab-plugins')).toHaveClass('active')
    expect(getByTestId('tsd-tab-settings')).not.toHaveClass('active')

    // Reactivity via store mutation (not a user click).
    setState({ activeTab: 'settings' })

    expect(getByTestId('tsd-tab-settings')).toHaveClass('active')
    expect(getByTestId('tsd-tab-plugins')).not.toHaveClass('active')
  })
})
