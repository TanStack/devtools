import { afterEach, describe, expect, test, vi } from 'vitest'
import { generateConsolePipeCode } from './virtual-console'

const TEST_VITE_URL = 'http://localhost:5173'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete (window as any).__TSD_CONSOLE_PIPE_INITIALIZED__
})

function setupWarnConsolePipe() {
  const originalWarn = console.warn
  const originalWarnMock = vi.fn()
  const fetchMock = vi.fn().mockResolvedValue(undefined)
  const eventSourceUrls: Array<string> = []

  class MockEventSource {
    onmessage: ((event: MessageEvent) => void) | null = null
    onerror: (() => void) | null = null

    constructor(url: string) {
      eventSourceUrls.push(url)
    }
  }

  console.warn = originalWarnMock
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('EventSource', MockEventSource)

  const code = generateConsolePipeCode(['warn'], TEST_VITE_URL)
  new Function(code)()

  return {
    eventSourceUrls,
    fetchMock,
    originalWarnMock,
    restore: () => {
      console.warn = originalWarn
    },
  }
}

function getFirstFetchBody(fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = fetchMock.mock.calls[0]!
  return JSON.parse(init.body)
}

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

  test('serializes DOM elements before sending logs', async () => {
    vi.useFakeTimers()

    const { eventSourceUrls, fetchMock, originalWarnMock, restore } =
      setupWarnConsolePipe()

    try {
      const button = document.createElement('button')
      button.id = 'save'
      button.className = 'primary'
      button.type = 'button'
      button.setAttribute('data-testid', 'save-button')

      console.warn('gesture warning', button)

      await vi.advanceTimersByTimeAsync(100)

      expect(originalWarnMock).toHaveBeenCalledWith('gesture warning', button)
      expect(eventSourceUrls).toEqual(['/__tsd/console-pipe/sse'])
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const body = getFirstFetchBody(fetchMock)

      expect(body.entries[0]).toMatchObject({
        level: 'warn',
        source: 'client',
        args: [
          'gesture warning',
          '<button id="save" class="primary" type="button" data-testid="save-button">',
        ],
      })
    } finally {
      restore()
    }
  })

  test('serializes circular refs and Error objects before sending logs', async () => {
    vi.useFakeTimers()

    const { fetchMock, originalWarnMock, restore } = setupWarnConsolePipe()

    try {
      const circular: Record<string, unknown> = { name: 'root' }
      circular.self = circular
      const error = new Error('boom')

      console.warn('complex warning', circular, error)

      await vi.advanceTimersByTimeAsync(100)

      expect(originalWarnMock).toHaveBeenCalledWith(
        'complex warning',
        circular,
        error,
      )
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const body = getFirstFetchBody(fetchMock)

      expect(body.entries[0].args[1]).toEqual({
        name: 'root',
        self: '[Circular]',
      })
      expect(body.entries[0].args[2]).toMatchObject({
        name: 'Error',
        message: 'boom',
      })
      expect(typeof body.entries[0].args[2].stack).toBe('string')
    } finally {
      restore()
    }
  })

  test('limits large console payloads before sending logs', async () => {
    vi.useFakeTimers()

    const { fetchMock, restore } = setupWarnConsolePipe()

    try {
      const longArray = Array.from({ length: 101 }, (_, index) => index)
      const manyKeys: Record<string, number> = {}
      for (let index = 0; index < 101; index++) {
        manyKeys['key' + index] = index
      }
      const longString = 'x'.repeat(10001)
      const typedArray = new Uint8Array(1024)
      const deepObject = {
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: 'too deep',
                  },
                },
              },
            },
          },
        },
      }

      console.warn(
        'large payload',
        longArray,
        manyKeys,
        longString,
        typedArray,
        deepObject,
      )

      await vi.advanceTimersByTimeAsync(100)

      const body = getFirstFetchBody(fetchMock)

      expect(body.entries[0].args[1]).toHaveLength(101)
      expect(body.entries[0].args[1][100]).toBe('... (1 more)')
      expect(Object.keys(body.entries[0].args[2])).toHaveLength(101)
      expect(body.entries[0].args[2]['...']).toBe('(1 more keys)')
      expect(body.entries[0].args[3].startsWith('x'.repeat(10000))).toBe(true)
      expect(body.entries[0].args[3]).toContain('... (1 more chars)')
      expect(body.entries[0].args[4]).toBe('[Uint8Array(1024)]')
      expect(body.entries[0].args[5].a.b.c.d.e.f).toBe('[MaxDepth]')
    } finally {
      restore()
    }
  })
})
