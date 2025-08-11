import { render } from 'solid-js/web'
import Devtools from './setup'

function App() {
  return (
    <div>
      <h1>TanStack Devtools Solid Basic Example</h1>
      <Devtools />
    </div>
  )
}

render(() => <App />, document.getElementById('root')!)
