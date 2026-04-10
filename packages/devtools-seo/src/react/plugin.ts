import { createReactPlugin } from '@tanstack/devtools-utils/react'
import { SeoDevtoolsPanel } from './SeoDevtools'

const [seoDevtoolsPlugin, seoDevtoolsNoOpPlugin] = createReactPlugin({
  name: 'TanStack SEO',
  Component: SeoDevtoolsPanel,
})

export { seoDevtoolsPlugin, seoDevtoolsNoOpPlugin }
