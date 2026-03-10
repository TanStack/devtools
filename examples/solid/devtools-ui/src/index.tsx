import { createEffect, createSignal } from 'solid-js'
import { render } from 'solid-js/web'

import { JsonTree, ThemeContextProvider } from '@tanstack/devtools-ui'

import './index.css'

const JsonTreeDate = {
  name: 'date format',
  value: { period: 'past', data: new Date() },
  isoValue: new Date().toISOString(),
}

const JsonTreePath = {
  name: 'path collapse',
  foo: { bar: 'foo' },
  test: [[], [['hi']]],
}

const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

function App() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>(
    darkThemeMq.matches ? 'dark' : 'light',
  )

  createEffect(() => {
    document.documentElement.setAttribute('data-theme', theme())
  })

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div class="app-shell">
      <button type="button" class="theme-toggle" onClick={toggleTheme}>
        Toggle theme ({theme()})
      </button>

      <ThemeContextProvider theme={theme()}>
        <h1>Json tree - dates</h1>

        <div class="json-tree-container">
          <JsonTree
            value={JsonTreeDate}
            config={{ dateFormat: 'DD-MM-YYYY' }}
          />
        </div>

        <h1>Json tree - paths</h1>

        <div class="json-tree-container">
          <JsonTree value={JsonTreePath} collapsePaths={['foo']} />
        </div>
      </ThemeContextProvider>
    </div>
  )
}

const root = document.getElementById('root')
if (root) render(() => <App />, root)
