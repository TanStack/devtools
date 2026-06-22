import { render } from 'solid-js/web'
import { TanStackDevtools } from '@tanstack/solid-devtools'

function DemoPlugin() {
  return <div data-testid="demo-plugin">demo plugin content</div>
}

function App() {
  return (
    <>
      <h1>solid e2e</h1>
      <TanStackDevtools
        plugins={[
          {
            name: 'Demo',
            render: <DemoPlugin />,
          },
        ]}
      />
    </>
  )
}

render(() => <App />, document.getElementById('root')!)
