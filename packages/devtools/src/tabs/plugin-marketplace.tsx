import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import { usePlugins } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import { PluginSectionComponent } from './marketplace/plugin-section'
import { SettingsPanel } from './marketplace/settings-panel'
import { MarketplaceHeader } from './marketplace/marketplace-header'
import { FRAMEWORKS } from './marketplace/types'
import {
  buildPluginCards,
  detectFramework,
  groupIntoSections,
} from './marketplace/plugin-utils'
import type { PackageJson } from '@tanstack/devtools-client'
import type { PluginCard, PluginSection } from './marketplace/types'

export const PluginMarketplace = () => {
  const styles = useStyles()
  const { plugins } = usePlugins()
  const [pluginSections, setPluginSections] = createSignal<
    Array<PluginSection>
  >([])
  const [currentPackageJson, setCurrentPackageJson] =
    createSignal<PackageJson | null>(null)
  const [searchInput, setSearchInput] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [collapsedSections, setCollapsedSections] = createSignal<Set<string>>(
    new Set(),
  )
  const [showActivePlugins, setShowActivePlugins] = createSignal(true)
  const [selectedTags, setSelectedTags] = createSignal<Set<string>>(new Set())
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)

  let debounceTimeout: ReturnType<typeof setTimeout> | undefined

  // Debounce search input
  const handleSearchInput = (value: string) => {
    setSearchInput(value)

    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    debounceTimeout = setTimeout(() => {
      setSearchQuery(value)
    }, 300)
  }

  const toggleSection = (framework: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(framework)) {
        newSet.delete(framework)
      } else {
        newSet.add(framework)
      }
      return newSet
    })
  }

  const matchesSearch = (card: PluginCard, query: string): boolean => {
    if (!query) return true

    const lowerQuery = query.toLowerCase()
    return (
      card.devtoolsPackage.toLowerCase().includes(lowerQuery) ||
      card.requiredPackageName.toLowerCase().includes(lowerQuery) ||
      card.framework.toLowerCase().includes(lowerQuery)
    )
  }

  const getFilteredSections = () => {
    const query = searchQuery()
    const showActive = showActivePlugins()
    const tags = selectedTags()
    const pkg = currentPackageJson()

    // Regenerate sections from current plugin state
    if (!pkg) return []

    const currentFramework = detectFramework(pkg, FRAMEWORKS)
    const registeredPlugins = new Set(plugins()?.map((p) => p.id || '') || [])

    // Build fresh cards from current state
    const allCards = buildPluginCards(
      pkg,
      currentFramework,
      registeredPlugins,
      pluginSections().flatMap((s) => s.cards), // Preserve status from existing cards
    )

    // Generate sections from cards
    let sections = groupIntoSections(allCards)

    // Filter out active plugins section if hidden
    if (!showActive) {
      sections = sections.filter((section) => section.id !== 'active')
    }

    // Filter by tags if any are selected
    if (tags.size > 0) {
      sections = sections
        .map((section) => ({
          ...section,
          cards: section.cards.filter((card) => {
            if (!card.metadata?.tags) return false
            return card.metadata.tags.some((tag) => tags.has(tag))
          }),
        }))
        .filter((section) => section.cards.length > 0)
    }

    // Apply search filter
    if (!query) return sections

    return sections
      .map((section) => ({
        ...section,
        cards: section.cards.filter((card) => matchesSearch(card, query)),
      }))
      .filter((section) => section.cards.length > 0)
  }

  onMount(() => {
    // Listen for package.json updates
    const cleanupJsonRead = devtoolsEventClient.on(
      'package-json-read',
      (event) => {
        setCurrentPackageJson(event.payload.packageJson)
        updatePluginCards(event.payload.packageJson)
      },
    )

    const cleanupJsonUpdated = devtoolsEventClient.on(
      'package-json-updated',
      (event) => {
        setCurrentPackageJson(event.payload.packageJson)
        updatePluginCards(event.payload.packageJson)
      },
    )

    // Listen for installation results
    const cleanupDevtoolsInstalled = devtoolsEventClient.on(
      'devtools-installed',
      (event) => {
        setPluginSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            cards: section.cards.map((card) =>
              card.devtoolsPackage === event.payload.packageName
                ? {
                    ...card,
                    status: event.payload.success ? 'success' : 'error',
                    error: event.payload.error,
                  }
                : card,
            ),
          })),
        )
      },
    )

    // Listen for plugin added results
    const cleanupPluginAdded = devtoolsEventClient.on(
      'plugin-added',
      (event) => {
        setPluginSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            cards: section.cards.map((card) =>
              card.devtoolsPackage === event.payload.packageName
                ? {
                    ...card,
                    status: event.payload.success ? 'success' : 'error',
                    error: event.payload.error,
                  }
                : card,
            ),
          })),
        )

        // When plugin is successfully added, recalculate to move it to active section
        if (event.payload.success) {
          const pkg = currentPackageJson()
          if (pkg) {
            updatePluginCards(pkg)
          }
        }
      },
    )

    onCleanup(() => {
      cleanupJsonRead()
      cleanupJsonUpdated()
      cleanupDevtoolsInstalled()
      cleanupPluginAdded()
    })
    // Emit mounted event to trigger package.json read
    devtoolsEventClient.emit('mounted', undefined)
  })

  const updatePluginCards = (pkg: PackageJson | null) => {
    if (!pkg) return

    const currentFramework = detectFramework(pkg, FRAMEWORKS)

    // Get list of registered plugin names
    const registeredPlugins = new Set(plugins()?.map((p) => p.id || '') || [])

    const allCards = buildPluginCards(
      pkg,
      currentFramework,
      registeredPlugins,
      pluginSections().flatMap((s) => s.cards),
    )

    const sections = groupIntoSections(allCards)
    setPluginSections(sections)
  }

  const handleAction = (card: PluginCard) => {
    if (
      card.actionType === 'requires-package' ||
      card.actionType === 'wrong-framework' ||
      card.actionType === 'already-installed' ||
      card.actionType === 'version-mismatch'
    ) {
      // Can't install devtools without the base package, wrong framework, already installed, or version mismatch
      return
    }

    // change state to installing of the plugin user clicked
    setPluginSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        cards: section.cards.map((c) =>
          c.devtoolsPackage === card.devtoolsPackage
            ? { ...c, status: 'installing' }
            : c,
        ),
      })),
    )

    // Bump the version of the required package and then add to devtools
    if (card.actionType === 'bump-version') {
      // emits the event to vite plugin to bump the package version, this will add it to devtools after
      devtoolsEventClient.emit('bump-package-version', {
        packageName: card.requiredPackageName,
        devtoolsPackage: card.devtoolsPackage,
        pluginName: card.metadata?.title || card.devtoolsPackage,
        minVersion: card.metadata?.requires?.minVersion,
        pluginImport: card.metadata?.pluginImport,
      })
      return
    }

    if (card.actionType === 'add-to-devtools') {
      // emits the event to vite plugin to add the plugin
      devtoolsEventClient.emit('add-plugin-to-devtools', {
        packageName: card.devtoolsPackage,
        // should always be defined
        pluginName: card.metadata?.title ?? card.devtoolsPackage,
        pluginImport: card.metadata?.pluginImport,
      })
      return
    }
    devtoolsEventClient.emit('install-devtools', {
      packageName: card.devtoolsPackage,
      // should always be defined
      pluginName: card.metadata?.title ?? card.devtoolsPackage,
      pluginImport: card.metadata?.pluginImport,
    })
  }

  // Get all available tags from plugins (excluding active plugins)
  const getAllTags = () => {
    const tags = new Set<string>()
    pluginSections().forEach((section) => {
      // Only get tags from featured and available sections, not active plugins
      if (section.id === 'featured' || section.id === 'available') {
        section.cards.forEach((card) => {
          if (card.metadata?.tags) {
            card.metadata.tags.forEach((tag) => tags.add(tag))
          }
        })
      }
    })
    return Array.from(tags).sort()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = new Set(prev)
      if (newTags.has(tag)) {
        newTags.delete(tag)
      } else {
        newTags.add(tag)
      }
      return newTags
    })
  }

  return (
    <div class={styles().pluginMarketplace}>
      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showActivePlugins={showActivePlugins}
        setShowActivePlugins={setShowActivePlugins}
      />

      <MarketplaceHeader
        searchInput={searchInput}
        onSearchInput={handleSearchInput}
        onSettingsClick={() => setIsSettingsOpen(!isSettingsOpen())}
        tags={getAllTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
      />

      <Show when={getFilteredSections().length > 0}>
        <For each={getFilteredSections()}>
          {(section) => (
            <PluginSectionComponent
              section={section}
              isCollapsed={() => collapsedSections().has(section.id)}
              onToggleCollapse={() => toggleSection(section.id)}
              onCardAction={handleAction}
            />
          )}
        </For>
      </Show>

      <Show when={getFilteredSections().length === 0}>
        <div class={styles().pluginMarketplaceEmpty}>
          <p class={styles().pluginMarketplaceEmptyText}>
            {searchQuery()
              ? `No plugins found matching "${searchQuery()}"`
              : 'No additional plugins available. You have all compatible devtools installed and registered!'}
          </p>
        </div>
      </Show>
    </div>
  )
}
