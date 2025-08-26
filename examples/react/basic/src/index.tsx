import { createRoot } from 'react-dom/client'
import Devtools from './setup'
import { queryPlugin } from './plugin'
import { Button } from './button'
import { Feature } from './feature'
import { createContext, useContext, useState } from 'react'
import { createPortal } from 'react-dom'


const Context = createContext<{ count: number, setCount: (count: number) => void }>({ count: 0, setCount: () => { } })

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

function Mounted() {
  const c = useContext(Context)
  console.log(c);
  return <p onClick={() => {
    c.setCount(c.count + 1)
  }}>
    {c.count}
    <hr />
  </p>
}

function App() {
  const [state, setState] = useState(1)
  const [win, setWin] = useState<Window | null>(null)
  return (
    <div>
      <Context.Provider value={{ count: state, setCount: setState }}>
        <h1>TanStack Devtools React Basic Example</h1>
        current count: {state}
        <Button onClick={() => setState(state + 1)}>Click me</Button>
        <Button onClick={() => setWin(window.open('', "", "popup"))}>Click me to open new window</Button>
        {win && createPortal(<Mounted />, win.document.body)}
        <Feature />
        <Devtools />
      </Context.Provider>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
