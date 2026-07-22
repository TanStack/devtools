import { TanStackDevtoolsRspackPlugin } from './plugin'
import type { TanStackDevtoolsConfig } from '@tanstack/devtools-bundler-core'

export type { ConsoleLevel } from '@tanstack/devtools-bundler-core'
export type TanStackDevtoolsRspackConfig = TanStackDevtoolsConfig

export const defineDevtoolsConfig = (config: TanStackDevtoolsRspackConfig) =>
  config

export const devtools = (args?: TanStackDevtoolsRspackConfig) =>
  new TanStackDevtoolsRspackPlugin(args)
