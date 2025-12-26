import { EventClient } from '@tanstack/devtools-event-client'

export interface RouteNavigationEvent {
  routePath: string
  routeName: string
  timestamp: number
  params?: Record<string, string>
  search?: Record<string, unknown>
}

type RouteNavigationEventMap = {
  'route-navigation:navigate': RouteNavigationEvent
  'route-navigation:clear': undefined
}

class RouteNavigationEventClient extends EventClient<
  RouteNavigationEventMap,
  'route-navigation'
> {
  constructor() {
    super({
      pluginId: 'route-navigation',
    })
  }
}

export const routeNavigationEventClient = new RouteNavigationEventClient()
