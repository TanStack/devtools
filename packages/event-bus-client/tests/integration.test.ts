// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { createNetworkTransportClient } from '../src/plugin'

describe('End-to-end: ServerEventBus + EventClient network transport', () => {
  let serverBus: ServerEventBus

  beforeEach(() => {
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
    process.env.NODE_ENV = 'development'
  })

  afterEach(async () => {
    serverBus?.stop()
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
    await new Promise((resolve) => setTimeout(resolve, 100))
  })

  it('should support bidirectional events between isolated EventClient and ServerEventBus', async () => {
    // 1. Start ServerEventBus
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!

    // 2. Simulate isolation: null out globalThis
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    // 3. Create isolated EventClient with network transport
    const client = createNetworkTransportClient({
      pluginId: 'e2e-test',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    // 4. Set up listener on the isolated client
    const clientReceived = new Promise<any>((resolve) => {
      client.on('from-server', (event) => resolve(event))
    })

    // 5. Emit from client → should reach server
    const serverReceived = new Promise<any>((resolve) => {
      serverEventTarget.addEventListener('e2e-test:from-client', (e) => {
        resolve((e as CustomEvent).detail)
      })
    })

    client.emit('from-client', { direction: 'client-to-server' })

    // Wait for connection + delivery
    const fromClient = await Promise.race([
      serverReceived,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout: client→server')), 3000),
      ),
    ])

    expect(fromClient.payload).toEqual({ direction: 'client-to-server' })

    // 6. Now emit from server → should reach isolated client
    await new Promise((resolve) => setTimeout(resolve, 200))

    serverEventTarget.dispatchEvent(
      new CustomEvent('tanstack-dispatch-event', {
        detail: {
          type: 'e2e-test:from-server',
          payload: { direction: 'server-to-client' },
          pluginId: 'e2e-test',
        },
      }),
    )

    const fromServer = await Promise.race([
      clientReceived,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout: server→client')), 3000),
      ),
    ])

    expect(fromServer.payload).toEqual({ direction: 'server-to-client' })

    client.destroy()
  })

  it('should handle multiple isolated clients simultaneously', async () => {
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client1 = createNetworkTransportClient({
      pluginId: 'multi-1',
      port,
      host: 'localhost',
    })

    const client2 = createNetworkTransportClient({
      pluginId: 'multi-2',
      port,
      host: 'localhost',
    })

    // Both emit, both should reach server
    const received: Array<any> = []
    serverEventTarget.addEventListener('multi-1:ping', (e) => {
      received.push((e as CustomEvent).detail)
    })
    serverEventTarget.addEventListener('multi-2:ping', (e) => {
      received.push((e as CustomEvent).detail)
    })

    client1.emit('ping', { from: 1 })
    client2.emit('ping', { from: 2 })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    expect(received.length).toBe(2)
    expect(received.map((e) => e.payload.from).sort()).toEqual([1, 2])

    client1.destroy()
    client2.destroy()
  })
})
