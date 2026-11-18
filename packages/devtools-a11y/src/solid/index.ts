import * as Devtools from './A11yDevtools'
import * as plugin from './plugin'

export const A11yDevtools =
  process.env.NODE_ENV !== 'development'
    ? Devtools.A11yDevtoolsPanelNoOp
    : Devtools.A11yDevtoolsPanel

export const a11yDevtoolsPlugin =
  process.env.NODE_ENV !== 'development'
    ? plugin.a11yDevtoolsNoOpPlugin
    : plugin.a11yDevtoolsPlugin

export type { A11yDevtoolsSolidInit } from './A11yDevtools'
