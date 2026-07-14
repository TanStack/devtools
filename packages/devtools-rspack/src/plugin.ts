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

    // 1b. ALSO process the `@tanstack/devtools*` / `@tanstack/event-bus*`
    //     packages when THEY resolve under `node_modules` (the common case for
    //     real consumers, as opposed to this repo's own workspace symlinks).
    //     The general rule above excludes all of `node_modules`, so without
    //     this second, narrowly-scoped rule the `__TANSTACK_DEVTOOLS_*`
    //     connection placeholders (step 4 of `runPipeline`) and the
    //     runtime-bridge injection (step 5) would never run on that code,
    //     breaking a custom `eventBusConfig.port` / host / protocol for any
    //     consumer whose install resolves these packages under
    //     `node_modules` (flat npm/yarn installs, or pnpm's nested
    //     `.pnpm/<pkg>/node_modules/<pkg>` virtual-store layout). Note this
    //     rule has NO `exclude`. Within `runPipeline`, steps 4 (connection
    //     placeholders) and 5 (runtime-bridge injection) are the only ones that
    //     produce an effect here; step 6 (`detectDevtoolsFile`) also runs but
    //     no-ops on these built package files, while steps 1-3 are
    //     excluded-gated (skipped for `node_modules`) and step 7 is
    //     production-only.
    compiler.options.module.rules.push({
      test: /\.[cm]?jsx?$/,
      include:
        /node_modules[\\/](\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?@tanstack[\\/](devtools|event-bus)/,
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

    // Resolve the event-bus connection (devtools client <-> event bus).
    // `host` honors a user-supplied `eventBusConfig.host` and is NOT hardcoded.
    // Protocol is always 'http': unlike Vite (which can piggyback its own https
    // server), the rspack event bus is a standalone plain-http server on
    // localhost, so 'http' is correct here — this is not a hardcoding bug.
    const preferredPort = args.eventBusConfig?.port ?? 4206
    const busHost = args.eventBusConfig?.host ?? 'localhost'

    // Vite `await`s the bound port before any transform runs; rspack's `apply`
    // is synchronous and cannot await, so record the connection EAGERLY (before
    // any compilation transform reads it via `getDevtoolsConnection`) with the
    // preferred port/host. This bakes a custom `eventBusConfig.port`/host into
    // the loader's placeholder replacement for the common case. The actual
    // bound port is refined once `bus.start()` resolves (covers EADDRINUSE).
    if (serverBusEnabled) {
      setDevtoolsConnection({
        port: preferredPort,
        host: busHost,
        protocol: 'http',
      })
    }

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

      // Start the event bus once (deferred here rather than in `apply` so unit
      // tests that never boot a dev server don't open real sockets). The
      // connection was already set eagerly in the dev block above; here we
      // refine it to the actual bound port and surface any start failure.
      if (serverBusEnabled && !busStarted) {
        busStarted = true
        const bus = new ServerEventBus({
          ...args.eventBusConfig,
          port: preferredPort,
          host: busHost,
        })
        // start() handles EADDRINUSE and returns the actual bound port.
        bus
          .start()
          .then((port) =>
            setDevtoolsConnection({ port, host: busHost, protocol: 'http' }),
          )
          .catch((err) =>
            console.error(
              chalk.red(
                '[@tanstack/devtools-rspack] event bus failed to start:',
              ),
              err,
            ),
          )
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

    // Re-read package.json on rebuilds, but ONLY when package.json actually
    // changed (Vite's handleHotUpdate analog gates on
    // `file.endsWith('package.json')`). `refresh()` runs `emitOutdatedDeps()`,
    // which spawns a `pnpm/npm outdated` subprocess, so running it on every
    // rebuild would be wasteful. In rspack/webpack the changed paths for a
    // rebuild are on `compiler.modifiedFiles` (a Set of absolute paths).
    compiler.hooks.watchRun?.tapPromise?.(PLUGIN, async () => {
      const modified: Set<string> | undefined = compiler.modifiedFiles
      // `modifiedFiles` is undefined on the first watch run — prime deps once.
      if (!modified) {
        if (!packageJson) await refresh()
        return
      }
      // Normalize `\` -> `/` so the basename check is separator-agnostic.
      const packageJsonChanged = [...modified].some((file) => {
        const normalized = file.replace(/\\/g, '/')
        return (
          normalized.endsWith('/package.json') || normalized === 'package.json'
        )
      })
      if (packageJsonChanged) await refresh()
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
