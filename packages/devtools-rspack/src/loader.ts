import {
  TANSTACK_DEVTOOLS_PACKAGES,
  addSourceToJsx,
  detectDevtoolsFile,
  enhanceConsoleLog,
  generateConsolePipeCode,
  getDevServerOrigin,
  getDevtoolsConnection,
  injectRuntimeBridge,
  removeDevtools,
  setDevtoolsFileId,
} from '@tanstack/devtools-bundler-core'
import type {
  ConsoleLevel,
  DevServerOrigin,
  DevtoolsConnection,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools-bundler-core'

const EXCLUDE = /node_modules|\?raw|[\\/](dist|build)[\\/]/
const isServerTarget = (target: string) => /node|async-node/.test(target)

const DEFAULT_LEVELS: Array<ConsoleLevel> = [
  'log',
  'warn',
  'error',
  'info',
  'debug',
]

export interface PipelineCtx {
  mode: 'development' | 'production' | 'none'
  config: TanStackDevtoolsConfig
  /**
   * The event-bus connection (devtools client <-> event bus, default port 4206).
   * Used ONLY for `__TANSTACK_DEVTOOLS_*` placeholder replacement.
   */
  connection: DevtoolsConnection
  /**
   * The dev-server origin where the `__tsd/*` middleware endpoints are mounted.
   * Used for the `/__tsd/open-source` URL baked into enhanced logs and the
   * SSR-side `/__tsd/console-pipe/server` POST target. Falls back to
   * `connection` when absent (e.g. in unit tests).
   */
  devServer?: DevServerOrigin
  target: string
}

export function runPipeline(
  code: string,
  id: string,
  ctx: PipelineCtx,
): string {
  const { mode, config, connection, devServer, target } = ctx
  const isDev = mode === 'development'
  const filePath = id.split('?')[0] ?? id
  const excluded = EXCLUDE.test(id)
  let result = code

  const injectEnabled = config.injectSource?.enabled ?? true
  const logsEnabled = config.enhancedLogs?.enabled ?? true
  const pipeEnabled = config.consolePiping?.enabled ?? true
  const removeEnabled = config.removeDevtoolsOnBuild ?? true
  const levels = config.consolePiping?.levels ?? DEFAULT_LEVELS

  // 1. source injection (dev, JSX/TSX, not excluded)
  // addSourceToJsx returns `{ code, map } | undefined` (verified against core).
  if (isDev && injectEnabled && !excluded && /\.[jt]sx$/.test(filePath)) {
    const injected = addSourceToJsx(result, id, config.injectSource?.ignore)
    if (injected) result = injected.code
  }

  // 2. enhanced console logs (dev, contains console., not excluded)
  // enhanceConsoleLog returns `{ code, map } | undefined` (verified against core).
  // The port here builds the absolute `/__tsd/open-source` URL, which is served
  // by the DEV SERVER middleware — use the dev-server port, not the event bus.
  if (isDev && logsEnabled && !excluded && result.includes('console.')) {
    const enhanced = enhanceConsoleLog(
      result,
      id,
      devServer?.port ?? connection.port,
    )
    if (enhanced) result = enhanced.code
  }

  // 3. console-pipe injection into root entry files (dev, js/ts, not excluded, not already piped)
  if (
    isDev &&
    pipeEnabled &&
    !excluded &&
    /\.[cm]?[jt]sx?$/.test(filePath) &&
    !result.includes('__tsdConsolePipe')
  ) {
    const isRootEntry =
      /<html[\s>]/i.test(result) ||
      result.includes('StartClient') ||
      result.includes('hydrateRoot') ||
      result.includes('createRoot') ||
      (result.includes('solid-js/web') && result.includes('render('))
    if (isRootEntry) {
      // The SSR runtime POSTs to `${serverUrl}/__tsd/console-pipe/server`, an
      // endpoint mounted on the DEV SERVER — use the dev-server origin, not the
      // event bus. Falls back to the connection origin when absent (unit tests).
      const origin = devServer ?? connection
      const serverUrl = `${origin.protocol}://${origin.host}:${origin.port}`
      result = `${generateConsolePipeCode(levels, serverUrl)}\n${result}`
    }
  }

  // 4. connection placeholder replacement (@tanstack/devtools|event-bus modules)
  if (
    (result.includes('__TANSTACK_DEVTOOLS_PORT__') ||
      result.includes('__TANSTACK_DEVTOOLS_HOST__') ||
      result.includes('__TANSTACK_DEVTOOLS_PROTOCOL__')) &&
    (id.includes('@tanstack/devtools') || id.includes('@tanstack/event-bus'))
  ) {
    result = result
      .replace(/__TANSTACK_DEVTOOLS_PORT__/g, String(connection.port))
      .replace(/__TANSTACK_DEVTOOLS_HOST__/g, JSON.stringify(connection.host))
      .replace(
        /__TANSTACK_DEVTOOLS_PROTOCOL__/g,
        JSON.stringify(connection.protocol),
      )
  }

  // 5. runtime bridge (server target only; code-injection half — see parity caveat)
  // injectRuntimeBridge returns `string | undefined` (verified against core).
  if (isDev && !id.includes('?')) {
    const env = isServerTarget(target) ? 'server' : 'client'
    result = injectRuntimeBridge(result, id, env) ?? result
  }

  // 6. devtools file detection (records id for package-manager auto-injection)
  if (isDev && detectDevtoolsFile(result)) {
    setDevtoolsFileId(filePath)
  }

  // 7. remove devtools in production build
  // removeDevtools returns `{ code, map } | undefined` (verified against core).
  if (
    mode === 'production' &&
    removeEnabled &&
    !id.includes('node_modules') &&
    !id.includes('?raw') &&
    TANSTACK_DEVTOOLS_PACKAGES.some((pkg) => result.includes(pkg))
  ) {
    const transformed = removeDevtools(result, id)
    if (transformed) result = transformed.code
  }

  return result
}

// webpack/rspack loader entry
export default function tanstackDevtoolsLoader(
  this: any,
  source: string,
): string {
  const opts = (this.getOptions?.() ?? {}) as {
    config?: TanStackDevtoolsConfig
  }
  const target = String(this._compiler?.options?.target ?? 'web')
  return runPipeline(source, this.resourcePath, {
    mode: this.mode ?? 'development',
    config: opts.config ?? {},
    connection: getDevtoolsConnection(),
    devServer: getDevServerOrigin() ?? undefined,
    target,
  })
}
