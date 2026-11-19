import { createSignal, onCleanup, onMount } from 'solid-js'
import { render } from 'solid-js/web'
import { TanStackDevtools } from '@tanstack/solid-devtools'

declare global {
  interface Window {
    demoPluginCleanedUp?: boolean
    demoPluginConnectedOnMount?: boolean
  }
}

function DemoPlugin() {
  const [count, setCount] = createSignal(0)
  const [text, setText] = createSignal('')
  let input!: HTMLInputElement
  // The plugin's nodes must be in the page when onMount runs.
  onMount(() => {
    window.demoPluginConnectedOnMount = input.isConnected
  })
  onCleanup(() => {
    window.demoPluginCleanedUp = true
  })
  return (
    <>
      <button data-testid="demo-plugin" onClick={() => setCount(count() + 1)}>
        clicks: {count()}
      </button>
      <input
        ref={input}
        aria-label="Search"
        data-testid="demo-input"
        onInput={(event) => setText(event.currentTarget.value)}
      />
      {/* A sibling that changes on each key press. */}
      {text()}
    </>
  )
}

function App() {
  return (
    <>
      <h1>solid 1 e2e</h1>
      <TanStackDevtools
        plugins={[
          {
            id: 'demo',
            name: 'Demo',
            render: () => <DemoPlugin />,
          },
        ]}
      />
    </>
  )
}

render(() => <App />, document.getElementById('root')!)
