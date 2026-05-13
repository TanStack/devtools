import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { devtools } from '../src/plugin'
import type { Plugin } from 'vite'
import type * as Utils from '../src/utils'

let capturedOnConsolePipe: ((entries: Array<any>) => void) | undefined

vi.mock('../src/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof Utils>()
  return {
    ...actual,
    handleDevToolsViteRequest: vi.fn(
      (_req: any, _res: any, _next: any, handlers: any) => {
        if (typeof handlers === 'object' && handlers?.onConsolePipe) {
          capturedOnConsolePipe = handlers.onConsolePipe
        }
      },
    ),
  }
})

// Helper to find a plugin by name from the array returned by devtools()
function findPlugin(plugins: Array<Plugin>, name: string): Plugin | undefined {
  return plugins.find((p) => p.name === name)
}

// Helper to create a mock Vite server
function createMockServer(
  options: {
    https?: boolean | object
    host?: string | boolean
    port?: number
    httpServer?: any
  } = {},
) {
  return {
    config: {
      server: {
        https: options.https ?? false,
        host: options.host ?? 'localhost',
        port: options.port ?? 5173,
      },
      mode: 'development',
    },
    httpServer: options.httpServer ?? {
      on: vi.fn(),
      address: vi.fn().mockReturnValue({ port: 5173 }),
    },
    middlewares: {
      use: vi.fn(),
    },
  }
}

describe('devtools plugin', () => {
  describe('connection-injection plugin', () => {
    let connectionPlugin: Plugin

    beforeEach(() => {
      const plugins = devtools({
        eventBusConfig: { enabled: false }, // Disable server bus for unit test
      })
      const found = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )
      if (!found) {
        throw new Error('connection-injection plugin not found')
      }
      connectionPlugin = found
    })

    it('should exist in the plugins array', () => {
      const plugins = devtools()
      const plugin = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )
      expect(plugin).toBeDefined()
    })

    it('should only apply in development mode with serve command', () => {
      const apply = connectionPlugin.apply as (config: any, env: any) => boolean
      expect(apply({ mode: 'development' }, { command: 'serve' })).toBe(true)
      expect(apply({ mode: 'production' }, { command: 'serve' })).toBe(false)
      expect(apply({ mode: 'development' }, { command: 'build' })).toBe(false)
    })

    it('should replace __TANSTACK_DEVTOOLS_PORT__ in matching modules', () => {
      const transform = connectionPlugin.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const code = 'const port = __TANSTACK_DEVTOOLS_PORT__'
      const result = transform(
        code,
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toBeDefined()
      expect(result).not.toContain('__TANSTACK_DEVTOOLS_PORT__')
      // Default port when bus is not started
      expect(result).toContain('4206')
    })

    it('should replace __TANSTACK_DEVTOOLS_HOST__ in matching modules', () => {
      const transform = connectionPlugin.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const code = 'const host = __TANSTACK_DEVTOOLS_HOST__'
      const result = transform(
        code,
        'node_modules/@tanstack/devtools/dist/client.js',
      )
      expect(result).toBeDefined()
      expect(result).not.toContain('__TANSTACK_DEVTOOLS_HOST__')
      // Default host
      expect(result).toContain('"localhost"')
    })

    it('should replace __TANSTACK_DEVTOOLS_PROTOCOL__ in matching modules', () => {
      const transform = connectionPlugin.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const code = 'const protocol = __TANSTACK_DEVTOOLS_PROTOCOL__'
      const result = transform(
        code,
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toBeDefined()
      expect(result).not.toContain('__TANSTACK_DEVTOOLS_PROTOCOL__')
      // Default protocol
      expect(result).toContain('"http"')
    })

    it('should replace all three placeholders in the same code', () => {
      const transform = connectionPlugin.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const code = [
        'const port = __TANSTACK_DEVTOOLS_PORT__;',
        'const host = __TANSTACK_DEVTOOLS_HOST__;',
        'const protocol = __TANSTACK_DEVTOOLS_PROTOCOL__;',
      ].join('\n')
      const result = transform(
        code,
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toBeDefined()
      expect(result).toContain('4206')
      expect(result).toContain('"localhost"')
      expect(result).toContain('"http"')
    })

    it('should return undefined for code without any placeholders', () => {
      const transform = connectionPlugin.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const result = transform(
        'const x = 42',
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toBeUndefined()
    })

    it('should return undefined for non-tanstack module IDs', () => {
      const transform = connectionPlugin.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const result = transform(
        'const port = __TANSTACK_DEVTOOLS_PORT__',
        'node_modules/some-other-package/index.js',
      )
      expect(result).toBeUndefined()
    })
  })

  describe('configureServer - HTTPS detection', () => {
    it('should set protocol to https when server.https is truthy', async () => {
      const plugins = devtools({
        eventBusConfig: { enabled: true, port: 0 },
      })
      const customServerPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:custom-server',
      )
      const connectionPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )

      expect(customServerPlugin).toBeDefined()
      expect(connectionPlugin).toBeDefined()

      const mockHttpServer = {
        on: vi.fn(),
        address: vi.fn().mockReturnValue({ port: 5173 }),
        listenerCount: vi.fn().mockReturnValue(0),
      }

      const server = createMockServer({
        https: { key: 'fake-key', cert: 'fake-cert' },
        host: 'localhost',
        port: 5173,
        httpServer: mockHttpServer,
      })

      // Call configureServer to trigger HTTPS detection
      const configureServer = customServerPlugin!.configureServer as (
        server: any,
      ) => Promise<void>
      await configureServer(server)

      // Now test the transform to verify protocol was set to 'https'
      const transform = connectionPlugin!.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const result = transform(
        'const protocol = __TANSTACK_DEVTOOLS_PROTOCOL__',
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toContain('"https"')
    })

    it('should set protocol to http when server.https is falsy', async () => {
      const plugins = devtools({
        eventBusConfig: { enabled: true, port: 0 },
      })
      const customServerPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:custom-server',
      )
      const connectionPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )

      const server = createMockServer({
        https: false,
        port: 5173,
      })

      const configureServer = customServerPlugin!.configureServer as (
        server: any,
      ) => Promise<void>
      await configureServer(server)

      const transform = connectionPlugin!.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const result = transform(
        'const protocol = __TANSTACK_DEVTOOLS_PROTOCOL__',
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toContain('"http"')
    })

    it('should use server host config for host placeholder', async () => {
      const plugins = devtools({
        eventBusConfig: { enabled: true, port: 0 },
      })
      const customServerPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:custom-server',
      )
      const connectionPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )

      const server = createMockServer({
        host: 'my-custom-host.local',
        port: 5173,
      })

      const configureServer = customServerPlugin!.configureServer as (
        server: any,
      ) => Promise<void>
      await configureServer(server)

      const transform = connectionPlugin!.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const result = transform(
        'const host = __TANSTACK_DEVTOOLS_HOST__',
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toContain('"my-custom-host.local"')
    })

    it('should default host to localhost when server.host is boolean true', async () => {
      const plugins = devtools({
        eventBusConfig: { enabled: true, port: 0 },
      })
      const customServerPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:custom-server',
      )
      const connectionPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )

      const server = createMockServer({
        host: true, // Vite uses `true` to mean "expose on all interfaces"
        port: 5173,
      })

      const configureServer = customServerPlugin!.configureServer as (
        server: any,
      ) => Promise<void>
      await configureServer(server)

      const transform = connectionPlugin!.transform as (
        code: string,
        id: string,
      ) => string | undefined
      const result = transform(
        'const host = __TANSTACK_DEVTOOLS_HOST__',
        'node_modules/@tanstack/event-bus/dist/client.js',
      )
      expect(result).toContain('"localhost"')
    })
  })

  describe('configureServer - onConsolePipe uses pre-wrap console methods', () => {
    let originalLog: typeof console.log
    let beforeWrapSpy: ReturnType<typeof vi.fn>
    let afterWrapSpy: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      capturedOnConsolePipe = undefined
      originalLog = console.log
      beforeWrapSpy = vi.fn()
      afterWrapSpy = vi.fn()

      console.log = beforeWrapSpy

      const plugins = devtools({ eventBusConfig: { enabled: false } })
      const customServerPlugin = findPlugin(
        plugins,
        '@tanstack/devtools:custom-server',
      )!

      const server = {
        ...createMockServer(),
        middlewares: {
          use: vi.fn((handler: any) => {
            handler({ url: '/not-a-tsd-route', socket: {} }, {}, vi.fn())
          }),
        },
      }

      const configureServer = customServerPlugin.configureServer as (
        server: any,
      ) => Promise<void>
      await configureServer(server)

      console.log = afterWrapSpy
    })

    afterEach(() => {
      console.log = originalLog
      capturedOnConsolePipe = undefined
    })

    it('uses the captured original method directly for a known level', () => {
      expect(capturedOnConsolePipe).toBeDefined()
      beforeWrapSpy.mockClear()
      afterWrapSpy.mockClear()

      capturedOnConsolePipe!([
        { level: 'log', args: ['test message'], timestamp: Date.now() },
      ])

      expect(beforeWrapSpy).toHaveBeenCalledTimes(1)
      expect(afterWrapSpy).not.toHaveBeenCalled()
    })
    it('falls back to captured originalConsole.log for an unknown level, not the live console.log', () => {
      expect(capturedOnConsolePipe).toBeDefined()
      beforeWrapSpy.mockClear()
      afterWrapSpy.mockClear()

      // 'trace' is not in consolePipingLevels so originalConsole['trace'] is
      // undefined and the fallback branch is taken.
      capturedOnConsolePipe!([
        { level: 'trace', args: ['test message'], timestamp: Date.now() },
      ])

      expect(beforeWrapSpy).toHaveBeenCalledTimes(1)
      expect(afterWrapSpy).not.toHaveBeenCalled()
    })
  })

  describe('plugin array', () => {
    it('should return an array of plugins', () => {
      const plugins = devtools()
      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBeGreaterThan(0)
    })

    it('should not contain old port-injection plugin name', () => {
      const plugins = devtools()
      const oldPlugin = findPlugin(plugins, '@tanstack/devtools:port-injection')
      expect(oldPlugin).toBeUndefined()
    })

    it('should contain connection-injection plugin', () => {
      const plugins = devtools()
      const plugin = findPlugin(
        plugins,
        '@tanstack/devtools:connection-injection',
      )
      expect(plugin).toBeDefined()
    })

    it('runs better-console-logs before console-pipe-transform', () => {
      // Both plugins are enforce: 'pre' and run in array order. console-pipe
      // prepends a multi-line IIFE to root entry files; if better-console-logs
      // ran after, its AST line numbers would be shifted past the end of the
      // user's file and "Go to Source" links would miss the actual source.
      const plugins = devtools()
      const names = plugins.map((p) => p.name)
      const betterLogsIdx = names.indexOf(
        '@tanstack/devtools:better-console-logs',
      )
      const pipeIdx = names.indexOf('@tanstack/devtools:console-pipe-transform')
      expect(betterLogsIdx).toBeGreaterThanOrEqual(0)
      expect(pipeIdx).toBeGreaterThanOrEqual(0)
      expect(betterLogsIdx).toBeLessThan(pipeIdx)
    })
  })
})
