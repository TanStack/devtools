import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientEventBus } from '@tanstack/devtools-event-bus/client'
import { EventClient } from '../src'

// client bus uses window to dispatch events
const clientBusEmitTarget = window

describe('EventClient', () => {
  let bus: ClientEventBus

  beforeEach(() => {
    // Create a fresh bus for each test to ensure isolation
    bus = new ClientEventBus()
    bus.start()
  })

  afterEach(() => {
    // Clean up after each test
    bus.stop()
  })

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
      // Wait for bus to fully stop
      await new Promise((resolve) => setTimeout(resolve, 50))

      const client = new EventClient({
        debug: false,
        pluginId: 'test-queued',
        reconnectEveryMs: 50,
      })
      const eventHandler = vi.fn()
      client.on('event', eventHandler)

      // Start bus first, then emit (to ensure bus is ready)
      bus.start()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Now emit - this will queue and trigger connection
      client.emit('event', { foo: 'bar' })

      // wait for connection to establish and queued events to be emitted
      await new Promise((resolve) => setTimeout(resolve, 300))
      expect(eventHandler).toHaveBeenCalledWith({
        type: 'test-queued:event',
        payload: { foo: 'bar' },
        pluginId: 'test-queued',
      })
    })

    it('should queue multiple events and emit them all when connected', async () => {
      // Skipping: Test isolation issue - receiving events from other tests
      // The ClientEventBus dispatches to global window events which persist across tests
      // This needs a more robust cleanup mechanism
      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const client = new EventClient({
        debug: false,
        pluginId: 'test-queue-multi-unique',
        reconnectEveryMs: 50,
      })
      const eventHandler = vi.fn()
      const cleanup = client.on('event', eventHandler)

      // Start bus FIRST, wait for it to be ready
      bus.start()
      await new Promise((resolve) => setTimeout(resolve, 100))

      // NOW emit multiple events (they'll queue and then connect)
      client.emit('event', { count: 1 })
      client.emit('event', { count: 2 })
      client.emit('event', { count: 3 })

      // Wait for connection and all queued events to be emitted
      await new Promise((resolve) => setTimeout(resolve, 300))

      // All 3 events should have been received
      expect(eventHandler).nthCalledWith(1, {
        type: 'test-queue-multi-unique:event',
        payload: { count: 1 },
        pluginId: 'test-queue-multi-unique',
      })
      expect(eventHandler).nthCalledWith(2, {
        type: 'test-queue-multi-unique:event',
        payload: { count: 2 },
        pluginId: 'test-queue-multi-unique',
      })
      expect(eventHandler).nthCalledWith(3, {
        type: 'test-queue-multi-unique:event',
        payload: { count: 3 },
        pluginId: 'test-queue-multi-unique',
      })

      cleanup()
    })
  })

  describe('emitting to internal event target', () => {
    it('should initialize and dispatch events to the internal event target', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test-internal',
      })
      const internalEventHandler = vi.fn()
      client.on('event', internalEventHandler, {
        withEventTarget: true,
      })
      client.emit('event', { foo: 'bar' })
      expect(internalEventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-internal:event',
          payload: { foo: 'bar' },
          pluginId: 'test-internal',
        }),
      )
    })
  })

  describe('connecting behavior', () => {
    it('should only attempt connection once when #connecting flag is set', async () => {
      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 50))

      const client = new EventClient({
        debug: false,
        pluginId: 'test-connect',
        reconnectEveryMs: 100,
      })

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      // Emit multiple events rapidly while disconnected
      client.emit('event1', { id: 1 })
      client.emit('event2', { id: 2 })
      client.emit('event3', { id: 3 })
      client.emit('event4', { id: 4 })
      client.emit('event5', { id: 5 })

      // Check that only one 'tanstack-connect' event was dispatched immediately
      const connectCalls = dispatchSpy.mock.calls.filter(
        (call) =>
          call[0] instanceof CustomEvent && call[0].type === 'tanstack-connect',
      )
      // Should be exactly 1 from the first emit (others are blocked by #connecting flag)
      expect(connectCalls.length).toBe(1)

      dispatchSpy.mockRestore()
    })

    it('should stop connect loop after successful connection', async () => {
      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 50))

      const client = new EventClient({
        debug: false,
        pluginId: 'test-stop',
        reconnectEveryMs: 100,
      })

      // Trigger connection attempt
      client.emit('event', { foo: 'bar' })

      // Start bus to allow connection
      bus.start()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Wait for connection to establish
      await new Promise((resolve) => setTimeout(resolve, 200))

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      // Wait for what would be several retry intervals
      await new Promise((resolve) => setTimeout(resolve, 400))

      const connectCalls = dispatchSpy.mock.calls.filter(
        (call) =>
          call[0] instanceof CustomEvent && call[0].type === 'tanstack-connect',
      )

      // Should be 0 because connection was already established
      expect(connectCalls.length).toBe(0)

      dispatchSpy.mockRestore()
    })

    it('should respect max retries limit', async () => {
      // Don't start the bus so connection always fails
      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 50))

      const client = new EventClient({
        debug: false,
        pluginId: 'test-max-retry',
        reconnectEveryMs: 50,
      })

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      // Trigger connection attempt
      client.emit('event', { foo: 'bar' })

      // Wait long enough for max retries (5 attempts at 50ms intervals = 250ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 400))

      const connectCalls = dispatchSpy.mock.calls.filter(
        (call) =>
          call[0] instanceof CustomEvent && call[0].type === 'tanstack-connect',
      )

      // Should have initial + 4 retries = 5 total (max is 5)
      expect(connectCalls.length).toBeLessThanOrEqual(5)

      // Wait longer to ensure no more attempts
      dispatchSpy.mockClear()
      await new Promise((resolve) => setTimeout(resolve, 200))

      const additionalCalls = dispatchSpy.mock.calls.filter(
        (call) =>
          call[0] instanceof CustomEvent && call[0].type === 'tanstack-connect',
      )

      // Should be 0 because max retries reached
      expect(additionalCalls.length).toBe(0)

      dispatchSpy.mockRestore()
    })

    it('should reset connecting flag when connection succeeds and allow new connections', async () => {
      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Create first client and connect it
      const client1 = new EventClient({
        debug: false,
        pluginId: 'test-reset-1',
        reconnectEveryMs: 50,
      })

      // Start bus before emitting so connection succeeds
      bus.start()
      await new Promise((resolve) => setTimeout(resolve, 50))

      // First connection attempt
      client1.emit('event1', { id: 1 })

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Now create a SECOND client (which will need to connect)
      // Stop/start bus to simulate a scenario where new client needs to connect
      bus.stop()
      await new Promise((resolve) => setTimeout(resolve, 50))

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      const client2 = new EventClient({
        debug: false,
        pluginId: 'test-reset-2',
        reconnectEveryMs: 50,
      })

      // This should trigger a new connection attempt for client2
      client2.emit('event2', { id: 2 })

      // Wait a bit for the connection attempt
      await new Promise((resolve) => setTimeout(resolve, 100))

      const connectCalls = dispatchSpy.mock.calls.filter(
        (call) =>
          call[0] instanceof CustomEvent && call[0].type === 'tanstack-connect',
      )

      // Should have connection attempts from client2
      expect(connectCalls.length).toBeGreaterThanOrEqual(1)

      dispatchSpy.mockRestore()
    })
  })

  describe('onAllPluginEvents', () => {
    it('should listen to all events that come from the plugin', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test-all-events',
      })
      const eventHandler = vi.fn()
      client.onAllPluginEvents(eventHandler)
      client.emit('event', { foo: 'bar' })
      client.emit('event2', { foo: 'bar' })
      expect(eventHandler).nthCalledWith(1, {
        type: 'test-all-events:event',
        payload: { foo: 'bar' },
        pluginId: 'test-all-events',
      })
      expect(eventHandler).nthCalledWith(2, {
        type: 'test-all-events:event2',
        payload: { foo: 'bar' },
        pluginId: 'test-all-events',
      })
    })

    it('should ignore events that do not come from the plugin', () => {
      const client = new EventClient({
        debug: false,
        pluginId: 'test-ignore',
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
