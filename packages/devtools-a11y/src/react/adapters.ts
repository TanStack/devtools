import {
  createReactPanel,
  createReactPlugin,
} from '@tanstack/devtools-utils/react'
import { createA11yDevtoolsCoreClass } from '../core/create-core-class'
import type { A11yPluginOptions } from '../types'

export function createA11yDevtoolsReactPanel(options: A11yPluginOptions = {}) {
  const CoreClass = createA11yDevtoolsCoreClass(options)
  return createReactPanel(CoreClass)
}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] =
  createA11yDevtoolsReactPanel()

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }

export function createA11yDevtoolsReactPlugin(options: A11yPluginOptions = {}) {
  const [Panel] = createA11yDevtoolsReactPanel(options)
  return createReactPlugin({
    Component: Panel,
    name: 'Accessibility',
    id: 'devtools-a11y',
  })
}

const [a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin] =
  createA11yDevtoolsReactPlugin()

export { a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin }
