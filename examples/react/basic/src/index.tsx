import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import Devtools from './setup'
import { queryPlugin } from './plugin'

setTimeout(() => {
  queryPlugin.emit('test', {
    title: 'Test Event',
    description:
      'This is a test event from the TanStack Query Devtools plugin.',
  })
}, 1000)

queryPlugin.on('test', (event) => {
  console.log('Received test event:', event)
})

function App() {
  const [value, setValue] = useState<any>({
    initial: 'value',
    should: 'change',
    in: 2,
    array: [1, 2, 3],
  })
  useEffect(() => {
    setTimeout(() => {
      setValue({ title: 'Test Event', description: 'This is a test event.' })
    }, 2000)
  }, [])
  // console.log('Current value:', value)
  return (
    <div>
      <h1>TanStack Devtools React Basic Example</h1>
      <tsd-json-tree value={JSON.stringify(value)} />
      <Devtools />
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
