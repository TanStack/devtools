import type { TabName } from '../tabs'
import type { LayoutNode } from '../utils/layout-tree'
import type { TanStackDevtoolsPlugin } from './devtools-context'
import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'

type ModifierKey = 'Alt' | 'Control' | 'Meta' | 'Shift' | 'CtrlOrMeta'
type KeyboardKey = ModifierKey | (string & {})
export type { ModifierKey, KeyboardKey }
export const keyboardModifiers: Array<ModifierKey> = [
  'Alt',
  'Control',
  'Meta',
  'Shift',
  'CtrlOrMeta',
]

type TriggerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'middle-left'
  | 'middle-right'

type TriggerMode = 'fixed' | 'floating'
type TriggerCoords = { x: number; y: number }
export type { TriggerPosition, TriggerMode, TriggerCoords }

type TriggerProps = {
  theme: TanStackDevtoolsTheme
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
     * The position of the trigger button (used when `triggerMode` is "fixed")
     * @default "bottom-right"
     */
    position: TriggerPosition

    /**
     * How the trigger is placed on screen.
     * - "fixed": anchored to one of the `position` corners/edges
     * - "floating": freely draggable, position persisted in local storage
     * @default "floating"
     */
    triggerMode: TriggerMode
    /**
     * The persisted top-left coordinates (in px) of the floating trigger.
     * Only used when `triggerMode` is "floating".
     * @default undefined
     */
    triggerCoords?: TriggerCoords

    /**
     * The location of the panel once it is open
     * @default "bottom"
     */
    panelLocation: 'top' | 'bottom'
    /**
     * The hotkey to open the dev tools
     * @default ["Control", "~"]
     */
    openHotkey: Array<KeyboardKey>
    /**
     * The hotkey to open the source inspector
     * @default ["Shift", "Alt", "CtrlOrMeta"]
     */
    inspectHotkey: Array<KeyboardKey>
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
    theme: TanStackDevtoolsTheme

    /**
     * The action to perform when clicking a source-inspected element
     * - "ide-warp": open the file in the IDE via the Vite middleware
     * - "copy-path": copy the file path to the clipboard
     * @default "ide-warp"
     */
    sourceAction: 'ide-warp' | 'copy-path'
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
    /**
     * How the open plugins are arranged: a tree of splits and tab groups. This
     * is the only record of which plugins are open — `activePlugins` is derived
     * from it by `createPlugins`, so the two can never disagree.
     *
     * `null` means nothing is open.
     */
    layout: LayoutNode | null
    persistOpen: boolean
    /**
     * Whether the secondary strip (plugin and SEO tabs) is folded behind the
     * header. Kept in state so a reload does not steal that height back.
     * @default false
     */
    subheaderCollapsed: boolean
  }
  plugins?: Array<TanStackDevtoolsPlugin>
}

export const initialState: DevtoolsStore = {
  settings: {
    defaultOpen: false,
    hideUntilHover: false,
    position: 'bottom-right',
    triggerMode: 'floating',
    triggerCoords: undefined,
    panelLocation: 'bottom',
    openHotkey: ['Control', '~'],
    inspectHotkey: ['Shift', 'Alt', 'CtrlOrMeta'],
    requireUrlFlag: false,
    urlFlag: 'tanstack-devtools',
    theme:
      typeof window !== 'undefined' &&
      typeof window.matchMedia !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    sourceAction: 'ide-warp',
    triggerHidden: false,
    customTrigger: undefined,
  },
  state: {
    activeTab: 'plugins',
    height: 400,
    layout: null,
    persistOpen: false,
    subheaderCollapsed: false,
  },
}
