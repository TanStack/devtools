import type { PluginMetadata } from '../plugin-registry'

type InstallStatus = 'idle' | 'installing' | 'success' | 'error'

export type ActionType =
  | 'install'
  | 'install-devtools'
  | 'add-to-devtools'
  | 'requires-package'
  | 'wrong-framework'
  | 'already-installed'
  | 'version-mismatch'
  | 'bump-version'

export interface PluginCard {
  requiredPackageName: string
  devtoolsPackage: string
  framework: string
  hasPackage: boolean
  hasDevtools: boolean
  isRegistered: boolean
  actionType: ActionType
  status: InstallStatus
  error?: string
  isCurrentFramework: boolean
  metadata?: PluginMetadata
  versionInfo?: {
    current: string
    required?: string
    satisfied: boolean
    reason?: string
  }
}

export interface PluginSection {
  id: string
  displayName: string
  cards: Array<PluginCard>
}

export const FRAMEWORKS = [
  'react',
  'solid',
  'vue',
  'svelte',
  'angular',
] as const
