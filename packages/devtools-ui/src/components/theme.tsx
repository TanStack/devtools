import { createContext, createEffect, createSignal, useContext } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

export type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Accessor<Theme>
  setTheme: (theme: Theme) => void
}
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeContextProvider = (props: {
  children: JSX.Element
  theme: Theme
}) => {
  const [theme, setTheme] = createSignal<Theme>(props.theme)
  createEffect(() => {
    setTheme(props.theme)
  })
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }

  return context
}
