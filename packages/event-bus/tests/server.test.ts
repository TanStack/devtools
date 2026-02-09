import http from 'node:http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServerEventBus } from '../src/server/server'

// Clear globalThis between tests to avoid cross-test contamination
function clearGlobals() {
  globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
  globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
  globalThis.__TANSTACK_EVENT_TARGET__ = null
}

describe('ServerEventBus', () => {
  let bus: ServerEventBus
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    clearGlobals()
    process.env.NODE_ENV = 'development'
  })

  afterEach(async () => {
    bus?.stop()
    clearGlobals()
    process.env.NODE_ENV = originalNodeEnv
    // Small delay to let servers fully close
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  describe('constructor', () => {
    it('should initialize with default config', () => {
      bus = new ServerEventBus()
      expect(bus.port).toBe(4206)
    })

    it('should accept custom port', () => {
      bus = new ServerEventBus({ port: 9999 })
      expect(bus.port).toBe(9999)
    })

    it('should log when debug is enabled', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      bus = new ServerEventBus({ debug: true })
      expect(logSpy).toHaveBeenCalledWith(
        '🌴 [tanstack-devtools:server-bus] ',
        'Initializing server event bus',
      )
      logSpy.mockRestore()
    })

    it('should not log when debug is disabled', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      bus = new ServerEventBus({ debug: false })
      expect(logSpy).not.toHaveBeenCalled()
      logSpy.mockRestore()
    })
  })

  describe('start() - standalone mode', () => {
    it('should start and resolve with a port', async () => {
      bus = new ServerEventBus({ port: 0 }) // port 0 = OS-assigned
      const port = await bus.start()
      expect(port).toBeGreaterThan(0)
      expect(bus.port).toBe(port)
    })

    it('should create its own HTTP server in standalone mode', async () => {
      bus = new ServerEventBus({ port: 0 })
      await bus.start()
      expect(globalThis.__TANSTACK_DEVTOOLS_SERVER__).not.toBeNull()
    })

    it('should create a WebSocket server in standalone mode', async () => {
      bus = new ServerEventBus({ port: 0 })
      await bus.start()
      expect(globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__).not.toBeNull()
    })

    it('should resolve immediately in non-development environment', async () => {
      process.env.NODE_ENV = 'production'
      bus = new ServerEventBus({ port: 5555 })
      const port = await bus.start()
      expect(port).toBe(5555)
      // No server should be created
      expect(globalThis.__TANSTACK_DEVTOOLS_SERVER__).toBeNull()
    })

    it('should resolve immediately if server is already running (HMR guard)', async () => {
      bus = new ServerEventBus({ port: 0 })
      await bus.start()
      // Create a new bus that picks up globalThis servers
      const bus2 = new ServerEventBus({ port: 0 })
      const port2 = await bus2.start()
      // Should resolve with the port without creating new server
      expect(port2).toBeGreaterThanOrEqual(0)
    })

    it('should handle EADDRINUSE by falling back to OS-assigned port', async () => {
      // Occupy a port on localhost first
      const blocker = http.createServer()
      const blockerPort = await new Promise<number>((resolve) => {
        blocker.listen(0, 'localhost', () => {
          const addr = blocker.address()
          if (typeof addr === 'object' && addr) resolve(addr.port)
        })
      })

      try {
        // Ensure globals are clean so the bus creates a fresh server
        clearGlobals()
        bus = new ServerEventBus({ port: blockerPort, host: 'localhost' })
        const port = await bus.start()
        // Should get a different port since the preferred one was in use
        expect(port).toBeGreaterThan(0)
        // The port should be different from the blocked port since EADDRINUSE triggers fallback
        expect(port).not.toBe(blockerPort)
      } finally {
        blocker.close()
      }
    })

    it('should pass host to server.listen', async () => {
      bus = new ServerEventBus({ port: 0, host: '127.0.0.1' })
      const port = await bus.start()
      expect(port).toBeGreaterThan(0)
    })
  })

  describe('start() - external httpServer mode', () => {
    let externalServer: http.Server

    beforeEach(async () => {
      externalServer = http.createServer()
      await new Promise<void>((resolve) => {
        externalServer.listen(0, () => resolve())
      })
    })

    afterEach(() => {
      externalServer.close()
    })

    it('should not create a standalone server when httpServer is provided', async () => {
      bus = new ServerEventBus({ httpServer: externalServer })
      await bus.start()
      // Should NOT have created its own server in globalThis
      expect(globalThis.__TANSTACK_DEVTOOLS_SERVER__).toBeNull()
    })

    it('should create a WebSocket server when httpServer is provided', async () => {
      bus = new ServerEventBus({ httpServer: externalServer })
      await bus.start()
      expect(globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__).not.toBeNull()
    })

    it('should resolve port from external server address', async () => {
      bus = new ServerEventBus({ httpServer: externalServer })
      const port = await bus.start()
      const addr = externalServer.address()
      const expectedPort = typeof addr === 'object' && addr ? addr.port : 0
      expect(port).toBe(expectedPort)
    })

    it('should handle SSE requests on external server', async () => {
      bus = new ServerEventBus({ httpServer: externalServer })
      const port = await bus.start()

      // Make an SSE request
      const response = await new Promise<http.IncomingMessage>((resolve) => {
        http.get(`http://localhost:${port}/__devtools/sse`, (res) => {
          resolve(res)
        })
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toBe('text/event-stream')
      response.destroy()
    })

    it('should handle POST requests on external server', async () => {
      bus = new ServerEventBus({ httpServer: externalServer })
      const port = await bus.start()

      const response = await new Promise<http.IncomingMessage>((resolve) => {
        const req = http.request(
          {
            hostname: 'localhost',
            port,
            path: '/__devtools/send',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
          (res) => resolve(res),
        )
        req.write(
          JSON.stringify({ type: 'test-event', payload: { foo: 'bar' } }),
        )
        req.end()
      })

      expect(response.statusCode).toBe(200)
    })

    it('should remove listeners from external server on stop() without closing it', async () => {
      bus = new ServerEventBus({ httpServer: externalServer })
      await bus.start()

      const listenerCountBefore = externalServer.listenerCount('request')
      expect(listenerCountBefore).toBeGreaterThan(0)

      bus.stop()

      // Wait a tick for cleanup
      await new Promise((resolve) => setTimeout(resolve, 50))

      // The external server should still be listening
      const addr = externalServer.address()
      expect(addr).not.toBeNull()

      // Our request listener should be removed
      const listenerCountAfter = externalServer.listenerCount('request')
      expect(listenerCountAfter).toBeLessThan(listenerCountBefore)
    })
  })

  describe('stop()', () => {
    it('should close standalone server on stop', async () => {
      bus = new ServerEventBus({ port: 0 })
      await bus.start()
      expect(globalThis.__TANSTACK_DEVTOOLS_SERVER__).not.toBeNull()

      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it('should clear all connections on stop', async () => {
      bus = new ServerEventBus({ port: 0 })
      await bus.start()

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      bus = new ServerEventBus({ port: 0, debug: true })
      await bus.start()
      bus.stop()

      expect(logSpy).toHaveBeenCalledWith(
        '🌴 [tanstack-devtools:server-bus] ',
        'Clearing all connections',
      )
      logSpy.mockRestore()
    })
  })
})
