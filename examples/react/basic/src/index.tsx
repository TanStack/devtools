import { createRoot } from 'react-dom/client'
import Devtools from './setup'

function App() {
  return (
    <div>
      <h1>TanStack Devtools Basic Example</h1>
      <Devtools />
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
