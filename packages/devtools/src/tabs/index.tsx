import { Cogs, List, PageSearch } from '@tanstack/devtools-ui/icons'
import { SettingsTab } from './settings-tab'
import { PluginsTab } from './plugins-tab'
import { SeoTab } from './seo-tab'
import type { DevtoolsStore } from '../context/devtools-store'

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

export const getTabs = (settings: DevtoolsStore['settings']) => {
  return tabs.filter((t) => {
    if (t.id === 'seo') return settings.enableSeoTab
    if (t.id === 'settings') return settings.enableSettingsTab
    return true
  })
}

export type TabName = (typeof tabs)[number]['id']
