import { Cogs, List, PageSearch } from '@tanstack/devtools-ui/icons'
import { SettingsTab } from './settings-tab'
import { PluginsTab } from './plugins-tab'
import { SeoTab } from './seo-tab'

export const tabs = [
  {
    name: 'Plugins',
    id: 'plugins',
    component: () => <PluginsTab />,
    icon: () => <List />,
  },
  {
    name: 'SEO',
    id: 'seo',
    component: () => <SeoTab />,
    icon: () => <PageSearch />,
  },
  {
    name: 'Settings',
    id: 'settings',
    component: () => <SettingsTab />,
    icon: () => <Cogs />,
  },
] as const

export type TabName = (typeof tabs)[number]['id']
