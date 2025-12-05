import { Show } from 'solid-js'
import {
  Checkbox,
  Input,
  MainPanel,
  Section,
  SectionDescription,
  SectionIcon,
  SectionTitle,
  Select,
} from '@tanstack/devtools-ui'
import {
  GeoTag,
  Keyboard,
  Link,
  SettingsCog,
} from '@tanstack/devtools-ui/icons'

import { useDevtoolsSettings } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import { HotkeyConfig } from './hotkey-config'
import type { KeyboardKey } from '../context/devtools-store'

export const SettingsTab = () => {
  const { setSettings, settings } = useDevtoolsSettings()
  const styles = useStyles()

  const modifiers: Array<KeyboardKey> = [
    'Control',
    'Alt',
    'Meta',
    'Shift',
    'CtrlOrMeta',
  ]

  return (
    <MainPanel withPadding>
      <Section>
        <SectionTitle>
          <SectionIcon>
            <SettingsCog />
          </SectionIcon>
          General
        </SectionTitle>
        <SectionDescription>
          Configure general behavior of the devtools panel.
        </SectionDescription>
        <div class={styles().settingsGroup}>
          <Checkbox
            label="Default open"
            description="Automatically open the devtools panel when the page loads"
            onChange={() =>
              setSettings({ defaultOpen: !settings().defaultOpen })
            }
            checked={settings().defaultOpen}
          />
          <Checkbox
            label="Hide trigger until hovered"
            description="Keep the devtools trigger button hidden until you hover over its area"
            onChange={() =>
              setSettings({ hideUntilHover: !settings().hideUntilHover })
            }
            checked={settings().hideUntilHover}
          />
          <Checkbox
            label="Completely hide trigger"
            description="Completely removes the trigger from the DOM (you can still open it with the hotkey)"
            onChange={() =>
              setSettings({ triggerHidden: !settings().triggerHidden })
            }
            checked={settings().triggerHidden}
          />

          <Select
            label="Theme"
            description="Choose the theme for the devtools panel"
            value={settings().theme}
            options={[
              { label: 'Dark', value: 'dark' },
              { label: 'Light', value: 'light' },
            ]}
            onChange={(value) => setSettings({ theme: value })}
          />
        </div>
      </Section>

      {/* URL Flag Settings */}
      <Section>
        <SectionTitle>
          <SectionIcon>
            <Link />
          </SectionIcon>
          URL Configuration
        </SectionTitle>
        <SectionDescription>
          Control when devtools are available based on URL parameters.
        </SectionDescription>
        <div class={styles().settingsGroup}>
          <Checkbox
            label="Require URL Flag"
            description="Only show devtools when a specific URL parameter is present"
            checked={settings().requireUrlFlag}
            onChange={(checked) =>
              setSettings({
                requireUrlFlag: checked,
              })
            }
          />
          <Show when={settings().requireUrlFlag}>
            <div class={styles().conditionalSetting}>
              <Input
                label="URL flag"
                description="Enter the URL parameter name (e.g., 'debug' for ?debug=true)"
                placeholder="debug"
                value={settings().urlFlag}
                onChange={(e) =>
                  setSettings({
                    urlFlag: e,
                  })
                }
              />
            </div>
          </Show>
        </div>
      </Section>

      {/* Keyboard Settings */}
      <Section>
        <SectionTitle>
          <SectionIcon>
            <Keyboard />
          </SectionIcon>
          Keyboard
        </SectionTitle>
        <SectionDescription>
          Customize keyboard shortcuts for quick access.
        </SectionDescription>

        <div class={styles().settingsStack}>
          <HotkeyConfig
            title="Open/Close Devtools"
            description="Hotkey to open/close devtools"
            hotkey={settings().openHotkey}
            modifiers={modifiers}
            onHotkeyChange={(hotkey) => setSettings({ openHotkey: hotkey })}
          />

          <HotkeyConfig
            title="Source Inspector"
            description="Hotkey to open source inspector"
            hotkey={settings().inspectHotkey}
            modifiers={modifiers}
            onHotkeyChange={(hotkey) => setSettings({ inspectHotkey: hotkey })}
          />
        </div>
      </Section>

      {/* Position Settings */}
      <Section>
        <SectionTitle>
          <SectionIcon>
            <GeoTag />
          </SectionIcon>
          Position
        </SectionTitle>
        <SectionDescription>
          Adjust the position of the trigger button and devtools panel.
        </SectionDescription>
        <div class={styles().settingsGroup}>
          <div class={styles().settingRow}>
            <Select
              label="Trigger Position"
              options={[
                { label: 'Bottom Right', value: 'bottom-right' },
                { label: 'Bottom Left', value: 'bottom-left' },
                { label: 'Top Right', value: 'top-right' },
                { label: 'Top Left', value: 'top-left' },
                { label: 'Middle Right', value: 'middle-right' },
                { label: 'Middle Left', value: 'middle-left' },
              ]}
              value={settings().position}
              onChange={(value) =>
                setSettings({
                  position: value,
                })
              }
            />
            <Select
              label="Panel Position"
              value={settings().panelLocation}
              options={[
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ]}
              onChange={(value) =>
                setSettings({
                  panelLocation: value,
                })
              }
            />
          </div>
        </div>
      </Section>
    </MainPanel>
  )
}
