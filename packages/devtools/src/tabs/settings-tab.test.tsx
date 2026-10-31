import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { Select, ThemeContextProvider } from '@tanstack/devtools-ui'
import { DevtoolsProvider } from '../context/devtools-context'
import { createDevtoolsSettings } from '../context/use-devtools-context'
import { SettingsTab } from './settings-tab'
import type { DevtoolsStore } from '../context/devtools-store'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'

/**
 * Renders the SettingsTab inside a DevtoolsProvider and captures the settings
 * setter from context (obtained inside the provider tree, so the store mutation
 * goes through the real provider value and drives reactivity).
 */
const renderSettingsTab = (config?: Partial<TanStackDevtoolsConfig>) => {
  let setSettings!: (s: Partial<DevtoolsStore['settings']>) => void

  const Capture = () => {
    setSettings = createDevtoolsSettings().setSettings
    return <SettingsTab />
  }

  const result = render(() => (
    <ThemeContextProvider theme="dark">
      <DevtoolsProvider config={config as TanStackDevtoolsConfig}>
        <Capture />
      </DevtoolsProvider>
    </ThemeContextProvider>
  ))

  return {
    ...result,
    setSettings: (s: Partial<DevtoolsStore['settings']>) => setSettings(s),
  }
}

describe('SettingsTab', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the "Default open" checkbox in the unchecked state when seeded with defaultOpen: false', () => {
    const { getByText } = renderSettingsTab({ defaultOpen: false })

    // The UI Checkbox renders a real <input type="checkbox"> wrapped in a
    // <label> next to a <span> with the label text. Walk up from the label
    // text to its <label> ancestor, then find the checkbox input within.
    const labelSpan = getByText('Default open')
    const labelEl = labelSpan.closest('label')
    const checkbox = labelEl?.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )

    expect(checkbox).toBeTruthy()
    expect(checkbox!.checked).toBe(false)
  })

  it('reflects a store mutation reactively: toggling requireUrlFlag mounts the URL flag input', () => {
    const { setSettings, queryByText } = renderSettingsTab({
      requireUrlFlag: false,
    })

    // The "URL flag" Input is gated behind <Show when={settings().requireUrlFlag}>,
    // so it is absent until the store is mutated.
    expect(queryByText('URL flag')).toBeNull()

    // Mutate settings through the provider's setter obtained from context.
    setSettings({ requireUrlFlag: true })

    // The Show block reacts to the store change and mounts the Input.
    expect(queryByText('URL flag')).not.toBeNull()
  })

  it('reflects controlled `checked` updates: toggling defaultOpen flips the "Default open" checkbox', () => {
    const { setSettings, getByText } = renderSettingsTab({ defaultOpen: false })

    const getDefaultOpenCheckbox = () =>
      getByText('Default open')
        .closest('label')!
        .querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(getDefaultOpenCheckbox().checked).toBe(false)

    // Mutating the store updates the Checkbox's `checked` prop; the control
    // must reflect it (regression test for the controlled-prop fix).
    setSettings({ defaultOpen: true })

    expect(getDefaultOpenCheckbox().checked).toBe(true)
  })

  it('uses native change events and keeps a controlled generic value in sync', () => {
    const NumericSelect = () => {
      const [value, setValue] = createSignal(1)
      return (
        <>
          <Select
            label="Number"
            options={[
              { label: 'One', value: 1 },
              { label: 'Two', value: 2 },
            ]}
            value={value()}
            onChange={setValue}
          />
          <button type="button" onClick={() => setValue(1)}>
            Reset
          </button>
          <output>{value()}</output>
        </>
      )
    }
    const { getByLabelText, getByRole, getByText } = render(() => (
      <ThemeContextProvider theme="dark">
        <>
          <Select
            label="Zero"
            options={[
              { label: 'One', value: 1 },
              { label: 'Zero', value: 0 },
            ]}
            value={0}
          />
          <Select
            label="Empty"
            options={[
              { label: 'Fallback', value: 'fallback' },
              { label: 'Empty', value: '' },
            ]}
            value=""
          />
          <NumericSelect />
        </>
      </ThemeContextProvider>
    ))
    expect(getByLabelText<HTMLSelectElement>('Zero').value).toBe('0')
    expect(getByLabelText<HTMLSelectElement>('Empty').value).toBe('')
    const select = getByLabelText<HTMLSelectElement>('Number')

    select.value = '2'
    fireEvent.change(select)
    expect(getByText('2')).toBeTruthy()

    fireEvent.click(getByRole('button', { name: 'Reset' }))
    expect(select.value).toBe('1')
  })
})
