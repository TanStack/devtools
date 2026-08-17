import { createReactPanel } from '@tanstack/devtools-utils/react'
import { ReactScanDevtoolsCore } from './core'

const [ReactScanDevtoolsPanel, ReactScanDevtoolsPanelNoOp] = createReactPanel(
  ReactScanDevtoolsCore,
)

export { ReactScanDevtoolsPanel, ReactScanDevtoolsPanelNoOp }
