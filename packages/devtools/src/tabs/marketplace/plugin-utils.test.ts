import { describe, expect, it } from 'vitest'
import {
  buildPluginCards,
  detectFramework,
  groupIntoSections,
  isPluginRegistered,
} from './plugin-utils'
import { FRAMEWORKS } from './types'
import type { PluginCard } from './types'
import type { PackageJson } from '@tanstack/devtools-client'

describe('detectFramework', () => {
  it('should detect React', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { react: '^18.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('react')
  })

  it('should detect React from react-dom', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { 'react-dom': '^18.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('react')
  })

  it('should detect Vue', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { vue: '^3.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('vue')
  })

  it('should detect Solid', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { 'solid-js': '^1.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('solid')
  })

  it('should detect Svelte', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { svelte: '^4.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('svelte')
  })

  it('should detect Angular', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { '@angular/core': '^17.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('angular')
  })

  it('should check devDependencies as well', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      devDependencies: { react: '^18.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('react')
  })

  it('should return unknown when no framework is detected', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: { lodash: '^4.0.0' },
    }
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('unknown')
  })

  it('should return first matching framework if multiple are present', () => {
    const pkg: PackageJson = {
      name: 'test-app',
      dependencies: {
        react: '^18.0.0',
        vue: '^3.0.0',
      },
    }
    // Should return react since it's first in the FRAMEWORKS array
    expect(detectFramework(pkg, FRAMEWORKS)).toBe('react')
  })
})

describe('isPluginRegistered', () => {
  it('should match with custom pluginId', () => {
    const registeredPlugins = new Set(['tanstack-query-0', 'tanstack-form-1'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        '@tanstack/react-query-devtools',
        'react',
        'tanstack-query',
      ),
    ).toBe(true)
  })

  it('should match when pluginId is a prefix', () => {
    const registeredPlugins = new Set(['tanstack-form-4'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-form-devtools',
        '@tanstack/react-form-devtools',
        'react',
        'tanstack-form',
      ),
    ).toBe(true)
  })

  it('should match when pluginId is contained', () => {
    const registeredPlugins = new Set(['my-tanstack-query-wrapper'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        '@tanstack/react-query-devtools',
        'react',
        'tanstack-query',
      ),
    ).toBe(true)
  })

  it('should not match when pluginId is not found', () => {
    const registeredPlugins = new Set(['tanstack-router-0'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        '@tanstack/react-query-devtools',
        'react',
        'tanstack-query',
      ),
    ).toBe(false)
  })

  it('should match with direct package name', () => {
    const registeredPlugins = new Set(['@tanstack/react-query-devtools'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        '@tanstack/react-query-devtools',
        'react',
      ),
    ).toBe(true)
  })

  it('should match with plugin parts in lowercase', () => {
    const registeredPlugins = new Set(['react-query-plugin'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        'react-query-devtools',
        'react',
      ),
    ).toBe(true)
  })

  it('should match with framework and plugin parts', () => {
    const registeredPlugins = new Set(['react-custom-query'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        'query-devtools',
        'react',
      ),
    ).toBe(true)
  })

  it('should not match unrelated plugin names', () => {
    const registeredPlugins = new Set(['vue-router'])
    expect(
      isPluginRegistered(
        registeredPlugins,
        '@tanstack/react-query-devtools',
        'react-query-devtools',
        'react',
      ),
    ).toBe(false)
  })
})

describe('groupIntoSections', () => {
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

  it('should group active plugins', () => {
    const cards = [
      createMockCard({
        actionType: 'already-installed',
        isRegistered: true,
        metadata: {
          packageName: 'pkg1',
          title: 'Active Plugin',
          framework: 'react',
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections).toHaveLength(2) // Featured (always present) + Active
    expect(sections[0]?.id).toBe('featured')
    expect(sections[1]?.id).toBe('active')
    expect(sections[1]?.displayName).toBe('✓ Active Plugins')
    expect(sections[1]?.cards).toHaveLength(1)
  })

  it('should group featured plugins', () => {
    const cards = [
      createMockCard({
        actionType: 'install',
        isCurrentFramework: true,
        metadata: {
          packageName: 'pkg1',
          title: 'Featured Plugin',
          framework: 'react',
          featured: true,
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections).toHaveLength(1)
    expect(sections[0]?.id).toBe('featured')
    expect(sections[0]?.displayName).toBe('⭐ Featured')
  })

  it('should not include already-installed plugins in featured section', () => {
    const cards = [
      createMockCard({
        actionType: 'already-installed',
        isRegistered: true,
        metadata: {
          packageName: 'pkg1',
          title: 'Active Featured',
          framework: 'react',
          featured: true,
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections).toHaveLength(2) // Featured (always present) + Active
    expect(sections[0]?.id).toBe('featured')
    expect(sections[1]?.id).toBe('active')
    expect(sections[0]?.cards).toHaveLength(0) // Featured section empty
    expect(sections[1]?.cards).toHaveLength(1) // Active has the plugin
  })

  it('should group available plugins', () => {
    const cards = [
      createMockCard({
        actionType: 'install',
        isCurrentFramework: true,
        metadata: {
          packageName: 'pkg1',
          title: 'Available Plugin',
          framework: 'react',
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections).toHaveLength(2) // Featured (always present) + Available
    expect(sections[0]?.id).toBe('featured')
    expect(sections[1]?.id).toBe('available')
    expect(sections[1]?.displayName).toBe('Available Plugins')
  })

  it('should not include featured plugins in available section', () => {
    const cards = [
      createMockCard({
        actionType: 'install',
        isCurrentFramework: true,
        metadata: {
          packageName: 'pkg1',
          title: 'Featured Plugin',
          framework: 'react',
          featured: true,
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections.find((s) => s.id === 'available')).toBeUndefined()
  })

  it('should create all three sections when appropriate', () => {
    const cards = [
      createMockCard({
        actionType: 'already-installed',
        isRegistered: true,
        metadata: {
          packageName: 'active',
          title: 'Active',
          framework: 'react',
        },
      }),
      createMockCard({
        actionType: 'install',
        isCurrentFramework: true,
        metadata: {
          packageName: 'featured',
          title: 'Featured',
          framework: 'react',
          featured: true,
        },
      }),
      createMockCard({
        actionType: 'install',
        isCurrentFramework: true,
        metadata: {
          packageName: 'available',
          title: 'Available',
          framework: 'react',
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections).toHaveLength(3)
    expect(sections[0]?.id).toBe('featured')
    expect(sections[1]?.id).toBe('active')
    expect(sections[2]?.id).toBe('available')
  })

  it('should not create sections for wrong framework plugins', () => {
    const cards = [
      createMockCard({
        actionType: 'install',
        isCurrentFramework: false,
        metadata: {
          packageName: 'pkg1',
          title: 'Wrong Framework',
          framework: 'vue',
        },
      }),
    ]

    const sections = groupIntoSections(cards)

    expect(sections).toHaveLength(1) // Only featured section (always present, empty)
    expect(sections[0]?.id).toBe('featured')
    expect(sections[0]?.cards).toHaveLength(0)
  })

  it('should handle empty card array', () => {
    const sections = groupIntoSections([])
    expect(sections).toHaveLength(1) // Featured section always present
    expect(sections[0]?.id).toBe('featured')
    expect(sections[0]?.cards).toHaveLength(0)
  })
})

describe('buildPluginCards', () => {
  const mockPackageJson: PackageJson = {
    name: 'test-app',
    dependencies: {
      '@tanstack/react-query': '^5.0.0',
    },
    devDependencies: {
      '@tanstack/react-query-devtools': '^5.0.0',
    },
  }

  it('should build cards for all plugins in registry', () => {
    const cards = buildPluginCards(mockPackageJson, 'react', new Set(), [])

    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((card) => card.devtoolsPackage)).toBe(true)
  })

  it('should mark plugins as current framework', () => {
    const cards = buildPluginCards(mockPackageJson, 'react', new Set(), [])

    const reactPlugins = cards.filter((c) => c.framework === 'react')
    expect(reactPlugins.every((c) => c.isCurrentFramework)).toBe(true)
  })

  it('should mark wrong framework plugins', () => {
    const cards = buildPluginCards(mockPackageJson, 'vue', new Set(), [])

    const reactPlugins = cards.filter((c) => c.framework === 'react')
    expect(reactPlugins.every((c) => c.actionType === 'wrong-framework')).toBe(
      true,
    )
  })

  it('should detect already installed and registered plugins', () => {
    const registeredPlugins = new Set(['tanstack-query'])

    const cards = buildPluginCards(
      mockPackageJson,
      'react',
      registeredPlugins,
      [],
    )

    const queryPlugin = cards.find(
      (c) => c.devtoolsPackage === '@tanstack/react-query-devtools',
    )

    expect(queryPlugin?.hasDevtools).toBe(true)
    expect(queryPlugin?.isRegistered).toBe(true)
    expect(queryPlugin?.actionType).toBe('already-installed')
  })

  it('should detect add-to-devtools action when installed but not registered', () => {
    const cards = buildPluginCards(mockPackageJson, 'react', new Set(), [])

    const queryPlugin = cards.find(
      (c) => c.devtoolsPackage === '@tanstack/react-query-devtools',
    )

    expect(queryPlugin?.hasDevtools).toBe(true)
    expect(queryPlugin?.isRegistered).toBe(false)
    expect(queryPlugin?.actionType).toBe('add-to-devtools')
  })

  it('should detect requires-package action', () => {
    const pkgWithoutQuery: PackageJson = {
      name: 'test-app',
      dependencies: {},
    }

    const cards = buildPluginCards(pkgWithoutQuery, 'react', new Set(), [])

    const queryPlugin = cards.find(
      (c) => c.devtoolsPackage === '@tanstack/react-query-devtools',
    )

    expect(queryPlugin?.actionType).toBe('requires-package')
  })

  it('should detect install-devtools action', () => {
    const pkgWithQuery: PackageJson = {
      name: 'test-app',
      dependencies: {
        '@tanstack/react-query': '^5.0.0',
      },
    }

    const cards = buildPluginCards(pkgWithQuery, 'react', new Set(), [])

    const queryPlugin = cards.find(
      (c) => c.devtoolsPackage === '@tanstack/react-query-devtools',
    )

    expect(queryPlugin?.hasPackage).toBe(true)
    expect(queryPlugin?.hasDevtools).toBe(false)
    expect(queryPlugin?.actionType).toBe('install-devtools')
  })

  it('should preserve status from existing cards', () => {
    const existingCards: Array<PluginCard> = [
      {
        requiredPackageName: '@tanstack/react-query',
        devtoolsPackage: '@tanstack/react-query-devtools',
        framework: 'react',
        hasPackage: false,
        hasDevtools: false,
        isRegistered: false,
        actionType: 'install',
        status: 'installing',
        isCurrentFramework: true,
        metadata: {
          packageName: '@tanstack/react-query-devtools',
          title: 'Query',
          framework: 'react',
        },
      },
    ]

    const cards = buildPluginCards(
      mockPackageJson,
      'react',
      new Set(),
      existingCards,
    )

    const queryPlugin = cards.find(
      (c) => c.devtoolsPackage === '@tanstack/react-query-devtools',
    )

    expect(queryPlugin?.status).toBe('installing')
  })

  it('should handle framework-agnostic plugins', () => {
    const cards = buildPluginCards(mockPackageJson, 'react', new Set(), [])

    const otherFrameworkPlugins = cards.filter(
      (c) => c.metadata?.framework === 'other',
    )
    expect(otherFrameworkPlugins.every((c) => c.isCurrentFramework)).toBe(true)
  })
})
