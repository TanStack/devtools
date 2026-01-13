import { EventClient } from '@tanstack/devtools-event-client'
import { A11Y_PLUGIN_ID } from './types'
import type { A11yEventMap } from './types'

/**
 * Event client for the A11y devtools plugin.
 * Handles communication between the devtools panel and the page.
 */
class A11yEventClient extends EventClient<A11yEventMap> {
  constructor() {
    super({
      pluginId: A11Y_PLUGIN_ID,
      debug: process.env.NODE_ENV === 'development',
    })
  }
}

/**
 * Singleton instance of the A11y event client.
 * Use this to emit and listen for a11y-related events.
 */
export const a11yEventClient = new A11yEventClient()
