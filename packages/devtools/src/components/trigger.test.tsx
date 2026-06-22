import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { DevtoolsProvider } from '../context/devtools-context'
import { Trigger } from './trigger'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'

const renderTrigger = (config?: Partial<TanStackDevtoolsConfig>) => {
  const [isOpen, setIsOpen] = createSignal(false)
  return render(() => (
    <DevtoolsProvider config={config as TanStackDevtoolsConfig}>
      <Trigger isOpen={isOpen} setIsOpen={setIsOpen} />
    </DevtoolsProvider>
  ))
}

describe('Trigger', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the trigger button with position/animation classes when not hidden', () => {
    const { queryByLabelText } = renderTrigger({ position: 'bottom-right' })

    const button = queryByLabelText('Open TanStack Devtools')
    expect(button).toBeInTheDocument()
    expect(button?.tagName).toBe('BUTTON')

    // buttonStyle() is a clsx of mainCloseBtn + position + animation goober
    // classes, so the rendered class attribute must contain several classes.
    const classList = button?.getAttribute('class')?.split(/\s+/) ?? []
    expect(classList.length).toBeGreaterThanOrEqual(3)
  })

  it('does not render the trigger button when triggerHidden is true', () => {
    const { queryByLabelText } = renderTrigger({ triggerHidden: true })

    expect(queryByLabelText('Open TanStack Devtools')).not.toBeInTheDocument()
  })
})
