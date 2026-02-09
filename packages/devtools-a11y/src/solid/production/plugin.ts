import { createSolidPlugin } from '@tanstack/devtools-utils/solid'
import { A11yDevtoolsPanel } from './A11yDevtools'

const [a11yDevtoolsPlugin] = createSolidPlugin({
  name: 'TanStack A11y',
  Component: A11yDevtoolsPanel,
})

export { a11yDevtoolsPlugin }
