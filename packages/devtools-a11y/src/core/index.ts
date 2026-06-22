'use client'

import * as Devtools from './core'

export const A11yDevtoolsCore =
  process.env.NODE_ENV !== 'development'
    ? Devtools.A11yDevtoolsCoreNoOp
    : Devtools.A11yDevtoolsCore

export type { A11yDevtoolsInit } from './core'
