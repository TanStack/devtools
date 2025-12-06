import { useState } from 'preact/hooks'

import { createCounter } from './counter'

const counterInstance = createCounter()

export default function App() {
  const [count, setCount] = useState(counterInstance.getCount())

  const increment = () => {
    counterInstance.increment()
    setCount(counterInstance.getCount())
  }

  const decrement = () => {
    counterInstance.decrement()
    setCount(counterInstance.getCount())
  }

  return (
    <div>
      <h1>Custom plugins</h1>
      <h2>Count: {count}</h2>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={increment}>+ increase</button>
        <button onClick={decrement}>− decrease</button>
      </div>
    </div>
  )
}
