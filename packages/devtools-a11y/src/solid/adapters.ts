/** @jsxImportSource solid-js */

import { createSolidPanel, createSolidPlugin } from '@tanstack/devtools-utils/solid'
import { createA11yDevtoolsCoreClass } from '../core/create-core-class'
import type { A11yPluginOptions } from '../types'

export function createA11yDevtoolsSolidPanel(options: A11yPluginOptions = {}) {
  const CoreClass = createA11yDevtoolsCoreClass(options)
  return createSolidPanel(CoreClass)
}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] = createA11yDevtoolsSolidPanel()

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }

export function createA11yDevtoolsSolidPlugin(options: A11yPluginOptions = {}) {
  const [Panel] = createA11yDevtoolsSolidPanel(options)
  return createSolidPlugin({
    Component: Panel,
    name: 'Accessibility',
    id: 'devtools-a11y',
  })
}

const [a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin] =
  createA11yDevtoolsSolidPlugin()

export { a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin }
