import { describe, expect, test } from 'vitest'
import { generateConsolePipeCode } from './virtual-console'

const TEST_VITE_URL = 'http://localhost:5173'

describe('virtual-console', () => {
  test('generates inline code with specified levels', () => {
    const code = generateConsolePipeCode(['log', 'error'], TEST_VITE_URL)

    expect(code).toContain('["log","error"]')
    expect(code).toContain('originalConsole')
    expect(code).toContain('__TSD_CONSOLE_PIPE_INITIALIZED__')
  })

  test('uses fetch to send client logs', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain('/__tsd/console-pipe')
    expect(code).toContain("method: 'POST'")
  })

  test('uses SSE to receive server logs', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain("new EventSource('/__tsd/console-pipe/sse')")
  })

  test('includes environment detection', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain("typeof window === 'undefined'")
    expect(code).toContain('isServer')
  })

  test('includes batcher configuration', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain('BATCH_WAIT')
    expect(code).toContain('BATCH_MAX_SIZE')
  })

  test('includes flush functionality', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain('flushBatch')
  })

  test('includes beforeunload listener for browser', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain('beforeunload')
  })

  test('wraps code in IIFE', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain('(function __tsdConsolePipe()')
    expect(code).toContain('})();')
  })

  test('has no external imports', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).not.toContain('import ')
  })

  test('includes vite server URL for server piping', () => {
    const code = generateConsolePipeCode(['log'], TEST_VITE_URL)

    expect(code).toContain(TEST_VITE_URL)
    expect(code).toContain('/__tsd/console-pipe/server')
  })
})
