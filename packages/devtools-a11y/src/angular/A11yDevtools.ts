import { createAngularPanel } from '@tanstack/devtools-utils/angular'
import { A11yDevtoolsCore } from '../core'

// type
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/angular'

export interface A11yDevtoolsAngularInit extends DevtoolsPanelProps {}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] =
  createAngularPanel(A11yDevtoolsCore)

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }
