/** @jsxImportSource solid-js */

import {
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import {
  Button,
  Header,
  MainPanel,
  ThemeContextProvider,
  useTheme,
} from '@tanstack/devtools-ui'
import { a11yEventClient } from '../event-client'
import { getAvailableRules, groupIssuesByImpact } from '../scanner'
import {
  clearHighlights,
  highlightAllIssues,
  highlightElement,
} from '../overlay'
import { getA11yRuntime } from '../runtime'
import { useAllyContext } from '../contexts/allyContext'
import { RULE_SET_LABELS, SEVERITY_LABELS, useStyles } from './styles'
import { A11yIssueList } from './A11yIssueList'
import { A11ySettingsOverlay } from './A11ySettingsOverlay'
import type {
  A11yAuditResult,
  A11yPluginOptions,
  RuleCategory,
  RuleInfo,
  SeverityThreshold,
} from '../types'

interface A11yDevtoolsPanelProps {
  options?: A11yPluginOptions
  /** Theme passed from TanStack Devtools */
  theme?: 'light' | 'dark'
}

function scrollToElement(selector: string): boolean {
  try {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
      return true
    }
  } catch (error) {
    console.warn('[A11y Panel] Could not scroll to element:', selector, error)
  }
  return false
}

export function A11yDevtoolsPanel(props: A11yDevtoolsPanelProps) {
  let inheritedTheme: undefined | (() => 'light' | 'dark')
  const [datasetTheme, setDatasetTheme] = createSignal<
    'light' | 'dark' | undefined
  >(undefined)

  try {
    inheritedTheme = useTheme().theme
  } catch {
    inheritedTheme = undefined
  }

  onMount(() => {
    if (typeof document === 'undefined') {
      return
    }

    const root = document.documentElement
    const updateTheme = () => {
      const value = root.dataset.tanstackDevtoolsTheme
      if (value === 'light' || value === 'dark') {
        setDatasetTheme(value)
      }
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-tanstack-devtools-theme'],
    })

    onCleanup(() => observer.disconnect())
  })

  const theme = () =>
    props.theme ?? inheritedTheme?.() ?? datasetTheme() ?? 'light'

  const styles = useStyles()

  const runtime = getA11yRuntime(props.options ?? {})

  const { filteredIssues, audit, state } = useAllyContext()
  const [showOverlay, setShowOverlay] = createSignal<boolean>(false)

  const [config, setConfig] = createSignal(runtime.getConfig())

  const [uiState, setUiState] = createStore({
    isScanning: false,
    selectedIssueId: null as string | null,
    selectedSeverity: 'all' as 'all' | SeverityThreshold,
    showSettings: false,
    availableRules: [] as Array<RuleInfo>,
    ruleSearchQuery: '',
    selectedCategory: 'all' as RuleCategory,
  })

  const updateConfig = (patch: Partial<A11yPluginOptions>) => {
    setConfig((prev) => ({
      ...prev,
      ...patch,
      disabledRules: patch.disabledRules ?? prev.disabledRules,
    }))
    runtime.setConfig(patch)
  }

  const actions = {
    scan: async () => {
      setUiState('isScanning', true)
      try {
        await runtime.scan()
      } catch (error) {
        console.error('[A11y Panel] Scan failed:', error)
      } finally {
        setUiState('isScanning', false)
      }
    },
    openSettings: () => {
      setUiState(
        produce((state) => {
          state.availableRules = getAvailableRules()
          state.showSettings = true
        }),
      )
    },
    closeSettings: () => {
      setUiState(
        produce((state) => {
          state.showSettings = false
          state.ruleSearchQuery = ''
        }),
      )
    },
    toggleRule: (ruleId: string) => {
      const isDisabled = config().disabledRules.includes(ruleId)
      const nextDisabledRules = isDisabled
        ? config().disabledRules.filter((id) => id !== ruleId)
        : [...config().disabledRules, ruleId]
      updateConfig({ disabledRules: nextDisabledRules })
    },
    disableRule: (ruleId: string) => {
      if (config().disabledRules.includes(ruleId)) return
      updateConfig({ disabledRules: [...config().disabledRules, ruleId] })
    },
    enableAllRules: () => {
      updateConfig({ disabledRules: [] })
    },
    disableAllRules: () => {
      const allRuleIds = uiState.availableRules.map((rule) => rule.id)
      updateConfig({ disabledRules: allRuleIds })
    },
  }

  const handleExport = (format: 'json' | 'csv') => {
    // Keep export logic in runtime via event -> overlay? export is still a direct helper.
    // We keep this import local to avoid pulling export code into the runtime module.

    if (!audit) return
    void import('../export').then((m) =>
      m.exportAuditResults(audit, { format }),
    )
  }

  const handleIssueClick = (issueId: string) => {
    if (uiState.selectedIssueId === issueId) {
      setUiState('selectedIssueId', null)
      clearHighlights()

      if (config().showOverlays && audit) {
        const issuesAboveThreshold = filteredIssues()
        if (issuesAboveThreshold.length > 0) {
          a11yEventClient.emit('highlight-all', {
            issues: issuesAboveThreshold,
          })
        }
      }
      return
    }

    setUiState('selectedIssueId', issueId)
    clearHighlights()

    const issue = audit?.issues.find((i) => i.id === issueId)
    if (!issue || issue.nodes.length === 0) return

    let scrolled = false
    for (const node of issue.nodes) {
      const selector = node.selector
      if (!selector) continue

      try {
        const el = document.querySelector(selector)
        if (el) {
          if (!scrolled) {
            scrollToElement(selector)
            scrolled = true
          }

          highlightElement(selector, issue.impact, {
            showTooltip: true,
            ruleId: issue.ruleId,
          })
        }
      } catch (error) {
        console.warn('[A11y Panel] Invalid selector:', selector, error)
      }
    }

    // No need to emit the highlight event here since we're applying highlights directly.
  }

  createEffect(() => {
    if (!audit || !config().showOverlays) {
      a11yEventClient.emit('clear-highlights', {})
      return
    }

    if (uiState.selectedIssueId) {
      return
    }

    const severity = uiState.selectedSeverity
    const issuesAboveThreshold = filteredIssues()

    const issues =
      severity === 'all'
        ? issuesAboveThreshold
        : issuesAboveThreshold.filter((issue) => issue.impact === severity)

    if (issues.length === 0) {
      a11yEventClient.emit('clear-highlights', {})
      return
    }

    a11yEventClient.emit('highlight-all', { issues })
  })

  const filteredRules = createMemo(() => {
    const cat = uiState.selectedCategory
    const query = uiState.ruleSearchQuery.toLowerCase()
    return uiState.availableRules.filter((rule) => {
      if (cat !== 'all' && !rule.tags.includes(cat)) {
        return false
      }

      if (!query) return true
      return (
        rule.id.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query)
      )
    })
  })

  return (
    <ThemeContextProvider theme={theme()}>
      <MainPanel class={styles().root} withPadding={false}>
        <Header class={styles().header}>
          <div class={styles().headerTitleRow}>
            <h2 class={styles().headerTitle}>Accessibility Audit</h2>
            <Show when={filteredIssues()}>
              <span class={styles().headerSub}>
                {audit?.issues.length} issue
                {audit?.issues.length !== 1 ? 's' : ''}
              </span>
            </Show>
          </div>

          <div class={styles().headerActions}>
            <Button
              variant="primary"
              onClick={actions.scan}
              disabled={uiState.isScanning}
            >
              {uiState.isScanning ? 'Scanning...' : 'Run Audit'}
            </Button>

            <Show when={state === 'done' && audit && audit.issues.length > 0}>
              <div class={styles().buttonRow}>
                <Button
                  variant="secondary"
                  outline
                  onClick={() => handleExport('json')}
                >
                  Export JSON
                </Button>
                <Button
                  variant="secondary"
                  outline
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
              </div>

              <Button
                variant={config().showOverlays ? 'success' : 'secondary'}
                outline={!config().showOverlays}
                onClick={() =>
                  setShowOverlay((prev) => {
                    prev
                      ? clearHighlights()
                      : highlightAllIssues(filteredIssues())

                    return !prev
                  })
                }
              >
                {showOverlay() ? 'Hide' : 'Show'} Overlays
              </Button>
            </Show>
          </div>
        </Header>

        <div class={styles().statusBar}>
          <span>
            {SEVERITY_LABELS[config().threshold]}+ |{' '}
            {RULE_SET_LABELS[config().ruleSet]}
            <Show when={config().disabledRules.length > 0}>
              {` | ${config().disabledRules.length} rule(s) disabled`}
            </Show>
          </span>
          <div class={styles().statusSpacer} />
          <Button variant="secondary" outline onClick={actions.openSettings}>
            Settings
          </Button>
        </div>

        <div class={styles().content}>
          <Switch>
            <Match when={state !== 'init'}>
              <div class={styles().emptyState}>
                <p class={styles().emptyPrimary}>No audit results yet</p>
                <p class={styles().emptySecondary}>
                  Click "Run Audit" to scan for accessibility issues
                </p>
              </div>
            </Match>

            <Match
              when={state === 'done' && audit && audit.issues.length === 0}
            >
              <div class={styles().successState}>
                <p class={styles().successTitle}>
                  No accessibility issues found!
                </p>
                <p class={styles().successSub}>
                  Scanned in {audit!.duration.toFixed(0)}ms
                </p>
              </div>
            </Match>

            <Match when={filteredIssues().length > 0}>
              <A11yIssueList
                selectedIssueId={uiState.selectedIssueId}
                onIssueClick={handleIssueClick}
                onDisableRule={actions.disableRule}
              />
            </Match>
          </Switch>
        </div>

        <Show when={uiState.showSettings}>
          <A11ySettingsOverlay
            config={config()}
            availableRules={uiState.availableRules}
            filteredRules={filteredRules()}
            ruleSearchQuery={uiState.ruleSearchQuery}
            selectedCategory={uiState.selectedCategory}
            onClose={actions.closeSettings}
            onThresholdChange={(threshold) => updateConfig({ threshold })}
            onRuleSetChange={(ruleSet) => updateConfig({ ruleSet })}
            onSelectCategory={(category) =>
              setUiState('selectedCategory', category)
            }
            onSearchQueryChange={(value) =>
              setUiState('ruleSearchQuery', value)
            }
            onToggleRule={actions.toggleRule}
            onEnableAllRules={actions.enableAllRules}
            onDisableAllRules={actions.disableAllRules}
          />
        </Show>
      </MainPanel>
    </ThemeContextProvider>
  )
}
