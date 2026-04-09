/** @jsxImportSource solid-js */

import { constructCoreClass } from '@tanstack/devtools-utils/solid'

const [SeoDevtoolsCore] = constructCoreClass(() => import('./solid-panel'))

export { SeoDevtoolsCore }
