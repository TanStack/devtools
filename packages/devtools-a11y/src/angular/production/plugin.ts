import { createAngularPlugin } from '@tanstack/devtools-utils/angular'
import { A11yDevtoolsPanel } from './A11yDevtools'

const [a11yDevtoolsPlugin] = createAngularPlugin({
  name: 'TanStack A11y',
  render: A11yDevtoolsPanel,
})

export { a11yDevtoolsPlugin }
