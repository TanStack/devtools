import { JsonTree, ThemeContextProvider } from '@tanstack/devtools-ui'
import { render } from 'solid-js/web'

function App() {
  const JsonTreeData = {
    name: 'date format',
    value: { period: 'past', data: new Date() },
  }

  const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

  return (
    <div>
      <ThemeContextProvider theme={darkThemeMq.matches ? 'dark' : 'light'}>
        <JsonTree value={JsonTreeData} config={{ dateFormat: 'DD-MM-YYYY' }} />
      </ThemeContextProvider>
    </div>
  )
}

render(() => <App />, document.getElementById('root')!)
