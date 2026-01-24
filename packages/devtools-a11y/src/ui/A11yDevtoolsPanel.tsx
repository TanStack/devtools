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
import { a11yEventClient } from '../event-client'
import { getAvailableRules, groupIssuesByImpact } from '../scanner'
import { clearHighlights, highlightElement } from '../overlay'
import { getA11yRuntime } from '../runtime'
import {
  RULE_SET_LABELS,
  SEVERITY_LABELS,
  createA11yPanelStyles,
} from './styles'
import { A11yIssueList } from './A11yIssueList'
import { A11ySettingsOverlay } from './A11ySettingsOverlay'
import { filterIssuesAboveThreshold } from './panelUtils'
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
  const theme = () => props.theme ?? 'light'
  const styles = createMemo(() => createA11yPanelStyles(theme()))

  const runtime = getA11yRuntime(props.options ?? {})

  const [config, setConfig] = createSignal(runtime.getConfig())
  const [results, setResults] = createSignal<A11yAuditResult | null>(
    runtime.getResults(),
  )

  const [uiState, setUiState] = createStore({
    isScanning: false,
    selectedIssueId: null as string | null,
    selectedSeverity: 'all' as 'all' | SeverityThreshold,
    showSettings: false,
    toast: null as null | {
      message: string
      color: string
      timestamp: number
    },
    availableRules: [] as Array<RuleInfo>,
    ruleSearchQuery: '',
    selectedCategory: 'all' as RuleCategory,
  })

  let toastTimeoutId: number | null = null

  // Keep runtime config in sync (including changes from programmatic API)
  onMount(() => {
    const cleanupResults = a11yEventClient.on('results', (event) => {
      setResults(event.payload)
    })

    const cleanupConfig = a11yEventClient.on('config-change', (event) => {
      const patch = event.payload
      setConfig((prev) => ({
        ...prev,
        ...patch,
        disabledRules: patch.disabledRules ?? prev.disabledRules,
      }))
    })

    onCleanup(() => {
      cleanupResults()
      cleanupConfig()
    })
  })

  // Auto-dismiss toast
  createEffect(() => {
    const t = uiState.toast
    if (!t) return

    if (toastTimeoutId != null) {
      window.clearTimeout(toastTimeoutId)
    }

    toastTimeoutId = window.setTimeout(() => {
      setUiState('toast', null)
      toastTimeoutId = null
    }, 3000)

    onCleanup(() => {
      if (toastTimeoutId != null) {
        window.clearTimeout(toastTimeoutId)
        toastTimeoutId = null
      }
    })
  })

  // Run on mount if configured
  onMount(() => {
    if (config().runOnMount) {
      void actions.scan()
    }
  })

  onCleanup(() => {
    if (toastTimeoutId != null) {
      window.clearTimeout(toastTimeoutId)
      toastTimeoutId = null
    }
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
    const r = results()
    if (!r) return
    void import('../export').then((m) => m.exportAuditResults(r, { format }))
  }

  const handleIssueClick = (issueId: string) => {
    const r = results()

    if (uiState.selectedIssueId === issueId) {
      setUiState('selectedIssueId', null)
      clearHighlights()

      if (config().showOverlays && r) {
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

    const issue = r?.issues.find((i) => i.id === issueId)
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

  const filteredIssues = createMemo(() => {
    const r = results()
    if (!r) return []

    return filterIssuesAboveThreshold(
      r.issues,
      config().threshold,
      config().disabledRules,
    )
  })

  const grouped = createMemo(() => groupIssuesByImpact(filteredIssues()))

  const visibleIssues = createMemo(() => {
    const issues = filteredIssues()
    const severity = uiState.selectedSeverity
    if (severity === 'all') return issues
    return issues.filter((issue) => issue.impact === severity)
  })

  const visibleGrouped = createMemo(() => groupIssuesByImpact(visibleIssues()))

  createEffect(() => {
    const r = results()
    if (!r || !config().showOverlays) {
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
    <div class={styles().root}>
      <Show when={uiState.toast}>
        {(t) => (
          <div class={styles().toast}>
            <span class={styles().toastDot(t().color)} />
            <span>{t().message}</span>
          </div>
        )}
      </Show>

      <div class={styles().header}>
        <div class={styles().headerTitleRow}>
          <h2 class={styles().headerTitle}>Accessibility Audit</h2>
          <Show when={results()}>
            <span class={styles().headerSub}>
              {filteredIssues().length} issue
              {filteredIssues().length !== 1 ? 's' : ''}
            </span>
          </Show>
        </div>

        <div class={styles().headerActions}>
          <button
            class={styles().primaryButton}
            classList={{
              [styles().primaryButtonDisabled]: uiState.isScanning,
            }}
            onClick={actions.scan}
            disabled={uiState.isScanning}
          >
            {uiState.isScanning ? 'Scanning...' : 'Run Audit'}
          </button>

          <Show when={results()}>
            <div class={styles().buttonRow}>
              <button
                class={styles().button}
                onClick={() => handleExport('json')}
              >
                Export JSON
              </button>
              <button
                class={styles().button}
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </button>
            </div>

            <button
              class={styles().toggleOverlay}
              classList={{
                [styles().toggleOverlayOn]: config().showOverlays,
              }}
              onClick={() =>
                updateConfig({ showOverlays: !config().showOverlays })
              }
            >
              {config().showOverlays ? 'Hide' : 'Show'} Overlays
            </button>
          </Show>
        </div>
      </div>

      <div class={styles().statusBar}>
        <span>
          {SEVERITY_LABELS[config().threshold]}+ |{' '}
          {RULE_SET_LABELS[config().ruleSet]}
          <Show when={config().disabledRules.length > 0}>
            ` | ${config().disabledRules.length} rule(s) disabled`
          </Show>
        </span>
        <div class={styles().statusSpacer} />
        <button class={styles().smallLinkButton} onClick={actions.openSettings}>
          Settings
        </button>
      </div>

      <div class={styles().content}>
        <Switch>
          <Match when={!results()}>
            <div class={styles().emptyState}>
              <p class={styles().emptyPrimary}>No audit results yet</p>
              <p class={styles().emptySecondary}>
                Click "Run Audit" to scan for accessibility issues
              </p>
            </div>
          </Match>

          <Match when={results() && results()!.issues.length === 0}>
            <div class={styles().successState}>
              <p class={styles().successTitle}>
                No accessibility issues found!
              </p>
              <p class={styles().successSub}>
                Scanned in {results()!.duration.toFixed(0)}ms
              </p>
            </div>
          </Match>

          <Match when={results() && filteredIssues().length > 0}>
            <A11yIssueList
              styles={styles()}
              grouped={grouped()}
              visibleGrouped={visibleGrouped()}
              selectedSeverity={uiState.selectedSeverity}
              selectedIssueId={uiState.selectedIssueId}
              onSelectSeverity={(severity) =>
                setUiState('selectedSeverity', severity)
              }
              onIssueClick={handleIssueClick}
              onDisableRule={actions.disableRule}
            />
          </Match>
        </Switch>
      </div>

      <Show when={uiState.showSettings}>
        <A11ySettingsOverlay
          styles={styles()}
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
          onSearchQueryChange={(value) => setUiState('ruleSearchQuery', value)}
          onToggleRule={actions.toggleRule}
          onEnableAllRules={actions.enableAllRules}
          onDisableAllRules={actions.disableAllRules}
        />
      </Show>
    </div>
  )
}
