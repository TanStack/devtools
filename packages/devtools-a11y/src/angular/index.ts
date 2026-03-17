'use client'

import { isDevMode } from '@angular/core'
import * as Devtools from './A11yDevtools'
import * as plugin from './plugin'

export const A11yDevtoolsPanel = !isDevMode()
  ? Devtools.A11yDevtoolsPanelNoOp
  : Devtools.A11yDevtoolsPanel

export const a11yDevtoolsPlugin = !isDevMode()
  ? plugin.a11yDevtoolsNoOpPlugin
  : plugin.a11yDevtoolsPlugin

export type { A11yDevtoolsAngularInit } from './A11yDevtools'
