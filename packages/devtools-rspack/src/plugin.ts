import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import chalk from 'chalk'
import {
  DEFAULT_EDITOR_CONFIG,
  addPluginToDevtools,
  emitOutdatedDeps,
  getDevtoolsFileId,
  handleDevToolsRequest,
  handleOpenSource,
  injectPluginIntoFile,
  installPackage,
  readPackageJson,
  setDevServerOrigin,
  setDevtoolsConnection,
  stripEnhancedLogPrefix,
} from '@tanstack/devtools-bundler-core'
import type {
  ConsoleLevel,
  EditorConfig,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools-bundler-core'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PackageJson } from '@tanstack/devtools-client'

const require = createRequire(import.meta.url)
const DIRNAME = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_LEVELS: Array<ConsoleLevel> = [
  'log',
  'warn',
  'error',
  'info',
  'debug',
]
const PLUGIN = '@tanstack/devtools-rspack'
const DEFAULT_DEV_SERVER_PORT = 8080

/**
 * Resolves the emitted loader module. At runtime the plugin executes from
 * `dist/esm/plugin.js` and the loader ships as `dist/esm/loader.js`. During unit
 * tests it runs from `src/plugin.ts` and the sibling is `src/loader.ts`. Try the
 * candidates in order; fall back to the expected built path so the injected rule
 * still carries a `loader` string even before the package is built.
 */
function resolveLoaderPath(): string {
  const candidates = ['loader.js', 'loader.cjs', 'loader.mjs', 'loader.ts']
  for (const candidate of candidates) {
    try {
      return require.resolve(path.join(DIRNAME, candidate))
    } catch {
      // try next candidate
    }
  }
  return path.join(DIRNAME, 'loader.js')
}

export class TanStackDevtoolsRspackPlugin {
  private args: TanStackDevtoolsConfig
  constructor(args?: TanStackDevtoolsConfig) {
    this.args = args ?? {}
  }

  apply(compiler: any) {
    const args = this.args
    const isDev = compiler.options.mode === 'development'
    const logging = args.logging ?? true

    // 1. inject the loader for every js/ts/jsx/tsx module. Injected in BOTH modes:
    //    production still needs the remove-devtools transform.
    const loaderPath = resolveLoaderPath()
    compiler.options.module = compiler.options.module ?? { rules: [] }
    compiler.options.module.rules = compiler.options.module.rules ?? []
    compiler.options.module.rules.push({
      test: /\.[cm]?[jt]sx?$/,
      exclude: /node_modules/,
      enforce: 'pre',
      use: [{ loader: loaderPath, options: { config: args } }],
    })

    // Server features are dev-only.
    if (!isDev) return

    // Record the dev-server origin early so it is available even before the
    // first `setupMiddlewares` call. The `__tsd/*` endpoints are mounted on the
    // dev server, so enhanced-log / SSR-console-pipe URLs must target IT (not the
    // event bus). Refined with the real port once the dev server is known.
    setDevServerOrigin({
      port: compiler.options.devServer?.port ?? DEFAULT_DEV_SERVER_PORT,
      host: 'localhost',
      protocol: 'http',
    })

    const serverBusEnabled = args.eventBusConfig?.enabled ?? true
    const consolePipeEnabled = args.consolePiping?.enabled ?? true
    const levels = args.consolePiping?.levels ?? DEFAULT_LEVELS
    const editor: EditorConfig = args.editor ?? DEFAULT_EDITOR_CONFIG

    // 2. wire package-manager + package.json events (Vite event-client-setup analog).
    //    Guarded like Vite's `event-client-setup` sub-plugin so CI runs don't
    //    trigger `emitOutdatedDeps()` (which may spawn a package-manager subprocess).
    if (!process.env.CI && process.env.NODE_ENV === 'development') {
      this.wirePackageManager(compiler, logging)
    }

    // 3. mount __tsd/* endpoints on the dev server (Vite custom-server analog).
    //    The event bus is started lazily here (rather than in `apply`) so unit
    //    tests that never boot a dev server don't open real sockets.
    const prev = compiler.options.devServer?.setupMiddlewares
    compiler.options.devServer = compiler.options.devServer ?? {}

    const openInEditor: EditorConfig['open'] = async (
      filePath,
      lineNum,
      columnNum,
    ) => {
      if (!filePath) return
      await editor.open(filePath, lineNum, columnNum)
    }

    const originalConsole = Object.fromEntries(
      levels.map((l) => [l, console[l].bind(console)]),
    ) as Partial<Record<ConsoleLevel, typeof console.log>>

    const sseClients: Array<{ res: ServerResponse; id: number }> = []
    let sseClientId = 0
    let busStarted = false

    compiler.options.devServer.setupMiddlewares = (
      middlewares: Array<any>,
      server: any,
    ) => {
      // Refine the dev-server origin with the real, resolved port.
      const devServerPort =
        server?.options?.port ??
        compiler.options.devServer?.port ??
        DEFAULT_DEV_SERVER_PORT
      setDevServerOrigin({
        port: devServerPort,
        host: 'localhost',
        protocol: 'http',
      })

      // Start the event bus once and record the resolved connection for the
      // loader's placeholder replacement (devtools client <-> event bus).
      if (serverBusEnabled && !busStarted) {
        busStarted = true
        const bus = new ServerEventBus({
          ...args.eventBusConfig,
          port: args.eventBusConfig?.port ?? 4206,
          host: 'localhost',
        })
        // start() handles EADDRINUSE and returns the actual bound port.
        void bus.start().then((port) => {
          setDevtoolsConnection({ port, host: 'localhost', protocol: 'http' })
        })
      }

      const base = prev ? prev(middlewares, server) : middlewares
      base.unshift({
        name: 'tanstack-devtools',
        middleware: (
          req: IncomingMessage & { url?: string },
          res: ServerResponse,
          next: (err?: unknown) => void,
        ) =>
          handleDevToolsRequest(req, res, next, {
            onOpenSource: (parsedData: any) => {
              const { data, routine } = parsedData
              if (routine === 'open-source') {
                return handleOpenSource({
                  data: { type: data.type, data },
                  openInEditor,
                })
              }
              return
            },
            ...(consolePipeEnabled
              ? {
                  onConsolePipe: (entries: Array<any>) => {
                    for (const entry of entries) {
                      const prefix = chalk.cyan('[Client]')
                      const logMethod =
                        originalConsole[entry.level as ConsoleLevel] ??
                        originalConsole.log!
                      const cleanedArgs = stripEnhancedLogPrefix(
                        entry.args,
                        (loc) => chalk.gray(loc),
                      )
                      logMethod(prefix, ...cleanedArgs)
                    }
                  },
                  onConsolePipeSSE: (res: ServerResponse, req: IncomingMessage) => {
                    res.setHeader('Content-Type', 'text/event-stream')
                    res.setHeader('Cache-Control', 'no-cache')
                    res.setHeader('Connection', 'keep-alive')
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    ;(res as any).flushHeaders?.()

                    const clientId = ++sseClientId
                    sseClients.push({ res, id: clientId })

                    req.on('close', () => {
                      const index = sseClients.findIndex(
                        (c) => c.id === clientId,
                      )
                      if (index !== -1) sseClients.splice(index, 1)
                    })
                  },
                  onServerConsolePipe: (entries: Array<any>) => {
                    try {
                      const data = JSON.stringify({
                        entries: entries.map((e) => ({
                          level: e.level,
                          args: e.args,
                          source: 'server',
                          timestamp: e.timestamp || Date.now(),
                        })),
                      })
                      for (const client of sseClients) {
                        client.res.write(`data: ${data}\n\n`)
                      }
                    } catch {
                      // swallow serialization / write errors
                    }
                  },
                }
              : {}),
          }),
      })
      return base
    }
  }

  private wirePackageManager(compiler: any, logging: boolean) {
    let packageJson: PackageJson | null = null
    let outdatedDeps: ReturnType<typeof emitOutdatedDeps> = Promise.resolve(null)

    const refresh = async () => {
      packageJson = await readPackageJson()
      outdatedDeps = emitOutdatedDeps()
    }

    // Prime package.json/outdated deps once the first compilation finishes.
    compiler.hooks.done.tap(PLUGIN, () => {
      if (!packageJson) void refresh()
    })

    // Re-read package.json on rebuilds (Vite handleHotUpdate analog).
    compiler.hooks.watchRun?.tapPromise?.(PLUGIN, async () => {
      await refresh()
    })

    // Whenever a client mounts, send it the current package info.
    devtoolsEventClient.on('mounted', async () => {
      devtoolsEventClient.emit('outdated-deps-read', {
        outdatedDeps: await outdatedDeps,
      })
      devtoolsEventClient.emit('package-json-read', { packageJson })
    })

    devtoolsEventClient.on('install-devtools', async (event) => {
      const result = await installPackage(event.payload.packageName)
      devtoolsEventClient.emit('devtools-installed', {
        packageName: event.payload.packageName,
        success: result.success,
        error: result.error,
      })

      if (result.success) {
        const { packageName, pluginName, pluginImport } = event.payload
        if (logging) {
          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-rspack] Auto-adding ${packageName} to devtools...`,
            ),
          )
        }
        const injectResult = addPluginToDevtools(
          getDevtoolsFileId(),
          packageName,
          pluginName,
          pluginImport,
        )
        if (injectResult.success) {
          devtoolsEventClient.emit('plugin-added', {
            packageName,
            success: true,
          })
          devtoolsEventClient.emit('package-json-read', {
            packageJson: await readPackageJson(),
          })
        }
      }
    })

    devtoolsEventClient.on('add-plugin-to-devtools', (event) => {
      const { packageName, pluginName, pluginImport } = event.payload
      if (logging) {
        console.log(
          chalk.blueBright(
            `[@tanstack/devtools-rspack] Adding ${packageName} to devtools...`,
          ),
        )
      }
      const result = addPluginToDevtools(
        getDevtoolsFileId(),
        packageName,
        pluginName,
        pluginImport,
      )
      devtoolsEventClient.emit('plugin-added', {
        packageName,
        success: result.success,
        error: result.error,
      })
    })

    devtoolsEventClient.on('bump-package-version', async (event) => {
      const { packageName, devtoolsPackage, pluginName, minVersion, pluginImport } =
        event.payload
      if (logging) {
        console.log(
          chalk.blueBright(
            `[@tanstack/devtools-rspack] Bumping ${packageName} to version ${minVersion}...`,
          ),
        )
      }
      const packageWithVersion = minVersion
        ? `${packageName}@^${minVersion}`
        : packageName
      const result = await installPackage(packageWithVersion)

      if (!result.success) {
        devtoolsEventClient.emit('devtools-installed', {
          packageName: devtoolsPackage,
          success: false,
          error: result.error,
        })
        return
      }

      const fileId = getDevtoolsFileId()
      if (!fileId) {
        devtoolsEventClient.emit('devtools-installed', {
          packageName: devtoolsPackage,
          success: true,
        })
        return
      }

      const injectResult = injectPluginIntoFile(fileId, {
        packageName: devtoolsPackage,
        pluginName,
        pluginImport,
      })
      devtoolsEventClient.emit('plugin-added', {
        packageName: devtoolsPackage,
        success: injectResult.success,
        error: injectResult.error,
      })
      if (injectResult.success) {
        devtoolsEventClient.emit('package-json-read', {
          packageJson: await readPackageJson(),
        })
      }
    })
  }
}
