import { describe, expect, it } from 'vitest'
import {
  getBadgeClass,
  getBadgeText,
  getButtonText,
  getButtonVariant,
} from './card-utils'
import type { PluginCard } from './types'

const createMockCard = (overrides: Partial<PluginCard>): PluginCard => ({
  requiredPackageName: '@tanstack/react-query',
  devtoolsPackage: '@tanstack/react-query-devtools',
  framework: 'react',
  hasPackage: false,
  hasDevtools: false,
  isRegistered: false,
  actionType: 'install',
  status: 'idle',
  isCurrentFramework: true,
  metadata: {
    packageName: '@tanstack/react-query-devtools',
    title: 'Query Devtools',
    framework: 'react',
  },
  ...overrides,
})

describe('getButtonText', () => {
  it('should return Installing... when status is installing', () => {
    const card = createMockCard({ status: 'installing' })
    expect(getButtonText(card)).toBe('Installing...')
  })

  it('should return Installed! when status is success', () => {
    const card = createMockCard({ status: 'success' })
    expect(getButtonText(card)).toBe('Installed!')
  })

  it('should return Error when status is error', () => {
    const card = createMockCard({ status: 'error' })
    expect(getButtonText(card)).toBe('Error')
  })

  it('should return Install for install action', () => {
    const card = createMockCard({ actionType: 'install' })
    expect(getButtonText(card)).toBe('Install')
  })

  it('should return Install Devtools for install-devtools action', () => {
    const card = createMockCard({ actionType: 'install-devtools' })
    expect(getButtonText(card)).toBe('Install Devtools')
  })

  it('should return Add to Devtools for add-to-devtools action', () => {
    const card = createMockCard({ actionType: 'add-to-devtools' })
    expect(getButtonText(card)).toBe('Add to Devtools')
  })

  it('should return package name for requires-package action', () => {
    const card = createMockCard({
      actionType: 'requires-package',
      requiredPackageName: '@tanstack/react-query',
    })
    expect(getButtonText(card)).toBe('Requires @tanstack/react-query')
  })

  it('should return Different Framework for wrong-framework action', () => {
    const card = createMockCard({ actionType: 'wrong-framework' })
    expect(getButtonText(card)).toBe('Different Framework')
  })

  it('should return Already Installed for already-installed action', () => {
    const card = createMockCard({ actionType: 'already-installed' })
    expect(getButtonText(card)).toBe('Already Installed')
  })

  it('should return Bump Version for bump-version action', () => {
    const card = createMockCard({ actionType: 'bump-version' })
    expect(getButtonText(card)).toBe('Bump Version')
  })

  it('should return Version Mismatch for version-mismatch action', () => {
    const card = createMockCard({ actionType: 'version-mismatch' })
    expect(getButtonText(card)).toBe('Version Mismatch')
  })
})

describe('getButtonVariant', () => {
  it('should return danger for requires-package', () => {
    const card = createMockCard({ actionType: 'requires-package' })
    expect(getButtonVariant(card)).toBe('danger')
  })

  it('should return danger for wrong-framework', () => {
    const card = createMockCard({ actionType: 'wrong-framework' })
    expect(getButtonVariant(card)).toBe('danger')
  })

  it('should return danger for version-mismatch', () => {
    const card = createMockCard({ actionType: 'version-mismatch' })
    expect(getButtonVariant(card)).toBe('danger')
  })

  it('should return warning for bump-version', () => {
    const card = createMockCard({ actionType: 'bump-version' })
    expect(getButtonVariant(card)).toBe('warning')
  })

  it('should return secondary for already-installed', () => {
    const card = createMockCard({ actionType: 'already-installed' })
    expect(getButtonVariant(card)).toBe('secondary')
  })

  it('should return primary for install actions', () => {
    const installCard = createMockCard({ actionType: 'install' })
    expect(getButtonVariant(installCard)).toBe('primary')

    const installDevtoolsCard = createMockCard({
      actionType: 'install-devtools',
    })
    expect(getButtonVariant(installDevtoolsCard)).toBe('primary')

    const addToDevtoolsCard = createMockCard({ actionType: 'add-to-devtools' })
    expect(getButtonVariant(addToDevtoolsCard)).toBe('primary')
  })
})

describe('getBadgeClass', () => {
  const mockStyles = () => ({
    pluginMarketplaceCardBadge: 'badge',
    pluginMarketplaceCardBadgeInstall: 'badge-install',
    pluginMarketplaceCardBadgeAdd: 'badge-add',
    pluginMarketplaceCardBadgeRequires: 'badge-requires',
  })

  it('should return install badge class for install', () => {
    const card = createMockCard({ actionType: 'install' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-install')
  })

  it('should return install badge class for install-devtools', () => {
    const card = createMockCard({ actionType: 'install-devtools' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-install')
  })

  it('should return add badge class for add-to-devtools', () => {
    const card = createMockCard({ actionType: 'add-to-devtools' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-add')
  })

  it('should return add badge class for already-installed', () => {
    const card = createMockCard({ actionType: 'already-installed' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-add')
  })

  it('should return requires badge class for bump-version', () => {
    const card = createMockCard({ actionType: 'bump-version' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-requires')
  })

  it('should return requires badge class for version-mismatch', () => {
    const card = createMockCard({ actionType: 'version-mismatch' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-requires')
  })

  it('should return requires badge class for requires-package', () => {
    const card = createMockCard({ actionType: 'requires-package' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-requires')
  })

  it('should return requires badge class for wrong-framework', () => {
    const card = createMockCard({ actionType: 'wrong-framework' })
    expect(getBadgeClass(card, mockStyles)).toBe('badge badge-requires')
  })
})

describe('getBadgeText', () => {
  it('should return Available for install', () => {
    const card = createMockCard({ actionType: 'install' })
    expect(getBadgeText(card)).toBe('Available')
  })

  it('should return Available for install-devtools', () => {
    const card = createMockCard({ actionType: 'install-devtools' })
    expect(getBadgeText(card)).toBe('Available')
  })

  it('should return Installed for add-to-devtools', () => {
    const card = createMockCard({ actionType: 'add-to-devtools' })
    expect(getBadgeText(card)).toBe('Installed')
  })

  it('should return Active for already-installed', () => {
    const card = createMockCard({ actionType: 'already-installed' })
    expect(getBadgeText(card)).toBe('Active')
  })

  it('should return Incompatible for version-mismatch', () => {
    const card = createMockCard({ actionType: 'version-mismatch' })
    expect(getBadgeText(card)).toBe('Incompatible')
  })

  it('should return Unavailable for requires-package', () => {
    const card = createMockCard({ actionType: 'requires-package' })
    expect(getBadgeText(card)).toBe('Unavailable')
  })

  it('should return Other Framework for wrong-framework', () => {
    const card = createMockCard({ actionType: 'wrong-framework' })
    expect(getBadgeText(card)).toBe('Other Framework')
  })

  it('should return empty string for unknown action type', () => {
    const card = createMockCard({ actionType: 'install' })
    // @ts-expect-error - testing invalid action type
    card.actionType = 'invalid'
    expect(getBadgeText(card)).toBe('')
  })
})
