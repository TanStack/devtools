import { describe, expect, test } from 'vitest'
import { generateConsolePipeCode } from './virtual-console'

describe('virtual-console', () => {
  test('generates inline code with specified levels', () => {
    const code = generateConsolePipeCode(['log', 'error'])

    expect(code).toContain('["log","error"]')
    expect(code).toContain('originalConsole')
    expect(code).toContain('__TSD_CONSOLE_PIPE_INITIALIZED__')
  })

  test('uses fetch to send client logs', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain("fetch('/__tsd/console-pipe'")
    expect(code).toContain("method: 'POST'")
  })

  test('uses SSE to receive server logs', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain("new EventSource('/__tsd/console-pipe/sse')")
  })

  test('includes client-only guard', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain("typeof window === 'undefined'")
  })

  test('includes batcher configuration', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain('BATCH_WAIT = 100')
    expect(code).toContain('BATCH_MAX_SIZE = 50')
  })

  test('includes flush functionality', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain('flushBatch')
  })

  test('includes beforeunload listener for browser', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain('beforeunload')
  })

  test('wraps code in IIFE', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).toContain('(function __tsdConsolePipe()')
    expect(code).toContain('})();')
  })

  test('has no external imports', () => {
    const code = generateConsolePipeCode(['log'])

    expect(code).not.toContain('import ')
  })
})
