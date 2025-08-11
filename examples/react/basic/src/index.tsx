import { createRoot } from 'react-dom/client'
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
  return (
    <div>
      <h1>TanStack Devtools React Basic Example</h1>
      <Devtools />
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
