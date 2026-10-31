import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  // enhanced-logs has something to transform
  console.log('React Rspack example mounted, count =', count)

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>TanStack Devtools React + Rspack Example</h1>
      <p>Current count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  )
}
