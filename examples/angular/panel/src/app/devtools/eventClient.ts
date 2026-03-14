import { EventClient } from '@tanstack/devtools-event-client'

type EventMap = {
  'counter-state': { count: number; history: Array<number> }
}

class CustomEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'custom-devtools',
      debug: true,
    })
  }
}

// This is where the magic happens, it'll be used throughout your application.
export const DevtoolsEventClient = new CustomEventClient()
