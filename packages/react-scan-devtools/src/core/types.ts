import type { Options } from 'react-scan'

export type { Options }

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

export const DEFAULT_PLUGIN_SETTINGS: ReactScanPluginSettings = {
  enabled: true,
  log: false,
  animationSpeed: 'fast',
}
