/** @jsxImportSource solid-js */

import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { SeoTab } from './seo-tab'

type SeoPluginPanelProps = {
  theme: 'light' | 'dark'
  devtoolsOpen: boolean
}

export default function SeoDevtoolsSolidPanel(props: SeoPluginPanelProps) {
  void props.devtoolsOpen

  return (
    <ThemeContextProvider theme={props.theme}>
      <SeoTab />
    </ThemeContextProvider>
  )
}
