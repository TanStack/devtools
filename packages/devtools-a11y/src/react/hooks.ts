import { useCallback, useEffect, useRef, useState } from 'react'
import { a11yEventClient } from '../event-client'
import { getLiveMonitor, runAudit } from '../scanner'
import { clearHighlights, highlightAllIssues, initOverlayAdapter, } from '../overlay'
import type { A11yAuditOptions, A11yAuditResult, A11yPluginOptions, } from '../types'

/**
 * Hook to run accessibility audits on a component
 */
export function useA11yAudit(options: A11yAuditOptions = {}) {
  const [results, setResults] = useState<A11yAuditResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(
    async (scanOptions?: Partial<A11yAuditOptions>) => {
      setIsScanning(true)
      setError(null)

      try {
        const result = await runAudit({ ...options, ...scanOptions })
        setResults(result)
        a11yEventClient.emit('results', result)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        a11yEventClient.emit('scan-error', { error: errorMessage })
        return null
      } finally {
        setIsScanning(false)
      }
    },
    [options],
  )

  return {
    results,
    isScanning,
    error,
    scan,
  }
}

/**
 * Hook to audit a specific element ref
 */
export function useA11yRef<T extends HTMLElement>(
  options: A11yAuditOptions = {},
) {
  const ref = useRef<T>(null)
  const [results, setResults] = useState<A11yAuditResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const scan = useCallback(async () => {
    if (!ref.current) {
      console.warn('[useA11yRef] No element ref available')
      return null
    }

    setIsScanning(true)

    try {
      const result = await runAudit({
        ...options,
        context: ref.current,
      })
      setResults(result)
      return result
    } catch (err) {
      console.error('[useA11yRef] Scan failed:', err)
      return null
    } finally {
      setIsScanning(false)
    }
  }, [options])

  return {
    ref,
    results,
    isScanning,
    scan,
  }
}

/**
 * Hook to initialize the overlay adapter
 */
export function useA11yOverlay() {
  useEffect(() => {
    return initOverlayAdapter()
  }, [])

  return {
    highlight: (
      selector: string,
      impact: 'critical' | 'serious' | 'moderate' | 'minor',
    ) => {
      a11yEventClient.emit('highlight', { selector, impact })
    },
    highlightAll: highlightAllIssues,
    clear: clearHighlights,
  }
}

/**
 * Hook for live monitoring
 */
export function useA11yLiveMonitor(
  options: A11yPluginOptions & { enabled?: boolean } = {},
) {
  const { enabled = false, ...monitorOptions } = options
  const [results, setResults] = useState<A11yAuditResult | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const monitor = getLiveMonitor({
      debounceMs: monitorOptions.liveMonitoringDelay,
      auditOptions: {
        threshold: monitorOptions.threshold,
        ruleSet: monitorOptions.ruleSet,
      },
      onAuditComplete: (result) => {
        setResults(result)
      },
    })

    monitor.start()
    setIsActive(true)

    return () => {
      monitor.stop()
      setIsActive(false)
    }
  }, [
    enabled,
    monitorOptions.liveMonitoringDelay,
    monitorOptions.threshold,
    monitorOptions.ruleSet,
  ])

  return {
    results,
    isActive,
  }
}

/**
 * Hook to subscribe to a11y events
 */
export function useA11yEvents() {
  const [lastResults, setLastResults] = useState<A11yAuditResult | null>(null)
  const [newIssues, setNewIssues] = useState<A11yAuditResult['issues']>([])
  const [resolvedIssues, setResolvedIssues] = useState<
    A11yAuditResult['issues']
  >([])

  useEffect(() => {
    const cleanupResults = a11yEventClient.on('results', (event) => {
      setLastResults(event.payload)
    })

    const cleanupNew = a11yEventClient.on('new-issues', (event) => {
      setNewIssues(event.payload.issues)
    })

    const cleanupResolved = a11yEventClient.on('resolved-issues', (event) => {
      setResolvedIssues(event.payload.issues)
    })

    return () => {
      cleanupResults()
      cleanupNew()
      cleanupResolved()
    }
  }, [])

  return {
    lastResults,
    newIssues,
    resolvedIssues,
  }
}
