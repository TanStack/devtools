import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClientEventBus } from '../src/client'

vi.stubGlobal(
  'BroadcastChannel',
  class {
    postMessage = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    close = vi.fn()
  }
)
describe('ClientEventBus', () => {
  describe('debug', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })
    it('should log events to the console when debug set to true', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
      const clientBus = new ClientEventBus({ debug: true })
      clientBus.start()

      expect(logSpy).toHaveBeenCalledWith(
        '🌴 [tanstack-devtools:client-bus]',
        'Initializing client event bus',
      )
      logSpy.mockRestore()
      clientBus.stop()
    })

    it('should not log events to the console when debug set to false', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
      const clientBus = new ClientEventBus({ debug: false })
      clientBus.start()

      expect(logSpy).not.toHaveBeenCalled()
      logSpy.mockRestore()
      clientBus.stop()
    })
  })
  it('should emit events to a subscribed listener', () => {
    const clientBus = new ClientEventBus()
    clientBus.start()
    const handler = vi.fn()
    window.addEventListener('test:event', handler)

    window.dispatchEvent(
      new CustomEvent('tanstack-dispatch-event', {
        detail: {
          type: 'test:event',
          payload: { foo: 'bar' },
        },
      }),
    )
    expect(handler).toHaveBeenCalled()
    clientBus.stop()
  })

  it('should emit events to listeners that are subscribed', () => {
    const clientBus = new ClientEventBus()
    clientBus.start()
    const handler = vi.fn()
    window.addEventListener('test:event', handler)
    const secondHandler = vi.fn()
    window.addEventListener('test:event', secondHandler)

    window.dispatchEvent(
      new CustomEvent('tanstack-dispatch-event', {
        detail: {
          type: 'test:event',
          payload: { foo: 'bar' },
        },
      }),
    )
    expect(handler).toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalled()
    clientBus.stop()
  })

  it('should emit events to global listeners when they are subscribed', () => {
    const clientBus = new ClientEventBus()
    clientBus.start()
    const handler = vi.fn()
    window.addEventListener('tanstack-devtools-global', handler)

    window.dispatchEvent(
      new CustomEvent('tanstack-dispatch-event', {
        detail: {
          type: 'test:event',
          payload: { foo: 'bar' },
        },
      }),
    )
    expect(handler).toHaveBeenCalled()
    clientBus.stop()
  })
})
