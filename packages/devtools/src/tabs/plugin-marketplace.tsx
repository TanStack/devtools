import { For, Show, createSignal, onMount } from 'solid-js'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import { Button } from '@tanstack/devtools-ui'
import { useStyles } from '../styles/use-styles'
import { usePlugins } from '../context/use-devtools-context'
import type { PackageJson } from '@tanstack/devtools-client'

// Comprehensive list of all TanStack devtools packages
// Pattern: @tanstack/<framework>-<name> => @tanstack/<framework>-<name>-devtools
const TANSTACK_FRAMEWORKS = ['react', 'solid', 'vue', 'svelte', 'angular'] as const
const TANSTACK_PACKAGES = ['query', 'router', 'form', 'pacer'] as const
const FRAMEWORK_AGNOSTIC_PACKAGES = ['table'] as const

type InstallStatus = 'idle' | 'installing' | 'success' | 'error'
type ActionType = 'install' | 'add-to-devtools' | 'requires-package' | 'wrong-framework'

interface PluginCard {
  packageName: string
  devtoolsPackage: string
  framework: string
  package: string
  hasPackage: boolean
  hasDevtools: boolean
  isRegistered: boolean
  actionType: ActionType
  status: InstallStatus
  error?: string
  isCurrentFramework: boolean
}

interface FrameworkSection {
  framework: string
  displayName: string
  cards: Array<PluginCard>
  isActive: boolean
}

// Simple icon components
const PackageIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 9.39999L7.5 4.20999M12 17.5L12 3M21 16V7.99999C20.9996 7.64926 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.26999L13 2.26999C12.696 2.09446 12.3511 2.00204 12 2.00204C11.6489 2.00204 11.304 2.09446 11 2.26999L4 6.26999C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64926 3 7.99999V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const CheckCircleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76489 14.1003 1.98232 16.07 2.85999M22 4L12 14.01L9 11.01"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const XCircleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

export const PluginMarketplace = () => {
  const styles = useStyles()
  const { plugins } = usePlugins()
  const [frameworkSections, setFrameworkSections] = createSignal<Array<FrameworkSection>>([])
  const [searchInput, setSearchInput] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [collapsedSections, setCollapsedSections] = createSignal<Set<string>>(new Set())

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
      card.packageName.toLowerCase().includes(lowerQuery) ||
      card.framework.toLowerCase().includes(lowerQuery) ||
      card.package.toLowerCase().includes(lowerQuery)
    )
  }

  const getFilteredSections = () => {
    const query = searchQuery()
    if (!query) return frameworkSections()

    return frameworkSections()
      .map((section) => ({
        ...section,
        cards: section.cards.filter((card) => matchesSearch(card, query)),
      }))
      .filter((section) => section.cards.length > 0)
  }

  onMount(() => {
    // Listen for package.json updates
    devtoolsEventClient.on('package-json-read', (event) => {
      updatePluginCards(event.payload.packageJson)
    })

    devtoolsEventClient.on('package-json-updated', (event) => {
      updatePluginCards(event.payload.packageJson)
    })

    // Listen for installation results
    devtoolsEventClient.on('devtools-installed', (event) => {
      setFrameworkSections((prevSections) =>
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

      // Refresh the list after successful installation
      if (event.payload.success) {
        setTimeout(() => {
          devtoolsEventClient.emit('mounted', undefined)
        }, 1000)
      }
    })

    // Emit mounted event to trigger package.json read
    devtoolsEventClient.emit('mounted', undefined)
  })

  const detectFramework = (pkg: PackageJson): string => {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    // Check for framework-specific packages
    for (const framework of TANSTACK_FRAMEWORKS) {
      const frameworkPackages = [
        `${framework}`,
        `@${framework}/core`,
        `@tanstack/${framework}-query`,
        `@tanstack/${framework}-router`,
        `@tanstack/${framework}-form`,
        `@tanstack/${framework}-table`,
      ]

      if (frameworkPackages.some((pkg) => allDeps[pkg])) {
        return framework
      }
    }

    return 'unknown'
  }

  const updatePluginCards = (pkg: PackageJson | null) => {
    if (!pkg) return

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    const currentFramework = detectFramework(pkg)

    // Get list of registered plugin names
    const registeredPlugins = new Set(
      plugins()?.map((p) => {
        return p.id || ''
      }) || [],
    )

    const allCards: Array<PluginCard> = []

    // Generate all possible combinations
    TANSTACK_FRAMEWORKS.forEach((framework) => {
      TANSTACK_PACKAGES.forEach((pkg) => {
        // Special handling for router (it's just @tanstack/router-devtools for react)
        const packageName =
          pkg === 'router' && framework === 'react'
            ? '@tanstack/react-router'
            : `@tanstack/${framework}-${pkg}`

        const devtoolsPackage =
          pkg === 'router' && framework === 'react'
            ? '@tanstack/router-devtools'
            : `@tanstack/${framework}-${pkg}-devtools`

        const hasPackage = !!allDeps[packageName]
        const hasDevtools = !!allDeps[devtoolsPackage]
        const isCurrentFramework = framework === currentFramework

        // Check if plugin is registered
        const isRegistered =
          registeredPlugins.has(devtoolsPackage) ||
          registeredPlugins.has(packageName) ||
          Array.from(registeredPlugins).some(
            (id) => id.includes(pkg) && id.includes(framework),
          )

        // Determine action type
        let actionType: ActionType
        if (!isCurrentFramework) {
          actionType = 'wrong-framework'
        } else if (!hasPackage) {
          actionType = 'requires-package'
        } else if (hasDevtools && !isRegistered) {
          actionType = 'add-to-devtools'
        } else if (!hasDevtools) {
          actionType = 'install'
        } else {
          // Has package, has devtools, and is registered - skip
          return
        }

        // Find existing card to preserve status
        const existing = frameworkSections()
          .flatMap((s) => s.cards)
          .find((c) => c.devtoolsPackage === devtoolsPackage)

        allCards.push({
          packageName,
          devtoolsPackage,
          framework,
          package: pkg,
          hasPackage,
          hasDevtools,
          isRegistered,
          actionType,
          status: existing?.status || 'idle',
          error: existing?.error,
          isCurrentFramework,
        })
      })
    })

    // Also add framework-agnostic packages (table)
    FRAMEWORK_AGNOSTIC_PACKAGES.forEach((pkg) => {
      TANSTACK_FRAMEWORKS.forEach((framework) => {
        const packageName = `@tanstack/${framework}-${pkg}`
        const devtoolsPackage = `@tanstack/${framework}-${pkg}-devtools`

        const hasPackage = !!allDeps[packageName]
        const hasDevtools = !!allDeps[devtoolsPackage]
        const isCurrentFramework = framework === currentFramework

        const isRegistered =
          registeredPlugins.has(devtoolsPackage) ||
          registeredPlugins.has(packageName) ||
          Array.from(registeredPlugins).some(
            (id) => id.includes(pkg) && id.includes(framework),
          )

        let actionType: ActionType
        if (!isCurrentFramework) {
          actionType = 'wrong-framework'
        } else if (!hasPackage) {
          actionType = 'requires-package'
        } else if (hasDevtools && !isRegistered) {
          actionType = 'add-to-devtools'
        } else if (!hasDevtools) {
          actionType = 'install'
        } else {
          return
        }

        const existing = frameworkSections()
          .flatMap((s) => s.cards)
          .find((c) => c.devtoolsPackage === devtoolsPackage)

        allCards.push({
          packageName,
          devtoolsPackage,
          framework,
          package: pkg,
          hasPackage,
          hasDevtools,
          isRegistered,
          actionType,
          status: existing?.status || 'idle',
          error: existing?.error,
          isCurrentFramework,
        })
      })
    })

    // Group cards by framework
    const sections: Array<FrameworkSection> = []

    TANSTACK_FRAMEWORKS.forEach((framework) => {
      const frameworkCards = allCards.filter((c) => c.framework === framework)

      if (frameworkCards.length > 0) {
        sections.push({
          framework,
          displayName: framework.charAt(0).toUpperCase() + framework.slice(1),
          cards: frameworkCards,
          isActive: framework === currentFramework,
        })
      }
    })

    // Sort sections: current framework first, then others
    sections.sort((a, b) => {
      if (a.isActive) return -1
      if (b.isActive) return 1
      return a.displayName.localeCompare(b.displayName)
    })

    setFrameworkSections(sections)

    // Collapse non-active sections by default
    const newCollapsed = new Set<string>()
    sections.forEach((section) => {
      if (!section.isActive) {
        newCollapsed.add(section.framework)
      }
    })
    setCollapsedSections(newCollapsed)
  }

  const handleAction = (card: PluginCard) => {
    if (card.actionType === 'requires-package' || card.actionType === 'wrong-framework') {
      // Can't install devtools without the base package or wrong framework
      return
    }

    if (card.actionType === 'add-to-devtools') {
      // Show instructions to add to devtools manually
      alert(
        `To add ${card.devtoolsPackage} to your devtools:\n\n` +
        `1. Import the package in your code\n` +
        `2. Add it to the plugins array in <TanStackDevtools plugins={[...]} />\n\n` +
        `Example:\nimport { ${card.package}Devtools } from '${card.devtoolsPackage}'\n\n` +
        `plugins={[\n  { name: '${card.package}', render: <${card.package}Devtools /> }\n]}`,
      )
      return
    }

    // Install the devtools package
    setFrameworkSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        cards: section.cards.map((c) =>
          c.devtoolsPackage === card.devtoolsPackage
            ? { ...c, status: 'installing' }
            : c,
        ),
      })),
    )

    devtoolsEventClient.emit('install-devtools', {
      packageName: card.devtoolsPackage,
    })
  }

  const getButtonText = (card: PluginCard) => {
    if (card.status === 'installing') return 'Installing...'
    if (card.status === 'success') return 'Installed!'
    if (card.status === 'error') return 'Error'

    switch (card.actionType) {
      case 'install':
        return 'Install'
      case 'add-to-devtools':
        return 'Add to Devtools'
      case 'requires-package':
        return `Requires ${card.package}`
      case 'wrong-framework':
        return 'Different Framework'
      default:
        return 'Install'
    }
  }

  const getButtonVariant = (card: PluginCard) => {
    if (
      card.actionType === 'requires-package' ||
      card.actionType === 'wrong-framework'
    )
      return 'secondary'
    return 'primary'
  }

  const getBadgeClass = (card: PluginCard) => {
    const s = styles()
    const base = s.pluginMarketplaceCardBadge
    switch (card.actionType) {
      case 'install':
        return `${base} ${s.pluginMarketplaceCardBadgeInstall}`
      case 'add-to-devtools':
        return `${base} ${s.pluginMarketplaceCardBadgeAdd}`
      case 'requires-package':
      case 'wrong-framework':
        return `${base} ${s.pluginMarketplaceCardBadgeRequires}`
      default:
        return base
    }
  }

  const getBadgeText = (card: PluginCard) => {
    switch (card.actionType) {
      case 'install':
        return 'Available'
      case 'add-to-devtools':
        return 'Installed'
      case 'requires-package':
        return 'Unavailable'
      case 'wrong-framework':
        return 'Other Framework'
      default:
        return ''
    }
  }

  return (
    <div class={styles().pluginMarketplace}>
      <div class={styles().pluginMarketplaceHeader}>
        <h2 class={styles().pluginMarketplaceTitle}>Plugin Marketplace</h2>
        <p class={styles().pluginMarketplaceDescription}>
          Discover and install devtools for TanStack Query, Router, Form, and
          Pacer
        </p>

        <div class={styles().pluginMarketplaceSearchWrapper}>
          <SearchIcon />
          <input
            type="text"
            class={styles().pluginMarketplaceSearch}
            placeholder="Search plugins by name, package, or framework..."
            value={searchInput()}
            onInput={(e) => handleSearchInput(e.currentTarget.value)}
          />
        </div>
      </div>

      <Show when={getFilteredSections().length > 0}>
        <For each={getFilteredSections()}>
          {(section) => (
            <div class={styles().pluginMarketplaceSection}>
              <div
                class={styles().pluginMarketplaceSectionHeader}
                onClick={() => toggleSection(section.framework)}
              >
                <div class={styles().pluginMarketplaceSectionHeaderLeft}>
                  <div
                    class={styles().pluginMarketplaceSectionChevron}
                    classList={{
                      [styles().pluginMarketplaceSectionChevronCollapsed]:
                        collapsedSections().has(section.framework)
                    }}
                  >
                    <ChevronDownIcon />
                  </div>
                  <h3 class={styles().pluginMarketplaceSectionTitle}>
                    {section.displayName}
                    {section.isActive && (
                      <span class={styles().pluginMarketplaceSectionBadge}>
                        Your Framework
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <Show when={!collapsedSections().has(section.framework)}>
                <div class={styles().pluginMarketplaceGrid}>
                  <For each={section.cards}>
                    {(card) => (
                      <div
                        class={styles().pluginMarketplaceCard}
                        classList={{
                          [styles().pluginMarketplaceCardDisabled]:
                            !card.isCurrentFramework,
                        }}
                      >
                        <span class={getBadgeClass(card)}>
                          {getBadgeText(card)}
                        </span>
                        <div class={styles().pluginMarketplaceCardIcon}>
                          <PackageIcon />
                        </div>
                        <div class={styles().pluginMarketplaceCardHeader}>
                          <h3 class={styles().pluginMarketplaceCardTitle}>
                            {card.devtoolsPackage}
                          </h3>
                          <p class={styles().pluginMarketplaceCardDescription}>
                            {card.actionType === 'requires-package'
                              ? `Requires ${card.packageName}`
                              : card.actionType === 'wrong-framework'
                                ? `For ${section.displayName} projects`
                                : `For ${card.packageName}`}
                          </p>
                        </div>

                        <Show
                          when={card.status === 'idle'}
                          fallback={
                            <div class={styles().pluginMarketplaceCardStatus}>
                              <Show when={card.status === 'installing'}>
                                <div
                                  class={styles().pluginMarketplaceCardSpinner}
                                />
                                <span
                                  class={
                                    styles().pluginMarketplaceCardStatusText
                                  }
                                >
                                  Installing...
                                </span>
                              </Show>
                              <Show when={card.status === 'success'}>
                                <CheckCircleIcon />
                                <span
                                  class={
                                    styles().pluginMarketplaceCardStatusText
                                  }
                                >
                                  Installed!
                                </span>
                              </Show>
                              <Show when={card.status === 'error'}>
                                <XCircleIcon />
                                <span
                                  class={
                                    styles()
                                      .pluginMarketplaceCardStatusTextError
                                  }
                                >
                                  {card.error || 'Failed to install'}
                                </span>
                              </Show>
                            </div>
                          }
                        >
                          <Button
                            variant={getButtonVariant(card)}
                            onClick={() => handleAction(card)}
                            disabled={
                              card.status !== 'idle' ||
                              card.actionType === 'requires-package' ||
                              card.actionType === 'wrong-framework'
                            }
                          >
                            {getButtonText(card)}
                          </Button>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
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
