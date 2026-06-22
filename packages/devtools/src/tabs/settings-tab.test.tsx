import { render } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { DevtoolsProvider } from '../context/devtools-context'
import { useDevtoolsSettings } from '../context/use-devtools-context'
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
    setSettings = useDevtoolsSettings().setSettings
    return <SettingsTab />
  }

  const result = render(() => (
    <ThemeContextProvider theme="dark">
      <DevtoolsProvider config={config as TanStackDevtoolsConfig}>
        <Capture />
      </DevtoolsProvider>
    </ThemeContextProvider>
  ))

  return { ...result, setSettings: (s: Partial<DevtoolsStore['settings']>) => setSettings(s) }
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
})
