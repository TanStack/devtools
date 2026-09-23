import { registerDevtoolsTools as registerDevtoolsToolsImpl } from './register'
import { registerDevtoolsTools as registerDevtoolsToolsNoOp } from './noop'

/**
 * Register WebMCP tools for one plugin on the page.
 *
 * When `NODE_ENV` is `development`, this export is the real helper.
 * This export is a no-op in every other environment.
 * A production bundler replaces `process.env.NODE_ENV` with a literal.
 * The bundler then keeps the no-op and removes `./register`.
 * The caller imports `@tanstack/devtools-webmcp/production` to keep the real helper in production.
 *
 * `options.pluginId` is required. `options.instanceId` is optional.
 * The function returns a cleanup function. The caller removes the tools with that function.
 *
 * @param options - The plugin id, the optional instance id, and the tools to register.
 *
 * @example
 * ```ts
 * const stop = registerDevtoolsTools({
 *   pluginId: 'tanstack.query',
 *   tools: [],
 * })
 *
 * stop()
 * ```
 */
const registerDevtoolsTools =
  process.env.NODE_ENV !== 'development'
    ? registerDevtoolsToolsNoOp
    : registerDevtoolsToolsImpl

export { registerDevtoolsTools }
export type {
  DevtoolsTool,
  DevtoolsToolAnnotations,
  RegisterDevtoolsToolsOptions,
} from './types'
