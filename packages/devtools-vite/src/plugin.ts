import { normalizePath } from 'vite'
import chalk from 'chalk'
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { handleDevToolsViteRequest } from './utils'
import { DEFAULT_EDITOR_CONFIG, handleOpenSource } from './editor'
import { addSourceToJsx } from './inject-source'
import type { EditorConfig } from './editor'
import type { ServerEventBusConfig } from '@tanstack/devtools-event-bus/server'
import type { Plugin } from 'vite'

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

export const devtools = (args?: TanStackDevtoolsViteConfig): Array<Plugin> => {
  let port = 5173
  const enhancedLogsConfig = args?.enhancedLogs ?? { enabled: true }
  const injectSourceConfig = args?.injectSource ?? { enabled: true }
  const bus = new ServerEventBus(args?.eventBusConfig)

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
          return code

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
          id.includes('build')
        )
          return code

        if (!code.includes('console.')) {
          return code
        }
        const lines = code.split('\n')
        return lines
          .map((line, lineNumber) => {
            if (
              line.trim().startsWith('//') ||
              line.trim().startsWith('/**') ||
              line.trim().startsWith('*')
            ) {
              return line
            }
            // Do not add for arrow functions or return statements
            if (
              line.replaceAll(' ', '').includes('=>console.') ||
              line.includes('return console.')
            ) {
              return line
            }

            const column = line.indexOf('console.')
            const location = `${id.replace(normalizePath(process.cwd()), '')}:${lineNumber + 1}:${column + 1}`
            const logMessage = `'${chalk.magenta('LOG')} ${chalk.blueBright(`${location} - http://localhost:${port}/__tsd/open-source?source=${encodeURIComponent(id.replace(normalizePath(process.cwd()), ''))}&line=${lineNumber + 1}&column=${column + 1}`)}\\n → '`
            if (line.includes('console.log(')) {
              const newLine = `console.log(${logMessage},`
              return line.replace('console.log(', newLine)
            }
            if (line.includes('console.error(')) {
              const newLine = `console.error(${logMessage},`
              return line.replace('console.error(', newLine)
            }
            return line
          })
          .join('\n')
      },
    },
  ]
}
