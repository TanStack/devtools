import { devtoolsEventClient } from '@tanstack/devtools-client'
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { normalizePath } from 'vite'
import chalk from 'chalk'
import {
  handleDevToolsViteRequest,
  readPackageJson,
  stripEnhancedLogPrefix,
} from './utils'
import { DEFAULT_EDITOR_CONFIG, handleOpenSource } from './editor'
import { removeDevtools } from './remove-devtools'
import { addSourceToJsx } from './inject-source'
import { enhanceConsoleLog } from './enhance-logs'
import { detectDevtoolsFile, injectPluginIntoFile } from './inject-plugin'
import {
  addPluginToDevtools,
  emitOutdatedDeps,
  installPackage,
} from './package-manager'
import { generateConsolePipeCode } from './virtual-console'
import type { ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { EditorConfig } from './editor'
import type {
  HttpServerLike,
  ServerEventBusConfig,
} from '@tanstack/devtools-event-bus/server'

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

export type TanStackDevtoolsViteConfig = {
  /**
   * Configuration for the editor integration. Defaults to opening in VS code
   */
  editor?: EditorConfig
  /**
   * The configuration options for the server event bus
   */
  eventBusConfig?: ServerEventBusConfig & {
    /**
     * Should the server event bus be enabled or not
     * @default true
     */
    enabled?: boolean // defaults to true
  }
  /**
   * Configuration for enhanced logging.
   */
  enhancedLogs?: {
    /**
     * Whether to enable enhanced logging.
     * @default true
     */
    enabled: boolean
  }
  /**
   * Whether to remove devtools from the production build.
   * @default true
   */
  removeDevtoolsOnBuild?: boolean

  /**
   * Whether to log information to the console.
   * @default true
   */
  logging?: boolean
  /**
   * Configuration for source injection.
   */
  injectSource?: {
    /**
     * Whether to enable source injection via data-tsd-source.
     * @default true
     */
    enabled: boolean
    /**
     * List of files or patterns to ignore for source injection.
     */
    ignore?: {
      files?: Array<string | RegExp>
      components?: Array<string | RegExp>
    }
  }
  /**
   * Configuration for console piping between client and server.
   * When enabled, console logs from the client will appear in the terminal,
   * and server logs will appear in the browser console.
   */
  consolePiping?: {
    /**
     * Whether to enable console piping.
     * @default true
     */
    enabled?: boolean
    /**
     * Which console methods to pipe.
     * @default ['log', 'warn', 'error', 'info', 'debug']
     */
    levels?: Array<ConsoleLevel>
  }
}

export const defineDevtoolsConfig = (config: TanStackDevtoolsViteConfig) =>
  config

export const devtools = (args?: TanStackDevtoolsViteConfig): Array<Plugin> => {
  let port = 5173
  const logging = args?.logging ?? true
  const enhancedLogsConfig = args?.enhancedLogs ?? { enabled: true }
  const injectSourceConfig = args?.injectSource ?? { enabled: true }
  const removeDevtoolsOnBuild = args?.removeDevtoolsOnBuild ?? true
  const serverBusEnabled = args?.eventBusConfig?.enabled ?? true
  const consolePipingConfig = args?.consolePiping ?? { enabled: true }
  const consolePipingLevels: Array<ConsoleLevel> =
    consolePipingConfig.levels ?? ['log', 'warn', 'error', 'info', 'debug']

  let devtoolsFileId: string | null = null
  let devtoolsPort: number | null = null
  let devtoolsHost: string | null = null
  let devtoolsProtocol: 'http' | 'https' | null = null

  return [
    {
      enforce: 'pre',
      name: '@tanstack/devtools:inject-source',
      apply(config) {
        return config.mode === 'development' && injectSourceConfig.enabled
      },
      transform(code, id) {
        if (
          id.includes('node_modules') ||
          id.includes('?raw') ||
          id.includes('dist') ||
          id.includes('build')
        )
          return

        return addSourceToJsx(code, id, args?.injectSource?.ignore)
      },
    },
    {
      name: '@tanstack/devtools:config',
      enforce: 'pre',
      config(_, { command }) {
        // we do not apply any config changes for build
        if (command !== 'serve') {
          return
        }

        /*  const solidDedupeDeps = [
          'solid-js',
          'solid-js/web',
          'solid-js/store',
          'solid-js/html',
          'solid-js/h',
        ]

        return {
          resolve: {
            dedupe: solidDedupeDeps,
          },
          optimizeDeps: {
            include: solidDedupeDeps,
          },
        } */
      },
    },
    {
      enforce: 'pre',
      name: '@tanstack/devtools:custom-server',
      apply(config) {
        // Custom server is only needed in development for piping events to the client
        return config.mode === 'development'
      },
      async configureServer(server) {
        if (serverBusEnabled) {
          const preferredPort = args?.eventBusConfig?.port ?? 4206
          const isHttps = !!server.config.server.https
          const serverHost =
            typeof server.config.server.host === 'string'
              ? server.config.server.host
              : 'localhost'

          devtoolsProtocol = isHttps ? 'https' : 'http'
          devtoolsHost = serverHost

          const bus = new ServerEventBus({
            ...args?.eventBusConfig,
            port: preferredPort,
            host: serverHost,
            // When HTTPS is enabled, piggyback on Vite's server
            // so WebSocket/SSE connections share the same TLS certificate
            ...(isHttps && server.httpServer
              ? { httpServer: server.httpServer as HttpServerLike }
              : {}),
          })
          // start() now handles EADDRINUSE and returns the actual port
          devtoolsPort = await bus.start()
        }

        server.middlewares.use((req, _res, next) => {
          if (req.socket.localPort && req.socket.localPort !== port) {
            port = req.socket.localPort
          }
          next()
        })
        if (server.config.server.port) {
          port = server.config.server.port
        }

        server.httpServer?.on('listening', () => {
          port = server.config.server.port
        })

        const editor = args?.editor ?? DEFAULT_EDITOR_CONFIG
        const openInEditor: EditorConfig['open'] = async (
          path,
          lineNum,
          columnNum,
        ) => {
          if (!path) {
            return
          }
          await editor.open(path, lineNum, columnNum)
        }

        // SSE clients for broadcasting server logs to browser
        const sseClients: Array<{
          res: ServerResponse
          id: number
        }> = []
        let sseClientId = 0
        const consolePipingEnabled = consolePipingConfig.enabled ?? true

        server.middlewares.use((req, res, next) =>
          handleDevToolsViteRequest(req, res, next, {
            onOpenSource: (parsedData) => {
              const { data, routine } = parsedData
              if (routine === 'open-source') {
                return handleOpenSource({
                  data: { type: data.type, data },
                  openInEditor,
                })
              }
              return
            },
            ...(consolePipingEnabled
              ? {
                  onConsolePipe: (entries) => {
                    for (const entry of entries) {
                      const prefix = chalk.cyan('[Client]')
                      const logMethod = console[entry.level as ConsoleLevel]
                      const cleanedArgs = stripEnhancedLogPrefix(
                        entry.args,
                        (loc) => chalk.gray(loc),
                      )
                      logMethod(prefix, ...cleanedArgs)
                    }
                  },
                  onConsolePipeSSE: (res, req) => {
                    res.setHeader('Content-Type', 'text/event-stream')
                    res.setHeader('Cache-Control', 'no-cache')
                    res.setHeader('Connection', 'keep-alive')
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.flushHeaders()

                    const clientId = ++sseClientId
                    sseClients.push({ res, id: clientId })

                    req.on('close', () => {
                      const index = sseClients.findIndex(
                        (c) => c.id === clientId,
                      )
                      if (index !== -1) {
                        sseClients.splice(index, 1)
                      }
                    })
                  },
                  onServerConsolePipe: (entries) => {
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
                    } catch {}
                  },
                }
              : {}),
          }),
        )
      },
    },
    {
      name: '@tanstack/devtools:remove-devtools-on-build',
      apply(config, { command }) {
        // Check both command and mode to support various hosting providers
        // Some providers (Cloudflare, Netlify, Heroku) might not use 'build' command
        // but will always set mode to 'production' for production builds
        return (
          (command !== 'serve' || config.mode === 'production') &&
          removeDevtoolsOnBuild
        )
      },
      enforce: 'pre',
      transform(code, id) {
        const devtoolPackages = [
          '@tanstack/react-devtools',
          '@tanstack/preact-devtools',
          '@tanstack/solid-devtools',
          '@tanstack/vue-devtools',
          '@tanstack/devtools',
        ]
        if (
          id.includes('node_modules') ||
          id.includes('?raw') ||
          !devtoolPackages.some((pkg) => code.includes(pkg))
        )
          return
        const transform = removeDevtools(code, id)
        if (!transform) return
        if (logging) {
          console.log(
            `\n${chalk.greenBright(`[@tanstack/devtools-vite]`)} Removed devtools code from: ${id.replace(normalizePath(process.cwd()), '')}\n`,
          )
        }
        return transform
      },
    },
    {
      name: '@tanstack/devtools:event-client-setup',
      apply(config, { command }) {
        if (
          process.env.CI ||
          process.env.NODE_ENV !== 'development' ||
          command !== 'serve'
        )
          return false
        return config.mode === 'development'
      },
      async configureServer() {
        const packageJson = await readPackageJson()
        const outdatedDeps = emitOutdatedDeps().then((deps) => deps)

        // Listen for package installation requests
        devtoolsEventClient.on('install-devtools', async (event) => {
          const result = await installPackage(event.payload.packageName)
          devtoolsEventClient.emit('devtools-installed', {
            packageName: event.payload.packageName,
            success: result.success,
            error: result.error,
          })

          // If installation was successful, automatically add the plugin to devtools
          if (result.success) {
            const { packageName, pluginName, pluginImport } = event.payload

            console.log(
              chalk.blueBright(
                `[@tanstack/devtools-vite] Auto-adding ${packageName} to devtools...`,
              ),
            )

            const injectResult = addPluginToDevtools(
              devtoolsFileId,
              packageName,
              pluginName,
              pluginImport,
            )

            if (injectResult.success) {
              // Emit plugin-added event so the UI updates
              devtoolsEventClient.emit('plugin-added', {
                packageName,
                success: true,
              })

              // Also re-read package.json to update the UI with the newly installed package
              const updatedPackageJson = await readPackageJson()
              devtoolsEventClient.emit('package-json-read', {
                packageJson: updatedPackageJson,
              })
            }
          }
        })

        // Listen for add plugin to devtools requests
        devtoolsEventClient.on('add-plugin-to-devtools', (event) => {
          const { packageName, pluginName, pluginImport } = event.payload

          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-vite] Adding ${packageName} to devtools...`,
            ),
          )

          const result = addPluginToDevtools(
            devtoolsFileId,
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

        // Handle bump-package-version event
        devtoolsEventClient.on('bump-package-version', async (event) => {
          const {
            packageName,
            devtoolsPackage,
            pluginName,
            minVersion,
            pluginImport,
          } = event.payload

          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-vite] Bumping ${packageName} to version ${minVersion}...`,
            ),
          )

          // Install the package with the minimum version
          const packageWithVersion = minVersion
            ? `${packageName}@^${minVersion}`
            : packageName

          const result = await installPackage(packageWithVersion)

          if (!result.success) {
            console.log(
              chalk.redBright(
                `[@tanstack/devtools-vite] Failed to bump ${packageName}: ${result.error}`,
              ),
            )
            devtoolsEventClient.emit('devtools-installed', {
              packageName: devtoolsPackage,
              success: false,
              error: result.error,
            })
            return
          }

          console.log(
            chalk.greenBright(
              `[@tanstack/devtools-vite] Successfully bumped ${packageName} to ${minVersion}!`,
            ),
          )

          // Check if we found the devtools file
          if (!devtoolsFileId) {
            console.log(
              chalk.yellowBright(
                `[@tanstack/devtools-vite] Devtools file not found. Skipping auto-injection.`,
              ),
            )
            devtoolsEventClient.emit('devtools-installed', {
              packageName: devtoolsPackage,
              success: true,
            })
            return
          }

          // Now inject the devtools plugin
          console.log(
            chalk.blueBright(
              `[@tanstack/devtools-vite] Adding ${devtoolsPackage} to devtools...`,
            ),
          )

          const injectResult = injectPluginIntoFile(devtoolsFileId, {
            packageName: devtoolsPackage,
            pluginName,
            pluginImport,
          })

          if (injectResult.success) {
            console.log(
              chalk.greenBright(
                `[@tanstack/devtools-vite] Successfully added ${devtoolsPackage} to devtools!`,
              ),
            )

            devtoolsEventClient.emit('plugin-added', {
              packageName: devtoolsPackage,
              success: true,
            })

            // Re-read package.json to update the UI
            const updatedPackageJson = await readPackageJson()
            devtoolsEventClient.emit('package-json-read', {
              packageJson: updatedPackageJson,
            })
          } else {
            console.log(
              chalk.redBright(
                `[@tanstack/devtools-vite] Failed to add ${devtoolsPackage} to devtools: ${injectResult.error}`,
              ),
            )

            devtoolsEventClient.emit('plugin-added', {
              packageName: devtoolsPackage,
              success: false,
              error: injectResult.error,
            })
          }
        })

        // whenever a client mounts we send all the current info to the subscribers
        devtoolsEventClient.on('mounted', async () => {
          devtoolsEventClient.emit('outdated-deps-read', {
            outdatedDeps: await outdatedDeps,
          })
          devtoolsEventClient.emit('package-json-read', {
            packageJson,
          })
        })

        // Console piping is now handled via HTTP endpoints in the custom-server plugin
      },
      async handleHotUpdate({ file }) {
        if (file.endsWith('package.json')) {
          const newPackageJson = await readPackageJson()
          devtoolsEventClient.emit('package-json-read', {
            packageJson: newPackageJson,
          })
          emitOutdatedDeps()
        }
      },
    },
    // Inject console piping code into entry files (both client and server)
    {
      name: '@tanstack/devtools:console-pipe-transform',
      enforce: 'pre',
      apply(config, { command }) {
        return (
          config.mode === 'development' &&
          command === 'serve' &&
          (consolePipingConfig.enabled ?? true)
        )
      },
      transform(code, id) {
        // Inject the console pipe code into entry files
        if (
          id.includes('node_modules') ||
          id.includes('dist') ||
          id.includes('?') ||
          !id.match(/\.(tsx?|jsx?)$/)
        ) {
          return
        }

        // Only inject once - check if already injected
        if (code.includes('__tsdConsolePipe')) {
          return
        }

        // Check if this is a root entry file (with <html> JSX or client entry points)
        // In SSR frameworks, this file runs on BOTH server (SSR) and client (hydration)
        // so our runtime check (typeof window === 'undefined') handles both environments
        const isRootEntry =
          /<html[\s>]/i.test(code) ||
          code.includes('StartClient') ||
          code.includes('hydrateRoot') ||
          code.includes('createRoot') ||
          (code.includes('solid-js/web') && code.includes('render('))

        if (isRootEntry) {
          const viteServerUrl = `http://localhost:${port}`
          const inlineCode = generateConsolePipeCode(
            consolePipingLevels,
            viteServerUrl,
          )

          return `${inlineCode}\n${code}`
        }

        return undefined
      },
    },
    {
      name: '@tanstack/devtools:better-console-logs',
      enforce: 'pre',
      apply(config) {
        return config.mode === 'development' && enhancedLogsConfig.enabled
      },
      transform(code, id) {
        // Ignore anything external
        if (
          id.includes('node_modules') ||
          id.includes('?raw') ||
          id.includes('dist') ||
          id.includes('build') ||
          !code.includes('console.')
        )
          return

        return enhanceConsoleLog(code, id, port)
      },
    },
    {
      name: '@tanstack/devtools:inject-plugin',
      apply(config, { command }) {
        return config.mode === 'development' && command === 'serve'
      },
      transform(code, id) {
        // First pass: find where TanStackDevtools is imported
        if (!devtoolsFileId && detectDevtoolsFile(code)) {
          // Extract actual file path (remove query params)
          const [filePath] = id.split('?')
          if (filePath) {
            devtoolsFileId = filePath
          }
        }

        return undefined
      },
    },
    {
      name: '@tanstack/devtools:connection-injection',
      apply(config, { command }) {
        return config.mode === 'development' && command === 'serve'
      },
      transform(code, id) {
        // Only transform @tanstack packages that contain the connection placeholders
        const hasPlaceholder =
          code.includes('__TANSTACK_DEVTOOLS_PORT__') ||
          code.includes('__TANSTACK_DEVTOOLS_HOST__') ||
          code.includes('__TANSTACK_DEVTOOLS_PROTOCOL__')
        if (!hasPlaceholder) return
        if (
          !id.includes('@tanstack/devtools') &&
          !id.includes('@tanstack/event-bus')
        )
          return

        // Replace placeholders with actual values (or fallback defaults)
        const portValue = devtoolsPort ?? 4206
        const hostValue = devtoolsHost ?? 'localhost'
        const protocolValue = devtoolsProtocol ?? 'http'

        let result = code
        result = result.replace(
          /__TANSTACK_DEVTOOLS_PORT__/g,
          String(portValue),
        )
        result = result.replace(
          /__TANSTACK_DEVTOOLS_HOST__/g,
          JSON.stringify(hostValue),
        )
        result = result.replace(
          /__TANSTACK_DEVTOOLS_PROTOCOL__/g,
          JSON.stringify(protocolValue),
        )
        return result
      },
    },
  ]
}
