import { useEffect, useState } from 'preact/hooks'
import { DevtoolsEventClient } from './eventClient.ts'

export default function CustomDevtoolPanel() {
  const [state, setState] = useState<
    { count: number; history: Array<number> } | undefined
  >()

  useEffect(() => {
    // subscribe to the emitted event
    const cleanup = DevtoolsEventClient.on('counter-state', (e) =>
      setState(e.payload),
    )
    return cleanup
  }, [])

  return (
    <div>
      <div>counter state: {state?.count}</div>
      <div>counter history: {JSON.stringify(state?.history)}</div>
    </div>
  )
}
