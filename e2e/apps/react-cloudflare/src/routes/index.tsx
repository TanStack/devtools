import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <>
      <h1>devtools e2e start</h1>
      <button onClick={() => fetch('/emit-server-ping')}>emit server</button>
    </>
  )
}
