import { EventClient } from '@tanstack/devtools-event-client'

type EventMap = {
  // The key of the event map is a combination of {pluginId}:{eventSuffix}
  // The value is the expected type of the event payload
  'custom-devtools:counter-state': { count: number; history: Array<number> }
}

class CustomEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      // The pluginId must match that of the event map key
      pluginId: 'custom-devtools',
      debug: true,
    })
  }
}

// This is where the magic happens, it'll be used throughout your application.
export const DevtoolsEventClient = new CustomEventClient()
