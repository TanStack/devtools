import { SettingsTab } from './settings-tab'
import { PluginsTab } from './plugins-tab'
import { SeoTab } from './seo-tab'

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
] as const

export type TabName = (typeof tabs)[number]['id']
