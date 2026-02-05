import { createReactPanel } from '@tanstack/devtools-utils/react'
import { A11yDevtoolsCore } from '@tanstack/devtools-a11y/core'

// type
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/react'

export interface A11yDevtoolsReactInit extends DevtoolsPanelProps {}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] =
  createReactPanel(A11yDevtoolsCore)

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }
