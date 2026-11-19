/** @jsxImportSource @solidjs/web */

import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createStore,
  deep,
  useContext as getContext,
  snapshot,
} from 'solid-js'
import { createTheme } from '@tanstack/devtools-ui'
import { filterIssuesAboveThreshold, runAudit } from '../utils/ally-audit.utils'
import { mergeConfig, saveConfig } from '../utils/config.utils'
import { clearHighlights, highlightAllIssues } from '../utils/ui.utils'

// types
import type {
  A11yAuditResult,
  A11yPluginOptions,
  SeverityThreshold,
} from '../types/types'
import type { ParentComponent } from 'solid-js'

//
// context state
//

function createAllyValue() {
  const { theme } = createTheme()
  const [config, setConfig] =
    createStore<Required<A11yPluginOptions>>(mergeConfig())

  const [allyResult, setAllyResult] = createStore<{
    audit?: A11yAuditResult
    state: 'init' | 'scanning' | 'done'
  }>({ state: 'init' })

  const [impactKey, setImpactKey] = createSignal<SeverityThreshold | 'all'>(
    'all',
  )

  const triggerAllyScan = async () => {
    setAllyResult((result) => {
      result.state = 'scanning'
    })
    const audit = await runAudit(config)
    setAllyResult((result) => {
      result.audit = audit
      result.state = 'done'
    })
  }

  const filteredIssues = createMemo(() => {
    if (allyResult.state !== 'done' || !allyResult.audit?.issues) return []
    let results = allyResult.audit.issues

    results = filterIssuesAboveThreshold(results, config.threshold)

    // removes excluded rules
    if (config.disabledRules.length > 0) {
      results = results.filter(
        (issue) => !config.disabledRules.includes(issue.ruleId),
      )
    }

    // early return if all impacts selected
    if (impactKey() === 'all') return results

    return results.filter((val) => val.impact === impactKey())
  })

  createEffect(
    () =>
      config.showOverlays === false
        ? null
        : allyResult.state === 'done'
          ? { issues: filteredIssues(), theme: theme() }
          : undefined,
    (overlay) => {
      if (overlay === null) clearHighlights()
      else if (overlay) highlightAllIssues(overlay.issues, overlay.theme)
    },
  )

  createEffect(() => snapshot(deep(config)), saveConfig)

  return {
    impactKey,
    setImpactKey,

    filteredIssues,

    triggerAllyScan,

    setConfig,
    config,

    allyResult,
    theme,
  }
}

type ContextType = ReturnType<typeof createAllyValue>

//
// context
//

const AllyContext = createContext<ContextType>()

type AllyProviderProps = {}

export const AllyProvider: ParentComponent<AllyProviderProps> = (props) => {
  const value = createAllyValue()

  return <AllyContext value={value}>{props.children}</AllyContext>
}

export function createAllyContext() {
  return getContext(AllyContext)
}
