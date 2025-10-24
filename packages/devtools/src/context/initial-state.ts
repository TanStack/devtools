import type { DevtoolsStore } from './devtools-store'

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
