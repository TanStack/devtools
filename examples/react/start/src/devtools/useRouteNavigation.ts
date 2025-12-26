import { routeNavigationEventClient } from './route-navigation-event-client'

/**
 * Emits a route navigation event to the devtools.
 * Call this function inside your route loader to track navigations.
 *
 * @param routeName - A friendly name for the route (e.g., "Home", "User Profile")
 * @param routePath - The path of the route
 * @param options - Optional params and search data
 */
export function emitRouteNavigation(
  routeName: string,
  routePath: string,
  options?: {
    params?: Record<string, string>
    search?: Record<string, unknown>
  },
) {
  // Only emit in development
  if (process.env.NODE_ENV !== 'development') return

  routeNavigationEventClient.emit('navigate', {
    routePath,
    routeName,
    timestamp: Date.now(),
    params: options?.params,
    search: options?.search,
  })
}
