import { SettingsTab } from './settings-tab'
import { PluginsTab } from './plugins-tab'
import { SeoTab } from './seo-tab'
import type { JSX } from '@solidjs/web'

// Written out, not taken from `tabs`, so the public types do not need Solid.
export type TabName = 'plugins' | 'seo' | 'settings'

export const tabs = [
  {
    name: 'Plugins',
    id: 'plugins',
    component: () => <PluginsTab />,
  },
  {
    name: 'SEO',
    id: 'seo',
    component: () => <SeoTab />,
  },
  {
    name: 'Settings',
    id: 'settings',
    component: () => <SettingsTab />,
  },
] as const satisfies ReadonlyArray<{
  name: string
  id: TabName
  component: () => JSX.Element
}>
