/** @jsxImportSource solid-js */

import { constructCoreClass } from '@tanstack/devtools-utils/solid'

const [ReactScanDevtoolsCore] = constructCoreClass(() => import('./components'))

export { ReactScanDevtoolsCore }
