import { diffAuditResults, filterByThreshold, runAudit } from './scanner'
import type {
  A11yAuditOptions,
  A11yAuditResult,
  A11yIssue,
  SeverityThreshold,
} from './types'

export interface LiveMonitoringOptions {
  delay: number
  threshold: SeverityThreshold
  disabledRules: Array<string>
  context?: A11yAuditOptions['context']
}

export interface LiveMonitoringCallbacks {
  onResults: (result: A11yAuditResult) => void
  onDiff?: (diff: {
    newIssues: Array<A11yIssue>
    resolvedIssues: Array<A11yIssue>
  }) => void
}

export function createLiveMonitoringController(
  opts: LiveMonitoringOptions,
  cb: LiveMonitoringCallbacks,
): {
  start: () => void
  stop: () => void
  isRunning: () => boolean
} {
  let observer: MutationObserver | null = null
  let timeoutId: number | null = null
  let running = false
  let inFlight = false
  let previous: A11yAuditResult | null = null

  let unsubscribeVisibility: (() => void) | null = null

  const schedule = () => {
    if (!running) return

    if (timeoutId != null) {
      window.clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(async () => {
      timeoutId = null

      if (!running) return
      if (inFlight) return

      inFlight = true

      try {
        const result = await runAudit({
          context: opts.context ?? document,
          threshold: opts.threshold,
          disabledRules: opts.disabledRules,
        })

        cb.onResults(result)

        const filteredPrev =
          previous == null
            ? null
            : {
                ...previous,
                issues: filterByThreshold(
                  previous.issues,
                  opts.threshold,
                ).filter((issue) => !opts.disabledRules.includes(issue.ruleId)),
              }

        const filteredCurrent: A11yAuditResult = {
          ...result,
          issues: filterByThreshold(result.issues, opts.threshold).filter(
            (issue) => !opts.disabledRules.includes(issue.ruleId),
          ),
        }

        if (cb.onDiff) {
          cb.onDiff(diffAuditResults(filteredPrev, filteredCurrent))
        }

        previous = result
      } finally {
        inFlight = false
      }
    }, opts.delay)
  }

  const start = () => {
    if (running || typeof MutationObserver === 'undefined') return
    running = true

    const contextNode = (() => {
      const ctx = opts.context
      if (!ctx || ctx === document) return document.documentElement
      if (typeof ctx === 'string') return document.querySelector(ctx)
      if (ctx instanceof Element) return ctx
      if (ctx instanceof Document) return ctx.documentElement
      return document.documentElement
    })()

    const target = contextNode ?? document.documentElement

    observer = new MutationObserver(() => {
      if (document.hidden) return
      schedule()
    })

    observer.observe(target, {
      subtree: true,
      childList: true,
      attributes: true,
    })

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (timeoutId != null) {
          window.clearTimeout(timeoutId)
          timeoutId = null
        }
        return
      }
      schedule()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    unsubscribeVisibility = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }

    schedule()
  }

  const stop = () => {
    running = false

    if (timeoutId != null) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }

    if (observer) {
      observer.disconnect()
      observer = null
    }

    if (unsubscribeVisibility) {
      unsubscribeVisibility()
      unsubscribeVisibility = null
    }

    inFlight = false
  }

  return {
    start,
    stop,
    isRunning: () => running,
  }
}
