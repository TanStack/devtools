import { createContext, createMemo, createSignal, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'

import { runAudit } from '../scanner/audit'
import { DEFAULT_CONFIG } from '../config'

import type {
  A11yAuditResult,
  A11yPluginOptions,
  SeverityThreshold,
} from '../types'
import type { ParentComponent } from 'solid-js'

type UseAllyValueProps = {
  options?: A11yPluginOptions
}

function useAllyValue(props: UseAllyValueProps) {
  const [config, setConfig] = createStore<A11yPluginOptions>({
    ...DEFAULT_CONFIG,
    ...(props.options ?? {}),
  })

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

  return {
    impactKey,
    setImpactKey,

    filteredIssues,

    triggerAllyScan,

    setConfig,

    audit: allyResult.audit,
    state: allyResult.state,
  }
}

type ContextType = ReturnType<typeof useAllyValue>

const AllyContext = createContext<ContextType | null>(null)

type AllyProviderProps = { options?: A11yPluginOptions }

export const AllyProvider: ParentComponent<AllyProviderProps> = (props) => {
  const value = useAllyValue({ options: props.options })

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
