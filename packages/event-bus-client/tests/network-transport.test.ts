// @vitest-environment node
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { EventClient } from '../src'

describe('EventClient network transport detection', () => {
  beforeEach(() => {
    // Ensure no global event target (simulating isolated worker)
    globalThis.__TANSTACK_EVENT_TARGET__ = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not activate network transport when placeholders are not replaced', () => {
    // Without Vite plugin, __TANSTACK_DEVTOOLS_PORT__ is undefined
    const client = new EventClient({
      pluginId: 'test-no-network',
      debug: false,
    })
    // Client should fall back to local EventTarget (no network)
    // Emitting should not throw
    client.emit('event', { foo: 'bar' })
  })
})
