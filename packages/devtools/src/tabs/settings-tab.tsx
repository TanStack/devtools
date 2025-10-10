import { Show, createMemo } from 'solid-js'
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
import type { ModifierKey } from '@solid-primitives/keyboard'

export const SettingsTab = () => {
  const { setSettings, settings } = useDevtoolsSettings()
  const styles = useStyles()
  const hotkey = createMemo(() => settings().openHotkey)
  const modifiers: Array<ModifierKey> = ['Control', 'Alt', 'Meta', 'Shift']
  const changeHotkey = (newHotkey: ModifierKey) => () => {
    if (hotkey().includes(newHotkey)) {
      return setSettings({
        openHotkey: hotkey().filter((key) => key !== newHotkey),
      })
    }
    const existingModifiers = hotkey().filter((key) =>
      modifiers.includes(key as any),
    )
    const otherModifiers = hotkey().filter(
      (key) => !modifiers.includes(key as any),
    )
    setSettings({
      openHotkey: [...existingModifiers, newHotkey, ...otherModifiers],
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
          <Input
            label="Trigger Image"
            description="Specify the URL of the image to use for the trigger"
            value={settings().triggerImage}
            placeholder="Default TanStack Logo"
            onChange={(value) => setSettings({ triggerImage: value })}
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
        <div class={styles().settingsGroup}>
          <div class={styles().settingsModifiers}>
            <Show keyed when={hotkey()}>
              <Button
                variant="success"
                onclick={changeHotkey('Shift')}
                outline={!hotkey().includes('Shift')}
              >
                Shift
              </Button>
              <Button
                variant="success"
                onclick={changeHotkey('Alt')}
                outline={!hotkey().includes('Alt')}
              >
                Alt
              </Button>
              <Button
                variant="success"
                onclick={changeHotkey('Meta')}
                outline={!hotkey().includes('Meta')}
              >
                Meta
              </Button>
              <Button
                variant="success"
                onclick={changeHotkey('Control')}
                outline={!hotkey().includes('Control')}
              >
                Control
              </Button>
            </Show>
          </div>
          <Input
            label="Hotkey to open/close devtools"
            description="Use '+' to combine keys (e.g., 'a+b' or 'd'). This will be used with the enabled modifiers from above"
            placeholder="a"
            value={hotkey()
              .filter((key) => !['Shift', 'Meta', 'Alt', 'Ctrl'].includes(key))
              .join('+')}
            onChange={(e) => {
              const makeModifierArray = (key: string) => {
                if (key.length === 1) return [uppercaseFirstLetter(key)]
                const modifiers: Array<string> = []
                for (const character of key) {
                  const newLetter = uppercaseFirstLetter(character)
                  if (!modifiers.includes(newLetter)) modifiers.push(newLetter)
                }
                return modifiers
              }
              const modifiers = e
                .split('+')
                .flatMap((key) => makeModifierArray(key))
                .filter(Boolean)
              return setSettings({
                openHotkey: [
                  ...hotkey().filter((key) =>
                    ['Shift', 'Meta', 'Alt', 'Ctrl'].includes(key),
                  ),
                  ...modifiers,
                ],
              })
            }}
          />
          Final shortcut is: {hotkey().join(' + ')}
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
