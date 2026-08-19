'use client'

import * as Devtools from './panel'
import * as plugin from './plugin'

export const ReactScanDevtoolsPanel =
  process.env.NODE_ENV !== 'development'
    ? Devtools.ReactScanDevtoolsPanelNoOp
    : Devtools.ReactScanDevtoolsPanel

export const reactScanDevtoolsPlugin =
  process.env.NODE_ENV !== 'development'
    ? plugin.reactScanDevtoolsNoOpPlugin
    : plugin.reactScanDevtoolsPlugin

export type { ReactScanDevtoolsOptions } from './core/types'
