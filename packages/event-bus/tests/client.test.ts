import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientEventBus } from '../src/client/client'

// Stub BroadcastChannel since it's not available in test environment
vi.stubGlobal(
  'BroadcastChannel',
  class {
    postMessage = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    close = vi.fn()
    onmessage: any = null
  },
)

// Track WebSocket and EventSource constructor calls
const mockWebSocketInstances: Array<any> = []
const mockEventSourceInstances: Array<any> = []

function createMockWebSocketClass() {
  const cls = class MockWebSocket {
    static OPEN = 1
    static CLOSED = 3
    url: string
    readyState = 1
    onmessage: any = null
    onclose: any = null
    onerror: any = null
    send = vi.fn()
    close = vi.fn()
    constructor(url: string) {
      this.url = url
      mockWebSocketInstances.push(this)
    }
  }
  return cls
}

function createMockEventSourceClass() {
  return class MockEventSource {
    url: string
    onmessage: any = null
    close = vi.fn()
    constructor(url: string) {
      this.url = url
      mockEventSourceInstances.push(this)
    }
  }
}

function createThrowingWebSocketClass() {
  return class ThrowingWebSocket {
    static OPEN = 1
    static CLOSED = 3
    constructor() {
      throw new Error('WS not available')
    }
  }
}

describe('ClientEventBus', () => {
  beforeEach(() => {
    mockWebSocketInstances.length = 0
    mockEventSourceInstances.length = 0
    vi.stubGlobal('WebSocket', createMockWebSocketClass())
    vi.stubGlobal('EventSource', createMockEventSourceClass())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor defaults', () => {
    it('should initialize with default values', () => {
      const bus = new ClientEventBus()
      bus.start()
      // Default does not connect to server bus, so no WS/SSE created
      expect(mockWebSocketInstances.length).toBe(0)
      expect(mockEventSourceInstances.length).toBe(0)
      bus.stop()
    })
  })

  describe('connectWebSocket with protocol', () => {
    it('should use ws:// when protocol is http (default)', () => {
      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 4206,
        host: 'localhost',
        protocol: 'http',
      })
      bus.start()

      expect(mockWebSocketInstances.length).toBe(1)
      expect(mockWebSocketInstances[0].url).toBe(
        'ws://localhost:4206/__devtools/ws',
      )
      bus.stop()
    })

    it('should use wss:// when protocol is https', () => {
      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 4206,
        host: 'localhost',
        protocol: 'https',
      })
      bus.start()

      expect(mockWebSocketInstances.length).toBe(1)
      expect(mockWebSocketInstances[0].url).toBe(
        'wss://localhost:4206/__devtools/ws',
      )
      bus.stop()
    })

    it('should use custom host in WebSocket URL', () => {
      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 9999,
        host: 'myhost.local',
        protocol: 'http',
      })
      bus.start()

      expect(mockWebSocketInstances[0].url).toBe(
        'ws://myhost.local:9999/__devtools/ws',
      )
      bus.stop()
    })

    it('should use custom host and https in WebSocket URL', () => {
      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 443,
        host: 'secure.example.com',
        protocol: 'https',
      })
      bus.start()

      expect(mockWebSocketInstances[0].url).toBe(
        'wss://secure.example.com:443/__devtools/ws',
      )
      bus.stop()
    })
  })

  describe('connectSSE with protocol', () => {
    it('should use http:// when protocol is http', () => {
      // Make WebSocket constructor throw to force SSE fallback
      vi.stubGlobal('WebSocket', createThrowingWebSocketClass())

      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 4206,
        host: 'localhost',
        protocol: 'http',
      })
      bus.start()

      expect(mockEventSourceInstances.length).toBe(1)
      expect(mockEventSourceInstances[0].url).toBe(
        'http://localhost:4206/__devtools/sse',
      )
      bus.stop()
    })

    it('should use https:// when protocol is https', () => {
      vi.stubGlobal('WebSocket', createThrowingWebSocketClass())

      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 4206,
        host: 'localhost',
        protocol: 'https',
      })
      bus.start()

      expect(mockEventSourceInstances.length).toBe(1)
      expect(mockEventSourceInstances[0].url).toBe(
        'https://localhost:4206/__devtools/sse',
      )
      bus.stop()
    })

    it('should use custom host in SSE URL', () => {
      vi.stubGlobal('WebSocket', createThrowingWebSocketClass())

      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 8080,
        host: 'dev.example.com',
        protocol: 'https',
      })
      bus.start()

      expect(mockEventSourceInstances[0].url).toBe(
        'https://dev.example.com:8080/__devtools/sse',
      )
      bus.stop()
    })
  })

  describe('emitToServer with protocol and host', () => {
    it('should use correct protocol and host in fetch URL when using SSE fallback', () => {
      // Make WebSocket constructor throw to force SSE fallback
      vi.stubGlobal('WebSocket', createThrowingWebSocketClass())

      const bus = new ClientEventBus({
        connectToServerBus: true,
        port: 9999,
        host: 'myhost',
        protocol: 'https',
      })
      bus.start()

      // Dispatch an event to trigger emitToServer
      window.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'test-event',
            payload: { foo: 'bar' },
          },
        }),
      )

      expect(fetch).toHaveBeenCalledWith(
        'https://myhost:9999/__devtools/send',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      bus.stop()
    })

    it('should use http://localhost by default in fetch URL', () => {
      vi.stubGlobal('WebSocket', createThrowingWebSocketClass())

      const bus = new ClientEventBus({
        connectToServerBus: true,
      })
      bus.start()

      window.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'test-event',
            payload: {},
          },
        }),
      )

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4206/__devtools/send',
        expect.objectContaining({
          method: 'POST',
        }),
      )
      bus.stop()
    })
  })

  describe('event dispatching', () => {
    it('should emit events to a subscribed listener', () => {
      const bus = new ClientEventBus()
      bus.start()
      const handler = vi.fn()
      window.addEventListener('test:event', handler)

      window.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'test:event',
            payload: { foo: 'bar' },
          },
        }),
      )
      expect(handler).toHaveBeenCalled()
      window.removeEventListener('test:event', handler)
      bus.stop()
    })

    it('should emit events to global listeners', () => {
      const bus = new ClientEventBus()
      bus.start()
      const handler = vi.fn()
      window.addEventListener('tanstack-devtools-global', handler)

      window.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'test:event',
            payload: { foo: 'bar' },
          },
        }),
      )
      expect(handler).toHaveBeenCalled()
      window.removeEventListener('tanstack-devtools-global', handler)
      bus.stop()
    })
  })

  describe('debug logging', () => {
    it('should log when debug is enabled', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const bus = new ClientEventBus({ debug: true })
      bus.start()

      expect(logSpy).toHaveBeenCalledWith(
        '🌴 [tanstack-devtools:client-bus]',
        'Initializing client event bus',
      )
      bus.stop()
    })

    it('should not log when debug is disabled', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const bus = new ClientEventBus({ debug: false })
      bus.start()

      expect(logSpy).not.toHaveBeenCalled()
      bus.stop()
    })
  })

  describe('stop()', () => {
    it('should clean up event listeners on stop', () => {
      const bus = new ClientEventBus()
      bus.start()

      const handler = vi.fn()
      window.addEventListener('test:cleanup', handler)

      bus.stop()

      // After stop, dispatching should not trigger the bus dispatcher
      // (but the direct listener on window still works)
      window.removeEventListener('test:cleanup', handler)
    })

    it('should close WebSocket on stop', () => {
      const bus = new ClientEventBus({ connectToServerBus: true })
      bus.start()

      expect(mockWebSocketInstances.length).toBe(1)
      bus.stop()

      expect(mockWebSocketInstances[0].close).toHaveBeenCalled()
    })

    it('should close EventSource on stop', () => {
      vi.stubGlobal('WebSocket', createThrowingWebSocketClass())

      const bus = new ClientEventBus({ connectToServerBus: true })
      bus.start()

      expect(mockEventSourceInstances.length).toBe(1)
      bus.stop()

      expect(mockEventSourceInstances[0].close).toHaveBeenCalled()
    })
  })
})
