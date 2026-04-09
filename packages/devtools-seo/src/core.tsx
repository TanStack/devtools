/** @jsxImportSource solid-js */

import { constructCoreClass } from '@tanstack/devtools-utils/solid'

const [SeoDevtoolsCore, SeoDevtoolsCoreNoOp] = constructCoreClass(
  () => import('./solid-panel'),
)

export { SeoDevtoolsCore, SeoDevtoolsCoreNoOp }
