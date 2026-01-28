import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { runAudit } from '../utils/ally-audit.utils'
import { mergeConfig, saveConfig } from '../utils/config.utils'
import { highlightAllIssues } from '../utils/ui.utils'

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
    const results = await runAudit(config)
    setAllyResult({ audit: results, state: 'done' })
  }

  const filteredIssues = createMemo(() => {
    if (allyResult.state !== 'done' || !allyResult.audit?.issues) return []
    if (impactKey() === 'all') return allyResult.audit.issues

    return allyResult.audit.issues.filter((val) => val.impact === impactKey())
  })

  createEffect(() => {
    if (config.showOverlays && allyResult.state === 'done')
      highlightAllIssues(filteredIssues())
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

    audit: allyResult.audit,
    state: allyResult.state,
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
