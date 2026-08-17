import { createReactPlugin } from '@tanstack/devtools-utils/react'
import { startReactScan } from './core/scan'
import { ReactScanDevtoolsPanel } from './panel'
import type { ReactScanDevtoolsOptions } from './core/types'

const [createPlugin, createNoOpPlugin] = createReactPlugin({
  name: 'React Scan',
  id: 'react-scan',
  Component: ReactScanDevtoolsPanel,
})

export function reactScanDevtoolsPlugin(options?: ReactScanDevtoolsOptions) {
  startReactScan(options)
  return createPlugin()
}

export function reactScanDevtoolsNoOpPlugin(
  _options?: ReactScanDevtoolsOptions,
) {
  return createNoOpPlugin()
}
