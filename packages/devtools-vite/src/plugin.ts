import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { normalizePath } from 'vite'
import chalk from 'chalk'
import { handleDevToolsViteRequest, readPackageJson, tryParseJson, } from './utils'
import { DEFAULT_EDITOR_CONFIG, handleOpenSource } from './editor'
import { removeDevtools } from './remove-devtools'
import { addSourceToJsx } from './inject-source'
import { enhanceConsoleLog } from './enhance-logs'
import type { Plugin } from 'vite'
import type { EditorConfig } from './editor'
import type { ServerEventBusConfig } from '@tanstack/devtools-event-bus/server'
import { exec } from 'node:child_process'
import { devtoolsEventClient } from './event'

export type TanStackDevtoolsViteConfig = {
  /**
   * Configuration for the editor integration. Defaults to opening in VS code
   */
  editor?: EditorConfig
  /**
   * The configuration options for the server event bus
   */
  eventBusConfig?: ServerEventBusConfig
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
  }
}

export const defineDevtoolsConfig = (config: TanStackDevtoolsViteConfig) =>
  config

export const devtools = async (args?: TanStackDevtoolsViteConfig): Promise<Array<Plugin>> => {
  let port = 5173
  const logging = args?.logging ?? true
  const enhancedLogsConfig = args?.enhancedLogs ?? { enabled: true }
  const injectSourceConfig = args?.injectSource ?? { enabled: true }
  const removeDevtoolsOnBuild = args?.removeDevtoolsOnBuild ?? true
  const bus = new ServerEventBus(args?.eventBusConfig)
  const packageJson = await readPackageJson()
  let outdatedDeps: any = null;
  exec('npm outdated --json', (_, stdout) => {
    // npm outdated exits with code 1 if there are outdated packages, but still outputs valid JSON
    if (stdout) {
      outdatedDeps = tryParseJson(stdout);
      devtoolsEventClient.emit("ready", {
        packageJson,
        outdatedDeps
      })
    }
  });
  devtoolsEventClient.on("mounted", () => {
    devtoolsEventClient.emit("ready", {
      packageJson,
      outdatedDeps
    })
  })
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

        return addSourceToJsx(code, id)
      },
    },
    {
      enforce: 'pre',
      name: '@tanstack/devtools:custom-server',
      apply(config) {
        // Custom server is only needed in development for piping events to the client
        return config.mode === 'development'
      },
      configureServer(server) {
        bus.start()

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
        server.middlewares.use((req, res, next) =>
          handleDevToolsViteRequest(req, res, next, (parsedData) => {
            const { data, routine } = parsedData
            if (routine === 'open-source') {
              return handleOpenSource({
                data: { type: data.type, data },
                openInEditor,
              })
            }
            return
          }),
        )
      },
    },
    {
      name: '@tanstack/devtools:remove-devtools-on-build',
      apply(_, { command }) {
        return command === 'build' && removeDevtoolsOnBuild
      },
      enforce: 'pre',
      transform(code, id) {
        if (
          id.includes('node_modules') ||
          id.includes('?raw') ||
          id.includes('dist') ||
          id.includes('build')
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
      name: "@tanstack/devtools:listener",
      async handleHotUpdate({ file }) {
        if (file.endsWith("package.json")) {
          console.log(packageJson)
          const newPackageJson = await readPackageJson();
          console.log(newPackageJson)
          //console.log("package.json changed, you might want to restart the dev server")
        }
      }
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
  ]
}
