import { createReactPanel } from '@tanstack/devtools-utils/react'
import { ReactScanDevtoolsCore } from '../core'

const [ReactScanDevtoolsPanel] = createReactPanel(ReactScanDevtoolsCore)

export { ReactScanDevtoolsPanel }
