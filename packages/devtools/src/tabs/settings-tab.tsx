import { Show } from 'solid-js'
import {
  Button,
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
import { uppercaseFirstLetter } from '../utils/sanitize'
import { useStyles } from '../styles/use-styles'
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

  const createHotkeyHandler =
    (hotkeyKey: 'openHotkey' | 'inspectHotkey') =>
    (newHotkey: KeyboardKey) =>
    () => {
      const hotkey = settings()[hotkeyKey]
      if (hotkey.includes(newHotkey)) {
        return setSettings({
          [hotkeyKey]: hotkey.filter((key) => key !== newHotkey),
        })
      }
      const existingModifiers = hotkey.filter((key) =>
        modifiers.includes(key as any),
      )
      const otherKeys = hotkey.filter(
        (key) => !modifiers.includes(key as any),
      )
      setSettings({
        [hotkeyKey]: [...existingModifiers, newHotkey, ...otherKeys],
      })
    }

  const createHotkeyDisplay =
    (hotkeyKey: 'openHotkey' | 'inspectHotkey') => () => {
      return settings()[hotkeyKey].join(' + ')
    }

  const createHotkeyNonModifierValue =
    (hotkeyKey: 'openHotkey' | 'inspectHotkey') => () => {
      return settings()[hotkeyKey]
        .filter((key) => !modifiers.includes(key as any))
        .join('+')
    }

  const createHotkeyInputHandler =
    (hotkeyKey: 'openHotkey' | 'inspectHotkey') => (e: string) => {
      const makeModifierArray = (key: string) => {
        if (key.length === 1) return [uppercaseFirstLetter(key)]
        const modifiersArray: Array<string> = []
        for (const character of key) {
          const newLetter = uppercaseFirstLetter(character)
          if (!modifiersArray.includes(newLetter))
            modifiersArray.push(newLetter)
        }
        return modifiersArray
      }
      const hotkey = settings()[hotkeyKey]
      const hotkeyModifiers = hotkey.filter((key) =>
        modifiers.includes(key as any),
      )
      const newKeys = e
        .split('+')
        .flatMap((key) => makeModifierArray(key))
        .filter(Boolean)
      return setSettings({
        [hotkeyKey]: [...hotkeyModifiers, ...newKeys],
      })
    }

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
        
        {/* Open/Close Devtools Hotkey */}
        <div class={styles().settingsGroup}>
          <h4>Open/Close Devtools</h4>
          <div class={styles().settingsModifiers}>
            <Show keyed when={settings().openHotkey}>
              <Button
                variant="success"
                onclick={createHotkeyHandler('openHotkey')('Shift')}
                outline={!settings().openHotkey.includes('Shift')}
              >
                Shift
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('openHotkey')('Alt')}
                outline={!settings().openHotkey.includes('Alt')}
              >
                Alt
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('openHotkey')('Meta')}
                outline={!settings().openHotkey.includes('Meta')}
              >
                Meta
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('openHotkey')('Control')}
                outline={!settings().openHotkey.includes('Control')}
              >
                Control
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('openHotkey')('CtrlOrMeta')}
                outline={!settings().openHotkey.includes('CtrlOrMeta')}
              >
                Ctrl Or Meta
              </Button>
            </Show>
          </div>
          <Input
            label="Hotkey to open/close devtools"
            description="Use '+' to combine keys (e.g., 'a+b' or 'd'). This will be used with the enabled modifiers from above"
            placeholder="a"
            value={createHotkeyNonModifierValue('openHotkey')()}
            onChange={createHotkeyInputHandler('openHotkey')}
          />
          Final shortcut is: {createHotkeyDisplay('openHotkey')()}
        </div>

        {/* Inspector Hotkey */}
        <div class={styles().settingsGroup}>
          <h4>Source Inspector</h4>
          <div class={styles().settingsModifiers}>
            <Show keyed when={settings().inspectHotkey}>
              <Button
                variant="success"
                onclick={createHotkeyHandler('inspectHotkey')('Shift')}
                outline={!settings().inspectHotkey.includes('Shift')}
              >
                Shift
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('inspectHotkey')('Alt')}
                outline={!settings().inspectHotkey.includes('Alt')}
              >
                Alt
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('inspectHotkey')('Meta')}
                outline={!settings().inspectHotkey.includes('Meta')}
              >
                Meta
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('inspectHotkey')('Control')}
                outline={!settings().inspectHotkey.includes('Control')}
              >
                Control
              </Button>
              <Button
                variant="success"
                onclick={createHotkeyHandler('inspectHotkey')('CtrlOrMeta')}
                outline={!settings().inspectHotkey.includes('CtrlOrMeta')}
              >
                Ctrl Or Meta
              </Button>
            </Show>
          </div>
          <Input
            label="Hotkey to open source inspector"
            description="Use '+' to combine keys (e.g., 'a+b' or 'd'). This will be used with the enabled modifiers from above"
            placeholder="a"
            value={createHotkeyNonModifierValue('inspectHotkey')()}
            onChange={createHotkeyInputHandler('inspectHotkey')}
          />
          Final shortcut is: {createHotkeyDisplay('inspectHotkey')()}
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
