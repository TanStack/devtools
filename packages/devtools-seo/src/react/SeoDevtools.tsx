import { createReactPanel } from '@tanstack/devtools-utils/react'
import { SeoDevtoolsCore } from '../core'

import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/react'

export interface SeoDevtoolsReactInit extends DevtoolsPanelProps {}

const [SeoDevtoolsPanel, SeoDevtoolsPanelNoOp] =
  createReactPanel(SeoDevtoolsCore)

export { SeoDevtoolsPanel, SeoDevtoolsPanelNoOp }
