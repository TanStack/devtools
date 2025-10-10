import type { TabName } from '../tabs'
import type { TanStackDevtoolsPlugin } from './devtools-context'

type ModifierKey = 'Alt' | 'Control' | 'Meta' | 'Shift'
type KeyboardKey = ModifierKey | (string & {})
export const keyboardModifiers: Array<ModifierKey> = [
  'Alt',
  'Control',
  'Meta',
  'Shift',
]

type TriggerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'middle-left'
  | 'middle-right'

export type DevtoolsStore = {
  settings: {
    /**
     * Whether the dev tools should be open by default
     * @default false
     */
    defaultOpen: boolean
    /**
     * Whether the dev tools trigger should be hidden until the user hovers over it
     * @default false
     */
    hideUntilHover: boolean
    /**
     * The position of the trigger button
     * @default "bottom-right"
     */
    position: TriggerPosition

    /**
     * The location of the panel once it is open
     * @default "bottom"
     */
    panelLocation: 'top' | 'bottom'
    /**
     * The hotkey to open the dev tools
     * @default "shift+a"
     */
    openHotkey: Array<KeyboardKey>
    /**
     * Whether to require the URL flag to open the dev tools
     * @default false
     */
    requireUrlFlag: boolean
    /**
     * The URL flag to open the dev tools, used in conjunction with requireUrlFlag (if set to true)
     * @default "tanstack-devtools"
     */
    urlFlag: string
    /**
     * The theme of the dev tools
     * @default "dark"
     */
    theme: 'light' | 'dark'
    /**
     * The image used for the dev tools trigger
     * @default TanStackLogo
     */
    triggerImage: string
    /**
     * Whether the trigger should be completely hidden or not (you can still open with the hotkey)
     */
    triggerHidden?: boolean
  }
  state: {
    activeTab: TabName
    height: number
    activePlugins: Array<string>
    persistOpen: boolean
  }
  plugins?: Array<TanStackDevtoolsPlugin>
}

export const initialState: DevtoolsStore = {
  settings: {
    defaultOpen: false,
    hideUntilHover: false,
    position: 'bottom-right',
    panelLocation: 'bottom',
    openHotkey: ['Shift', 'A'],
    requireUrlFlag: false,
    urlFlag: 'tanstack-devtools',
    theme:
      typeof window !== 'undefined' &&
      typeof window.matchMedia !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    triggerImage: '',
    triggerHidden: false,
  },
  state: {
    activeTab: 'plugins',
    height: 400,
    activePlugins: [],
    persistOpen: false,
  },
}
