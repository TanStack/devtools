import { For, Show, createSignal, onMount } from 'solid-js'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import { Button } from '@tanstack/devtools-ui'
import { useStyles } from '../styles/use-styles'
import type { PackageJson } from '@tanstack/devtools-client'

// Map of TanStack packages to their devtools packages
const TANSTACK_DEVTOOLS_MAP: Record<string, string> = {
  '@tanstack/react-query': '@tanstack/react-query-devtools',
  '@tanstack/solid-query': '@tanstack/solid-query-devtools',
  '@tanstack/vue-query': '@tanstack/vue-query-devtools',
  '@tanstack/svelte-query': '@tanstack/svelte-query-devtools',
  '@tanstack/angular-query-experimental':
    '@tanstack/angular-query-devtools-experimental',
  '@tanstack/react-router': '@tanstack/router-devtools',
  '@tanstack/react-table': '@tanstack/react-table-devtools',
  '@tanstack/solid-table': '@tanstack/solid-table-devtools',
  '@tanstack/vue-table': '@tanstack/vue-table-devtools',
  '@tanstack/svelte-table': '@tanstack/svelte-table-devtools',
}

type InstallStatus = 'idle' | 'installing' | 'success' | 'error'

interface SuggestedPlugin {
  packageName: string
  devtoolsPackage: string
  status: InstallStatus
  error?: string
}

// Simple icon components
const PackageIcon = () => (
  <svg
    width="64"
    height="64"
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

export const NoPluginsFallback = () => {
  const styles = useStyles()
  const [packageJson, setPackageJson] = createSignal<PackageJson | null>(null)
  const [suggestedPlugins, setSuggestedPlugins] = createSignal<
    Array<SuggestedPlugin>
  >([])

  onMount(() => {
    // Listen for package.json updates
    devtoolsEventClient.on('package-json-read', (event) => {
      setPackageJson(event.payload.packageJson)
      updateSuggestedPlugins(event.payload.packageJson)
    })

    devtoolsEventClient.on('package-json-updated', (event) => {
      setPackageJson(event.payload.packageJson)
      updateSuggestedPlugins(event.payload.packageJson)
    })

    // Listen for installation results
    devtoolsEventClient.on('devtools-installed', (event) => {
      setSuggestedPlugins((prev) =>
        prev.map((plugin) =>
          plugin.devtoolsPackage === event.payload.packageName
            ? {
                ...plugin,
                status: event.payload.success ? 'success' : 'error',
                error: event.payload.error,
              }
            : plugin,
        ),
      )

      // Remove successfully installed packages after a delay
      if (event.payload.success) {
        setTimeout(() => {
          setSuggestedPlugins((prev) =>
            prev.filter(
              (plugin) => plugin.devtoolsPackage !== event.payload.packageName,
            ),
          )
        }, 3000)
      }
    })

    // Emit mounted event to trigger package.json read
    devtoolsEventClient.emit('mounted', undefined)
  })

  const updateSuggestedPlugins = (pkg: PackageJson | null) => {
    if (!pkg) return

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    const suggestions: Array<SuggestedPlugin> = []

    Object.entries(TANSTACK_DEVTOOLS_MAP).forEach(
      ([sourcePackage, devtoolsPackage]) => {
        // Check if the source package is installed but devtools is not
        if (allDeps[sourcePackage] && !allDeps[devtoolsPackage]) {
          // Only add if not already in the list
          const existing = suggestedPlugins().find(
            (p) => p.devtoolsPackage === devtoolsPackage,
          )
          if (!existing) {
            suggestions.push({
              packageName: sourcePackage,
              devtoolsPackage: devtoolsPackage,
              status: 'idle',
            })
          } else {
            // Preserve existing status
            suggestions.push(existing)
          }
        }
      },
    )

    setSuggestedPlugins(suggestions)
  }

  const handleInstall = (plugin: SuggestedPlugin) => {
    setSuggestedPlugins((prev) =>
      prev.map((p) =>
        p.devtoolsPackage === plugin.devtoolsPackage
          ? { ...p, status: 'installing' }
          : p,
      ),
    )

    devtoolsEventClient.emit('install-devtools', {
      packageName: plugin.devtoolsPackage,
    })
  }

  return (
    <div class={styles().noPluginsFallback}>
      <div class={styles().noPluginsFallbackContent}>
        <div class={styles().noPluginsFallbackIcon}>
          <PackageIcon />
        </div>

        <h2 class={styles().noPluginsFallbackTitle}>No Plugins Registered</h2>

        <p class={styles().noPluginsFallbackDescription}>
          You don't have any devtools plugins registered yet. TanStack Devtools
          can enhance your development experience with specialized tools for
          TanStack libraries.
        </p>

        <Show when={suggestedPlugins().length > 0}>
          <div class={styles().noPluginsSuggestions}>
            <h3 class={styles().noPluginsSuggestionsTitle}>
              Suggested Plugins
            </h3>
            <p class={styles().noPluginsSuggestionsDesc}>
              We detected the following TanStack packages in your project. Would
              you like to install their devtools?
            </p>

            <div class={styles().noPluginsSuggestionsList}>
              <For each={suggestedPlugins()}>
                {(plugin) => (
                  <div class={styles().noPluginsSuggestionCard}>
                    <div class={styles().noPluginsSuggestionInfo}>
                      <h4 class={styles().noPluginsSuggestionPackage}>
                        {plugin.devtoolsPackage}
                      </h4>
                      <p class={styles().noPluginsSuggestionSource}>
                        For {plugin.packageName}
                      </p>
                    </div>

                    <Show
                      when={plugin.status === 'idle'}
                      fallback={
                        <div class={styles().noPluginsSuggestionStatus}>
                          <Show when={plugin.status === 'installing'}>
                            <span
                              class={styles().noPluginsSuggestionStatusText}
                            >
                              Installing...
                            </span>
                          </Show>
                          <Show when={plugin.status === 'success'}>
                            <CheckCircleIcon />
                            <span
                              class={styles().noPluginsSuggestionStatusText}
                            >
                              Installed!
                            </span>
                          </Show>
                          <Show when={plugin.status === 'error'}>
                            <XCircleIcon />
                            <span
                              class={
                                styles().noPluginsSuggestionStatusTextError
                              }
                            >
                              {plugin.error || 'Failed to install'}
                            </span>
                          </Show>
                        </div>
                      }
                    >
                      <Button
                        variant="primary"
                        onClick={() => handleInstall(plugin)}
                        disabled={plugin.status !== 'idle'}
                      >
                        Install
                      </Button>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={suggestedPlugins().length === 0}>
          <div class={styles().noPluginsEmptyState}>
            <p class={styles().noPluginsEmptyStateText}>
              No TanStack packages detected in your project. Install a TanStack
              library and its corresponding devtools package to get started.
            </p>
          </div>
        </Show>

        <div class={styles().noPluginsFallbackLinks}>
          <a
            href="https://tanstack.com/devtools/latest/docs/overview"
            target="_blank"
            rel="noopener noreferrer"
            class={styles().noPluginsFallbackLink}
          >
            View Documentation
          </a>
          <span class={styles().noPluginsFallbackLinkSeparator}>•</span>
          <a
            href="https://github.com/TanStack/devtools"
            target="_blank"
            rel="noopener noreferrer"
            class={styles().noPluginsFallbackLink}
          >
            GitHub Repository
          </a>
        </div>
      </div>
    </div>
  )
}
