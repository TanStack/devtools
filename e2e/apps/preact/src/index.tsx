import { render } from 'preact'
import { TanStackDevtools } from '@tanstack/preact-devtools'

function App() {
  return (
    <>
      <h1>preact e2e</h1>
      <TanStackDevtools
        plugins={[
          {
            name: 'Demo',
            render: () => (
              <div data-testid="demo-plugin">demo plugin content</div>
            ),
          },
        ]}
      />
    </>
  )
}

render(<App />, document.getElementById('root')!)
