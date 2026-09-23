import type { RegisterDevtoolsToolsOptions } from './types'

/**
 * This function returns a cleanup function. This function does not register tools.
 * This function does not keep the argument. The cleanup function does nothing.
 *
 * @param _options The plugin id, the optional instance id, and the tools.
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
export function registerDevtoolsTools(_options: RegisterDevtoolsToolsOptions) {
  return () => {}
}
