import { createVuePanel } from '@tanstack/devtools-utils/vue'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/vue'
import { A11yDevtoolsCore } from '../core/A11yDevtoolsCore'
import type { A11yPluginOptions } from '../types'

export interface A11yDevtoolsVueInit extends DevtoolsPanelProps {
  options?: A11yPluginOptions
}

class A11yDevtoolsVueCore extends A11yDevtoolsCore {
  constructor(props: A11yDevtoolsVueInit) {
    super(props.options ?? {})
  }
}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] =
  createVuePanel(A11yDevtoolsVueCore)

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }

export function createA11yDevtoolsVuePlugin(options: A11yPluginOptions = {}) {
  return {
    id: 'devtools-a11y',
    name: 'Accessibility',
    component: A11yDevtoolsPanel,
    props: {
      devtoolsProps: {
        options,
      },
    },
  }
}

export function createA11yDevtoolsNoOpVuePlugin() {
  return {
    id: 'devtools-a11y',
    name: 'Accessibility',
    component: A11yDevtoolsPanelNoOp,
    props: {
      devtoolsProps: {
        options: {},
      },
    },
  }
}
