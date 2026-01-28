import { lazy } from 'solid-js'
import { constructCoreClass } from '@tanstack/devtools-utils/solid'

const Component = lazy(() => import('./components'))

export interface A11yDevtoolsInit {}

const [A11yDevtoolsCore, A11yDevtoolsCoreNoOp] = constructCoreClass(Component)

export { A11yDevtoolsCore, A11yDevtoolsCoreNoOp }
