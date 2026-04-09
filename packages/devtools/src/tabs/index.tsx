import { Cogs, List } from '@tanstack/devtools-ui/icons'
import { SettingsTab } from './settings-tab'
import { PluginsTab } from './plugins-tab'

export const tabs = [
  {
    name: 'Plugins',
    id: 'plugins',
    component: (props: { isOpen: boolean }) => <PluginsTab {...props} />,
    icon: () => <List />,
  },
  {
    name: 'Settings',
    id: 'settings',
    component: () => <SettingsTab />,
    icon: () => <Cogs />,
  },
] as const

export type TabName = (typeof tabs)[number]['id']
