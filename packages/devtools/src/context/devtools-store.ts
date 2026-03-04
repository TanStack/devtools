import type { Hotkey } from '@tanstack/solid-hotkeys'
import type { TabName } from '../tabs'
import type { TanStackDevtoolsPlugin } from './devtools-context'

type TriggerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'middle-left'
  | 'middle-right'

type TriggerProps = {
  theme: 'light' | 'dark'
}

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
     * The hotkey to open the dev tools.
     * Uses TanStack Hotkeys string format (e.g. "Mod+S", "Control+`").
     * "Mod" maps to Command on macOS and Control on Windows/Linux.
     * @default "Control+`"
     */
    openHotkey: Hotkey
    /**
     * The hotkey to open the source inspector.
     * Uses TanStack Hotkeys string format (e.g. "Mod+Shift").
     * "Mod" maps to Command on macOS and Control on Windows/Linux.
     * @default "Mod+Shift"
     */
    inspectHotkey: string
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
     * Whether the trigger should be completely hidden or not (you can still open with the hotkey)
     */
    triggerHidden?: boolean
    /**
     * An optional custom function to render the dev tools trigger component.
     * If provided, it replaces the default trigger button.
     * @default undefined
     */
    customTrigger?: (el: HTMLElement, props: TriggerProps) => void
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
    openHotkey: 'Control+`' as Hotkey,
    inspectHotkey: 'Mod+Shift',
    requireUrlFlag: false,
    urlFlag: 'tanstack-devtools',
    theme:
      typeof window !== 'undefined' &&
      typeof window.matchMedia !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    triggerHidden: false,
    customTrigger: undefined,
  },
  state: {
    activeTab: 'plugins',
    height: 400,
    activePlugins: [],
    persistOpen: false,
  },
}
