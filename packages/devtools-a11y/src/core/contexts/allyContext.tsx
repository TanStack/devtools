import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from 'solid-js'
import { createStore } from 'solid-js/store'
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

function useAllyValue() {
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
    setAllyResult({ audit: await runAudit(config), state: 'done' })
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

  createEffect(() => {
    if (config.showOverlays === false) {
      clearHighlights()
      return
    }

    if (allyResult.state === 'done') highlightAllIssues(filteredIssues())
  })

  createEffect(() => {
    saveConfig(config)
  })

  return {
    impactKey,
    setImpactKey,

    filteredIssues,

    triggerAllyScan,

    setConfig,
    config,

    allyResult,
  }
}

type ContextType = ReturnType<typeof useAllyValue>

//
// context
//

const AllyContext = createContext<ContextType | null>(null)

type AllyProviderProps = {}

export const AllyProvider: ParentComponent<AllyProviderProps> = (props) => {
  const value = useAllyValue()

  return (
    <AllyContext.Provider value={value}>{props.children}</AllyContext.Provider>
  )
}

export function useAllyContext() {
  const context = useContext(AllyContext)

  if (context === null) {
    throw new Error('useAllyContext must be used within an AllyProvider')
  }

  return context
}
