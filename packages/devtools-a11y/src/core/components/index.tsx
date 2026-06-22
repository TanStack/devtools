/** @jsxImportSource solid-js */
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { AllyProvider } from '../contexts/allyContext'
import { Shell } from './Shell'

import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'

interface DevtoolsProps {
  theme: TanStackDevtoolsTheme
}

export default function Devtools(props: DevtoolsProps) {
  return (
    <ThemeContextProvider theme={props.theme}>
      <AllyProvider>
        <Shell />
      </AllyProvider>
    </ThemeContextProvider>
  )
}
