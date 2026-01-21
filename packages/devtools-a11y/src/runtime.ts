import { a11yEventClient } from './event-client'
import { mergeConfig, saveConfig } from './config'
import { filterByThreshold, runAudit } from './scanner'
import {
  clearHighlights,
  highlightAllIssues,
  initOverlayAdapter,
} from './overlay'
import type { A11yAuditResult, A11yPluginOptions } from './types'

interface A11yRuntime {
  getConfig: () => Required<A11yPluginOptions>
  getResults: () => A11yAuditResult | null
  scan: () => Promise<A11yAuditResult>
  setConfig: (
    patch: Partial<A11yPluginOptions>,
    opts?: { persist?: boolean; emit?: boolean },
  ) => void
  destroy: () => void
}

let runtimeSingleton: A11yRuntime | null = null

function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function createRuntime(initOpts: A11yPluginOptions = {}): A11yRuntime {
  let config = mergeConfig(initOpts)
  let results: A11yAuditResult | null = null

  let overlayCleanup: (() => void) | null = null

  const ensureOverlayAdapter = () => {
    if (!hasDom()) return
    if (overlayCleanup) return
    overlayCleanup = initOverlayAdapter()
  }

  const updateHighlightsFromResults = (next: A11yAuditResult | null) => {
    if (!hasDom()) return

    if (!config.showOverlays) {
      clearHighlights()
      return
    }

    if (!next) {
      clearHighlights()
      return
    }

    const issuesAboveThreshold = filterByThreshold(
      next.issues,
      config.threshold,
    ).filter((issue) => !config.disabledRules.includes(issue.ruleId))

    clearHighlights()
    if (issuesAboveThreshold.length > 0) {
      highlightAllIssues(issuesAboveThreshold)
    }
  }

  const setResults = (next: A11yAuditResult) => {
    results = next
    a11yEventClient.emit('results', next)
    updateHighlightsFromResults(next)
  }

  const setConfig: A11yRuntime['setConfig'] = (
    patch,
    { persist = true, emit = true } = {},
  ) => {
    // Only persist the delta to avoid stomping on external changes.
    if (persist && config.persistSettings !== false) {
      saveConfig(patch)
    }

    // Update local config and normalize fields.
    config = {
      ...config,
      ...patch,
      disabledRules: patch.disabledRules ?? config.disabledRules,
    }

    if (emit) {
      a11yEventClient.emit('config-change', patch)
    }

    // Update overlays immediately when relevant config changes.
    if (
      patch.showOverlays !== undefined ||
      patch.threshold !== undefined ||
      patch.disabledRules !== undefined
    ) {
      updateHighlightsFromResults(results)
    }
  }

  const scan = async () => {
    if (!hasDom()) {
      throw new Error('A11y runtime requires a DOM to scan')
    }

    ensureOverlayAdapter()
    a11yEventClient.emit('scan-start', { context: 'document' })

    try {
      const next = await runAudit({
        threshold: config.threshold,
        ruleSet: config.ruleSet,
        disabledRules: config.disabledRules,
      })
      setResults(next)
      a11yEventClient.emit('scan-complete', {
        duration: next.duration,
        issueCount: next.issues.length,
      })
      return next
    } catch (error) {
      a11yEventClient.emit('scan-error', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  return {
    getConfig: () => config,
    getResults: () => results,
    scan,
    setConfig,
    destroy: () => {
      if (overlayCleanup) {
        overlayCleanup()
        overlayCleanup = null
      }
      clearHighlights()
      results = null
    },
  }
}

/**
 * Singleton runtime shared between the plugin entry and any framework wrappers.
 */
export function getA11yRuntime(initOpts: A11yPluginOptions = {}): A11yRuntime {
  if (!runtimeSingleton) {
    runtimeSingleton = createRuntime(initOpts)
  } else if (Object.keys(initOpts).length > 0) {
    // Merge in any explicit init overrides (without re-persisting).
    runtimeSingleton.setConfig(initOpts, { persist: false, emit: false })
  }
  return runtimeSingleton
}
