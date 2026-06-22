import { describe, expect, it, vi } from 'vitest'
import { EventClientNoOp } from '../src/noop'
import { EventClient as RootEventClient } from '../src'

type TestEvents = {
  event: { foo: string }
}

describe('EventClientNoOp', () => {
  it('emit does not dispatch to the window bus and does not throw', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const client = new EventClientNoOp<TestEvents>({ pluginId: 'test' })
    expect(() => client.emit('event', { foo: 'bar' })).not.toThrow()
    expect(dispatchSpy).not.toHaveBeenCalled()
    dispatchSpy.mockRestore()
  })

  it('on/onAll/onAllPluginEvents return a callable no-op cleanup and never invoke the callback', () => {
    const client = new EventClientNoOp<TestEvents>({ pluginId: 'test' })
    const cb = vi.fn()

    const off = client.on('event', cb)
    const offAll = client.onAll(cb)
    const offPlugin = client.onAllPluginEvents(cb)

    client.emit('event', { foo: 'bar' })

    expect(cb).not.toHaveBeenCalled()
    expect(() => {
      off()
      offAll()
      offPlugin()
    }).not.toThrow()
  })

  it('getPluginId returns the configured id', () => {
    const client = new EventClientNoOp<TestEvents>({ pluginId: 'test' })
    expect(client.getPluginId()).toBe('test')
  })

  it('createEventPayload returns the namespaced payload object', () => {
    const client = new EventClientNoOp<TestEvents>({ pluginId: 'test' })
    expect(client.createEventPayload('event', { foo: 'bar' })).toEqual({
      type: 'test:event',
      payload: { foo: 'bar' },
      pluginId: 'test',
    })
  })
})

describe('root export (resolver)', () => {
  it('resolves to the no-op outside development (vitest NODE_ENV="test")', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    const client = new RootEventClient<TestEvents>({ pluginId: 'test' })
    client.emit('event', { foo: 'bar' })
    expect(dispatchSpy).not.toHaveBeenCalled()
    dispatchSpy.mockRestore()
  })

  it('supports extension as a base class with full typing', () => {
    class Extended extends RootEventClient<TestEvents> {
      constructor() {
        super({ pluginId: 'extended' })
      }
    }
    const ext = new Extended()
    expect(ext.getPluginId()).toBe('extended')
  })
})
