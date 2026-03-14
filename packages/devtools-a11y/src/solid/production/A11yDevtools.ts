import { createSolidPanel } from '@tanstack/devtools-utils/solid'
import { A11yDevtoolsCore } from '../../core'

import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/solid'

const [A11yDevtoolsPanel] = createSolidPanel(A11yDevtoolsCore)

export interface A11yDevtoolsSolidInit extends DevtoolsPanelProps {}

export { A11yDevtoolsPanel }
