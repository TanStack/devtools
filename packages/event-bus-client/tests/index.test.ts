import { describe, expect, it, vi } from 'vitest'
import { ClientEventBus } from '@tanstack/devtools-event-bus/client'
import { EventClient } from '../src'

vi.stubGlobal(
  'BroadcastChannel',
  class {
    postMessage = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    close = vi.fn()
  },
)
// start the client bus for testing
const bus = new ClientEventBus()
bus.start()
// client bus uses window to dispatch events
const clientBusEmitTarget = window
describe('EventClient', () => {
  describe('debug config', () => {
    it('should emit logs when debug set to true and have the correct plugin name', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      new EventClient({
        debug: true,
        pluginId: 'test',
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        '🌴 [tanstack-devtools:test-plugin]',
        ' Initializing event subscription for plugin',
        'test',
      )
    })

    it("shouldn't emit logs when debug set to false", () => {
      const consoleSpy = vi.spyOn(console, 'log')
      new EventClient({
        debug: false,
        pluginId: 'test',
      })
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('getGlobalTarget', () => {
    it('if the global target is set it should re-use it for emitting/listening/removing of events', () => {
      const target = new EventTarget()
      const handleSuccessConnection = vi.fn()
      target.addEventListener('tanstack-connect', () => {
        target.dispatchEvent(new CustomEvent('tanstack-connect-success'))
      })
      globalThis.__TANSTACK_EVENT_TARGET__ = null

      vi.spyOn(
        globalThis,
        '__TANSTACK_EVENT_TARGET__',
        'get',
      ).mockImplementation(() => {
        return target
      })
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const targetEmitSpy = vi.spyOn(target, 'dispatchEvent')
      const targetListenSpy = vi.spyOn(target, 'addEventListener')
      const targetRemoveSpy = vi.spyOn(target, 'removeEventListener')
      const cleanup = client.on('test:event', () => {})
      cleanup()
      client.emit('test:event', { foo: 'bar' })
      expect(targetEmitSpy).toHaveBeenCalledWith(expect.any(Event))
      expect(targetListenSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
      )
      expect(targetRemoveSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
      )
      vi.resetAllMocks()
      target.removeEventListener('tanstack-connect', handleSuccessConnection)
    })
    it('should use the window object if the globalTarget is not set for emitting/listening/removing of events', () => {
      const target = window
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const targetEmitSpy = vi.spyOn(target, 'dispatchEvent')
      const targetListenSpy = vi.spyOn(target, 'addEventListener')
      const targetRemoveSpy = vi.spyOn(target, 'removeEventListener')
      const cleanup = client.on('test:event', () => {})
      cleanup()
      client.emit('test:event', { foo: 'bar' })
      expect(targetEmitSpy).toHaveBeenCalledWith(expect.any(Event))
      expect(targetListenSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
      )
      expect(targetRemoveSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
      )
    })
  })

  describe('on', () => {
    it('should register an event with the pluginId (event => test:event)', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })

      const eventBusSpy = vi.spyOn(clientBusEmitTarget, 'addEventListener')
      client.on('event', () => {})
      expect(eventBusSpy).toHaveBeenCalledWith(
        'test:event',
        expect.any(Function),
      )
    })
    it('should register an event listener for the specified event and get events when they are emitted', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      const cleanup = client.on('event', eventHandler)
      client.emit('event', { foo: 'bar' })
      expect(eventHandler).toHaveBeenCalledWith({
        type: 'test:event',
        payload: { foo: 'bar' },
        pluginId: 'test',
      })
      cleanup()
    })

    it("shouldn't get an event if unregistered before it comes", () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      const cleanup = client.on('event', eventHandler)
      cleanup()
      client.emit('event', { foo: 'bar' })
      expect(eventHandler).not.toHaveBeenCalled()
    })

    it("shouldn't get an event if it's not registered to it", () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      client.on('event', eventHandler)
      client.emit('other_event', { foo: 'bar' })
      expect(eventHandler).not.toHaveBeenCalled()
    })
  })

  describe('emit', () => {
    it('should emit an event with the correct type and payload to the event bus', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      client.on('event', eventHandler)
      client.emit('event', { foo: 'bar' })
      expect(eventHandler).toHaveBeenCalledWith({
        type: 'test:event',
        payload: { foo: 'bar' },
        pluginId: 'test',
      })
    })
  })

  describe('onAll', () => {
    it('should listen to all events even if they do not come from the registered client', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      client.onAll(eventHandler)
      client.emit('event', { foo: 'bar' })
      expect(eventHandler).toHaveBeenCalledWith({
        type: 'test:event',
        payload: { foo: 'bar' },
        pluginId: 'test',
      })
      clientBusEmitTarget.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'other-plugin',
            payload: { foo: 'bar' },
          },
        }),
      )

      expect(eventHandler).lastCalledWith({
        type: 'other-plugin',
        payload: { foo: 'bar' },
      })
    })
  })

  describe('queued events', () => {
    it('emits queued events when connected to the event bus', async () => {
      bus.stop()
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      client.on('event', eventHandler)
      client.emit('event', { foo: 'bar' })

      bus.start()
      // wait to connect to the bus
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(eventHandler).toHaveBeenCalledWith({
        type: 'test:event',
        payload: { foo: 'bar' },
        pluginId: 'test',
      })
    })
  })
  describe('onAllPluginEvents', () => {
    it('should listen to all events that come from the plugin', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      client.onAllPluginEvents(eventHandler)
      client.emit('event', { foo: 'bar' })
      client.emit('event2', { foo: 'bar' })
      expect(eventHandler).nthCalledWith(1, {
        type: 'test:event',
        payload: { foo: 'bar' },
        pluginId: 'test',
      })
      expect(eventHandler).nthCalledWith(2, {
        type: 'test:event2',
        payload: { foo: 'bar' },
        pluginId: 'test',
      })
    })

    it('should ignore events that do not come from the plugin', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test',
      })
      const eventHandler = vi.fn()
      client.onAllPluginEvents(eventHandler)
      clientBusEmitTarget.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', {
          detail: {
            type: 'other-plugin',
            payload: { foo: 'bar' },
          },
        }),
      )
      expect(eventHandler).not.toHaveBeenCalled()
    })
  })
})
