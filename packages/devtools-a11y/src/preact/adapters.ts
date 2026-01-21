import {
  createPreactPanel,
  createPreactPlugin,
} from '@tanstack/devtools-utils/preact'
import { createA11yDevtoolsCoreClass } from '../core/create-core-class'
import type { A11yPluginOptions } from '../types'

export function createA11yDevtoolsPreactPanel(options: A11yPluginOptions = {}) {
  const CoreClass = createA11yDevtoolsCoreClass(options)
  return createPreactPanel(CoreClass)
}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] =
  createA11yDevtoolsPreactPanel()

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }

export function createA11yDevtoolsPreactPlugin(options: A11yPluginOptions = {}) {
  const [Panel] = createA11yDevtoolsPreactPanel(options)
  return createPreactPlugin({
    Component: Panel,
    name: 'Accessibility',
    id: 'devtools-a11y',
  })
}

const [a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin] =
  createA11yDevtoolsPreactPlugin()

export { a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin }
