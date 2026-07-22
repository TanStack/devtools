import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import App from './App'

function Root() {
  return (
    <>
      <App />
      <TanStackDevtools eventBusConfig={{ connectToServerBus: true }} />
    </>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Root />)
