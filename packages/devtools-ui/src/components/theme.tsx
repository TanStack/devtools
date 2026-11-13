import {
  createContext,
  createSignal,
  useContext as getContext,
  onSettled,
} from 'solid-js'
import { ensureDevtoolsStyles } from '../styles/semantic-theme'
import type { Accessor } from 'solid-js'
import type { JSX } from '@solidjs/web'

export type TanStackDevtoolsTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Accessor<TanStackDevtoolsTheme>
  setTheme: (theme: TanStackDevtoolsTheme) => void
}
const ThemeContext = createContext<ThemeContextValue>()

export const ThemeContextProvider = (props: {
  children: JSX.Element
  theme: TanStackDevtoolsTheme
}) => {
  // Follows `props.theme`, and `setTheme` overrides it until the prop changes.
  const [theme, setTheme] = createSignal<TanStackDevtoolsTheme>(
    () => props.theme,
  )
  let container: HTMLSpanElement | undefined
  onSettled(() => {
    if (container) ensureDevtoolsStyles(container.ownerDocument)
  })
  return (
    <ThemeContext value={{ theme, setTheme }}>
      <span ref={container} style={{ display: 'contents' }}>
        {props.children}
      </span>
    </ThemeContext>
  )
}

export function createTheme() {
  return getContext(ThemeContext)
}
