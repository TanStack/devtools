import { Batcher } from '@tanstack/pacer/batcher'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import type { ConsoleLevel } from './plugin'

export interface ConsoleLogEntry {
  level: ConsoleLevel
  args: Array<unknown>
  source: string
  timestamp: number
}

// Store original console methods
const originalConsole: Record<ConsoleLevel, (...args: Array<unknown>) => void> =
  {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
  }

// Detect environment
const isServer = typeof window === 'undefined'

// Create batchers for console logs (one for client, one for server)
// They batch logs for ~100ms before emitting
const consoleBatcher = new Batcher<ConsoleLogEntry>(
  (entries) => {
    if (isServer) {
      devtoolsEventClient.emit('server-console', { entries })
    } else {
      devtoolsEventClient.emit('client-console', { entries })
    }
  },
  {
    wait: 100, // Batch logs every 100ms
    maxSize: 50, // Or when we hit 50 logs
  },
)

/**
 * Creates a wrapped console method that:
 * 1. Queues the log entry to the batcher for piping
 * 2. Calls the original console method
 */
function createWrappedMethod(level: ConsoleLevel) {
  return function wrappedConsole(source: string, ...args: Array<unknown>) {
    // Queue the log entry for batching
    const entry: ConsoleLogEntry = {
      level,
      args,
      source,
      timestamp: Date.now(),
    }
    consoleBatcher.addItem(entry)

    // Call the original console method
    originalConsole[level](...args)
  }
}

/**
 * Wrapped console object that pipes logs between client and server.
 * Each method accepts a source string as the first argument (injected by the transform),
 * followed by the original arguments.
 */
export const wrappedConsole = {
  log: createWrappedMethod('log'),
  warn: createWrappedMethod('warn'),
  error: createWrappedMethod('error'),
  info: createWrappedMethod('info'),
  debug: createWrappedMethod('debug'),
}

/**
 * Flush any pending batched logs immediately.
 * Useful for cleanup or ensuring logs are sent before page unload.
 */
export function flushConsoleLogs() {
  consoleBatcher.flush()
}
