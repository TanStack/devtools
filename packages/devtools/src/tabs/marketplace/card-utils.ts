import type { PluginCard } from './types'

export const getButtonText = (card: PluginCard): string => {
  if (card.status === 'installing') return 'Installing...'
  if (card.status === 'success') return 'Installed!'
  if (card.status === 'error') return 'Error'

  switch (card.actionType) {
    case 'install':
      return 'Install'
    case 'install-devtools':
      return 'Install Devtools'
    case 'add-to-devtools':
      return 'Add to Devtools'
    case 'requires-package':
      return `Requires ${card.requiredPackageName}`
    case 'wrong-framework':
      return 'Different Framework'
    case 'already-installed':
      return 'Already Installed'
    case 'bump-version':
      return 'Bump Version'
    case 'version-mismatch':
      return 'Version Mismatch'
    default:
      return 'Install'
  }
}

export const getButtonVariant = (
  card: PluginCard,
): 'primary' | 'secondary' | 'danger' | 'warning' => {
  if (
    card.actionType === 'requires-package' ||
    card.actionType === 'wrong-framework' ||
    card.actionType === 'version-mismatch'
  )
    return 'danger'
  if (card.actionType === 'bump-version') return 'warning'
  if (card.actionType === 'already-installed') return 'secondary'
  return 'primary'
}

export const getBadgeClass = (card: PluginCard, styles: any): string => {
  const s = styles()
  const base = s.pluginMarketplaceCardBadge
  switch (card.actionType) {
    case 'install':
    case 'install-devtools':
      return `${base} ${s.pluginMarketplaceCardBadgeInstall}`
    case 'add-to-devtools':
      return `${base} ${s.pluginMarketplaceCardBadgeAdd}`
    case 'already-installed':
      return `${base} ${s.pluginMarketplaceCardBadgeAdd}`
    case 'bump-version':
      return `${base} ${s.pluginMarketplaceCardBadgeRequires}`
    case 'version-mismatch':
      return `${base} ${s.pluginMarketplaceCardBadgeRequires}`
    case 'requires-package':
    case 'wrong-framework':
      return `${base} ${s.pluginMarketplaceCardBadgeRequires}`
    default:
      return base
  }
}

export const getBadgeText = (card: PluginCard): string => {
  switch (card.actionType) {
    case 'install':
    case 'install-devtools':
      return 'Available'
    case 'add-to-devtools':
      return 'Installed'
    case 'already-installed':
      return 'Active'
    case 'version-mismatch':
      return 'Incompatible'
    case 'requires-package':
      return 'Unavailable'
    case 'wrong-framework':
      return 'Other Framework'
    default:
      return ''
  }
}
