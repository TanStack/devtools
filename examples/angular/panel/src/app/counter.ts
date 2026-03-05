import { DevtoolsEventClient } from './devtools/eventClient'
import { signal } from '@angular/core'

export function createCounter() {
  const count = signal(0)
  const history: Array<number> = []

  return {
    value: () => count(),
    increment: () => {
      count.update((n) => n + 1)
      history.push(count())

      // The emit eventSuffix must match that of the EventMap defined in eventClient.ts
      DevtoolsEventClient.emit('counter-state', {
        count: count(),
        history,
      })
    },
    decrement: () => {
      count.update((n) => n - 1)
      history.push(count())

      DevtoolsEventClient.emit('counter-state', {
        count: count(),
        history,
      })
    },
  }
}
