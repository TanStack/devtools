// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { createNetworkTransportClient } from '../src/plugin'

describe('EventClient network transport emit', () => {
  let serverBus: ServerEventBus
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    process.env.NODE_ENV = 'development'
  })

  afterEach(async () => {
    serverBus?.stop()
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    process.env.NODE_ENV = originalNodeEnv
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('should emit events to ServerEventBus via WebSocket when using network transport', async () => {
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client = createNetworkTransportClient({
      pluginId: 'test-network',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    const received = new Promise<any>((resolve) => {
      serverEventTarget.addEventListener('test-network:event', (e) => {
        resolve((e as CustomEvent).detail)
      })
    })

    client.emit('event', { hello: 'world' })

    const event = await Promise.race([
      received,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ])

    expect(event.type).toBe('test-network:event')
    expect(event.payload).toEqual({ hello: 'world' })
    expect(event.source).toBe('server-bridge')

    client.destroy()
  })

  it('should receive events from ServerEventBus via WebSocket', async () => {
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client = createNetworkTransportClient({
      pluginId: 'test-receive',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    const received = new Promise<any>((resolve) => {
      client.on('incoming', (event) => resolve(event))
    })

    // Trigger emit to force WebSocket connection
    client.emit('ping', {})
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Dispatch event from server side
    serverEventTarget.dispatchEvent(
      new CustomEvent('tanstack-dispatch-event', {
        detail: {
          type: 'test-receive:incoming',
          payload: { msg: 'from-server' },
          pluginId: 'test-receive',
        },
      }),
    )

    const event = await Promise.race([
      received,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ])

    expect(event.type).toBe('test-receive:incoming')
    expect(event.payload).toEqual({ msg: 'from-server' })

    client.destroy()
  })

  it('should not receive its own echoed events', async () => {
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client = createNetworkTransportClient({
      pluginId: 'test-dedup',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    const receivedEvents: Array<any> = []
    client.on('event', (e) => receivedEvents.push(e))

    client.emit('event', { data: 'test' })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(receivedEvents.length).toBe(0)

    client.destroy()
  })

  it('should queue events during connection and flush when connected', async () => {
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client = createNetworkTransportClient({
      pluginId: 'test-queue',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    const received: Array<any> = []
    serverEventTarget.addEventListener('test-queue:event', (e) => {
      received.push((e as CustomEvent).detail)
    })

    client.emit('event', { n: 1 })
    client.emit('event', { n: 2 })
    client.emit('event', { n: 3 })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    expect(received.length).toBe(3)
    expect(received[0].payload).toEqual({ n: 1 })
    expect(received[1].payload).toEqual({ n: 2 })
    expect(received[2].payload).toEqual({ n: 3 })

    client.destroy()
  })
})
