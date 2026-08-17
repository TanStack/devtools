import type { Change, Options } from 'react-scan'

export type { Change, Options }

type OnRender = NonNullable<Options['onRender']>
export type Render = Parameters<OnRender>[1][number]

export type AnimationSpeed = NonNullable<Options['animationSpeed']>

export interface ReactScanDevtoolsOptions {
  enabled?: boolean
  log?: boolean
  animationSpeed?: AnimationSpeed
  onRender?: Options['onRender']
}

export interface ReactScanPluginSettings {
  enabled: boolean
  log: boolean
  animationSpeed: AnimationSpeed
}

export interface ComponentRenderStats {
  name: string
  renders: number
  timeMs: number
  unnecessary: number
  lastFps: number | null
  lastChanges: Array<Change>
  lastRenders: Array<Render>
}

export const UNKNOWN_COMPONENT_NAME = '(unknown)'
export const MAX_RENDERS_PER_COMPONENT = 50

export const DEFAULT_PLUGIN_SETTINGS: ReactScanPluginSettings = {
  enabled: true,
  log: false,
  animationSpeed: 'fast',
}
