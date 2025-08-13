import { createRoot } from 'react-dom/client'
import { useStore } from 'zustand'
import Devtools from './setup'
import { store } from './zustand-client'

function App() {
  const { count, increment, decrement } = useStore(store);
  return (
    <div>
      <h1>Zustand time-travel</h1>
      <h2>Current count: {count}</h2>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <Devtools />
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
