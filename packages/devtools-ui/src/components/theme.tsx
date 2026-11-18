import {
  createContext,
  createEffect,
  createSignal,
  useContext as getContext,
} from 'solid-js'
import { ensureDevtoolsStyles } from '../styles/semantic-theme'
import type { Accessor, JSX } from 'solid-js'

export type TanStackDevtoolsTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Accessor<TanStackDevtoolsTheme>
  setTheme: (theme: TanStackDevtoolsTheme) => void
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeContextProvider = (props: {
  children: JSX.Element
  theme: TanStackDevtoolsTheme
}) => {
  const [theme, setTheme] = createSignal<TanStackDevtoolsTheme>(props.theme)
  createEffect(() => {
    setTheme(props.theme)
  })
  const [container, setContainer] = createSignal<HTMLSpanElement>()
  createEffect(() => {
    const element = container()
    if (element) ensureDevtoolsStyles(element.ownerDocument)
  })
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <span ref={setContainer} style={{ display: 'contents' }}>
        {props.children}
      </span>
    </ThemeContext.Provider>
  )
}

export function createTheme() {
  const context = getContext(ThemeContext)
  if (!context) {
    throw new Error('createTheme must be used within a ThemeContextProvider')
  }

  return context
}
