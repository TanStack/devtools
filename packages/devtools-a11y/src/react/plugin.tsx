import { createReactPlugin } from '@tanstack/devtools-utils/react'
import { A11yDevtoolsPanel } from './A11yDevtools'

const [a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin] = createReactPlugin({
  name: 'TanStack A11y',
  Component: A11yDevtoolsPanel,
})

export { a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin }
