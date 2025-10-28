import { getAllPluginMetadata } from '../plugin-registry'
import { satisfiesVersionRange } from '../semver-utils'
import type { PackageJson } from '@tanstack/devtools-client'
import type { ActionType, FRAMEWORKS, PluginCard, PluginSection } from './types'

export const detectFramework = (
  pkg: PackageJson,
  frameworks: typeof FRAMEWORKS,
): string => {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  }

  // Map of framework to their actual package names
  const frameworkPackageMap: Record<string, Array<string>> = {
    react: ['react', 'react-dom'],
    vue: ['vue', '@vue/core'],
    solid: ['solid-js'],
    svelte: ['svelte'],
    angular: ['@angular/core'],
  }

  // Check for actual framework packages
  for (const framework of frameworks) {
    const frameworkPackages = frameworkPackageMap[framework]
    if (frameworkPackages && frameworkPackages.some((pkg) => allDeps[pkg])) {
      return framework
    }
  }

  return 'unknown'
}

export const isPluginRegistered = (
  registeredPlugins: Set<string>,
  packageName: string,
  pluginName: string,
  framework: string,
  pluginId?: string,
): boolean => {
  // If a custom pluginId is provided, use it for matching
  if (pluginId) {
    return Array.from(registeredPlugins).some((id) => {
      const idLower = id.toLowerCase()
      const pluginIdLower = pluginId.toLowerCase()
      // Match if the registered id starts with the pluginId or contains it
      return (
        idLower.startsWith(pluginIdLower) || idLower.includes(pluginIdLower)
      )
    })
  }

  // Direct match on package name
  if (registeredPlugins.has(packageName)) return true

  // Check if any registered plugin name contains the key parts
  // Extract meaningful words from pluginName (split by common delimiters)
  const pluginWords = pluginName
    .toLowerCase()
    .split(/[-_/@]/)
    .filter((word) => word.length > 0)
  const frameworkPart = framework.toLowerCase()

  return Array.from(registeredPlugins).some((id) => {
    const idLower = id.toLowerCase()

    // Match if registered id contains the full pluginName
    if (idLower.includes(pluginName.toLowerCase())) {
      return true
    }

    // Match if multiple key words from pluginName are found in the registered id
    const matchedWords = pluginWords.filter((word) => idLower.includes(word))

    // If we match multiple words, it's likely the same plugin
    if (matchedWords.length >= 2) {
      return true
    }

    // Match if framework and at least one plugin word match
    if (idLower.includes(frameworkPart) && matchedWords.length >= 1) {
      return true
    }

    return false
  })
}

export const buildPluginCards = (
  pkg: PackageJson,
  currentFramework: string,
  registeredPlugins: Set<string>,
  existingCards: Array<PluginCard>,
): Array<PluginCard> => {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  }

  const allCards: Array<PluginCard> = []

  // Iterate through all plugins in the registry
  const allPlugins = getAllPluginMetadata()

  allPlugins.forEach((metadata) => {
    const devtoolsPackage = metadata.packageName

    // Check if plugin's framework matches current framework or is 'other' (framework-agnostic)
    const isCurrentFramework =
      metadata.framework === currentFramework || metadata.framework === 'other'

    // Extract package name from devtools package
    // For @tanstack/react-query-devtools, the base package is @tanstack/react-query
    const requiredPackageName = metadata.requires?.packageName

    const hasPackage = requiredPackageName
      ? !!allDeps[requiredPackageName]
      : false
    const hasDevtools = !!allDeps[devtoolsPackage]

    // Check version requirements based on the requires field
    let versionInfo: PluginCard['versionInfo'] | undefined
    if (hasPackage && metadata.requires) {
      const currentVersion = requiredPackageName
        ? allDeps[requiredPackageName]
        : undefined
      if (currentVersion) {
        const versionCheck = satisfiesVersionRange(
          currentVersion,
          metadata.requires.minVersion,
          metadata.requires.maxVersion,
        )
        versionInfo = {
          current: currentVersion,
          required: metadata.requires.minVersion,
          satisfied: versionCheck.satisfied,
          reason: versionCheck.reason,
        }
      }
    }

    // Check if plugin is registered
    const isRegistered = isPluginRegistered(
      registeredPlugins,
      devtoolsPackage,
      metadata.packageName,
      metadata.framework,
      metadata.pluginId,
    )

    // Determine action type
    let actionType: ActionType
    if (!isCurrentFramework) {
      actionType = 'wrong-framework'
    } else if (metadata.requires && !hasPackage) {
      actionType = 'requires-package'
    } else if (versionInfo && !versionInfo.satisfied) {
      // Version doesn't meet requirements - need to bump
      actionType = 'bump-version'
    } else if (hasDevtools && isRegistered) {
      actionType = 'already-installed'
    } else if (hasDevtools && !isRegistered) {
      actionType = 'add-to-devtools'
    } else if (!hasDevtools && metadata.requires && hasPackage) {
      // Requirement is met but devtools package not installed
      actionType = 'install-devtools'
    } else if (!hasDevtools) {
      actionType = 'install'
    } else {
      // Fallback - should not reach here
      actionType = 'install'
    }

    // Find existing card to preserve status
    const existing = existingCards.find(
      (c) => c.devtoolsPackage === devtoolsPackage,
    )

    allCards.push({
      requiredPackageName: requiredPackageName || '',
      devtoolsPackage,
      framework: metadata.framework,
      hasPackage,
      hasDevtools,
      isRegistered,
      actionType,
      status: existing?.status || 'idle',
      error: existing?.error,
      isCurrentFramework,
      metadata,
      versionInfo,
    })
  })

  return allCards
}

export const groupIntoSections = (
  allCards: Array<PluginCard>,
): Array<PluginSection> => {
  const sections: Array<PluginSection> = []

  // Add Featured section first - always show this section
  const featuredCards = allCards.filter(
    (c) =>
      c.metadata?.featured &&
      c.actionType !== 'already-installed' &&
      c.isCurrentFramework, // Only show featured plugins for current framework
  )
  // Always add featured section, even if no cards to show the partner banner
  sections.push({
    id: 'featured',
    displayName: '⭐ Featured',
    cards: featuredCards,
  })

  // Add Active Plugins section
  const activeCards = allCards.filter(
    (c) => c.actionType === 'already-installed' && c.isRegistered,
  )
  if (activeCards.length > 0) {
    sections.push({
      id: 'active',
      displayName: '✓ Active Plugins',
      cards: activeCards,
    })
  }

  // Add Available section - all plugins for current framework (TanStack + third-party)
  const availableCards = allCards.filter(
    (c) =>
      c.isCurrentFramework &&
      c.actionType !== 'already-installed' &&
      !c.metadata?.featured, // Not featured (already in featured section)
  )

  if (availableCards.length > 0) {
    sections.push({
      id: 'available',
      displayName: 'Available Plugins',
      cards: availableCards,
    })
  }

  return sections
}
