/** @jsxImportSource solid-js */

import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { Shell } from './Shell'
import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'

export default function Devtools(props: { theme: TanStackDevtoolsTheme }) {
  return (
    <ThemeContextProvider theme={props.theme}>
      <Shell />
    </ThemeContextProvider>
  )
}
