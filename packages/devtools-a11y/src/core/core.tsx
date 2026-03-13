/** @jsxImportSource solid-js */

import { constructCoreClass } from '@tanstack/devtools-utils/solid'

export interface A11yDevtoolsInit {}

const [A11yDevtoolsCore, A11yDevtoolsCoreNoOp] = constructCoreClass(() => import('./components'))

export { A11yDevtoolsCore, A11yDevtoolsCoreNoOp }
