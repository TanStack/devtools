import { RingBuffer } from './ring-buffer'

interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
  type: TEventName
  payload: TPayload
  pluginId?: string // Optional pluginId to filter events by plugin
  eventId?: string
  source?: 'server-bridge'
}
declare global {
  var __TANSTACK_EVENT_TARGET__: EventTarget | null
}

// Compile-time placeholders replaced by the Vite plugin's connection-injection transform.
// When not replaced (no Vite plugin), these remain undefined and network transport is disabled.
declare const __TANSTACK_DEVTOOLS_PORT__: number | undefined
declare const __TANSTACK_DEVTOOLS_HOST__: string | undefined
declare const __TANSTACK_DEVTOOLS_PROTOCOL__: 'http' | 'https' | undefined

function getDevtoolsPort(): number | undefined {
  try {
    return typeof __TANSTACK_DEVTOOLS_PORT__ !== 'undefined' ? __TANSTACK_DEVTOOLS_PORT__ : undefined
  } catch {
    return undefined
  }
}

function getDevtoolsHost(): string | undefined {
  try {
    return typeof __TANSTACK_DEVTOOLS_HOST__ !== 'undefined' ? __TANSTACK_DEVTOOLS_HOST__ : undefined
  } catch {
    return undefined
  }
}

function getDevtoolsProtocol(): 'http' | 'https' | undefined {
  try {
    return typeof __TANSTACK_DEVTOOLS_PROTOCOL__ !== 'undefined' ? __TANSTACK_DEVTOOLS_PROTOCOL__ : undefined
  } catch {
    return undefined
  }
}

type AllDevtoolsEvents<TEventMap extends Record<string, any>> = {
  [Key in keyof TEventMap & string]: TanStackDevtoolsEvent<Key, TEventMap[Key]>
}[keyof TEventMap & string]

export class EventClient<TEventMap extends Record<string, any>> {
  #enabled = true
  #pluginId: string
  #eventTarget: () => EventTarget
  #debug: boolean
  #queuedEvents: Array<TanStackDevtoolsEvent<string, any>>
  #connected: boolean
  #connectIntervalId: number | null
  #connectEveryMs: number
  #retryCount = 0
  #maxRetries = 5
  #connecting = false
  #failedToConnect = false
  #internalEventTarget: EventTarget | null = null
  #useNetworkTransport = false
  #networkTransportDetected = false // one-time detection flag
  #cachedLocalTarget: EventTarget | null = null // cached for consistent listener registration
  #ws: WebSocket | null = null
  #wsConnecting = false
  #wsReconnectTimer: ReturnType<typeof setTimeout> | null = null
  #wsReconnectDelay = 100 // exponential backoff: 100, 200, 400, ... 5000ms
  #wsMaxReconnectAttempts = 10
  #wsReconnectAttempts = 0
  #wsGaveUp = false // true when WebSocket is permanently unavailable, use HTTP-only
  #sentEventIds = new RingBuffer(200)
  #networkPort: number | undefined = undefined
  #networkHost: string | undefined = undefined
  #networkProtocol: 'http' | 'https' | undefined = undefined

  #onConnected = () => {
    this.debugLog('Connected to event bus')
    this.#connected = true
    this.#connecting = false
    this.debugLog('Emitting queued events', this.#queuedEvents)
    this.#queuedEvents.forEach((event) => this.emitEventToBus(event))
    this.#queuedEvents = []
    this.stopConnectLoop()
    this.#eventTarget().removeEventListener(
      'tanstack-connect-success',
      this.#onConnected,
    )
  }
  // fired off right away and then at intervals
  #retryConnection = () => {
    if (this.#retryCount < this.#maxRetries) {
      this.#retryCount++
      this.dispatchCustomEvent('tanstack-connect', {})

      return
    }
    this.#eventTarget().removeEventListener(
      'tanstack-connect',
      this.#retryConnection,
    )
    this.#failedToConnect = true
    this.debugLog('Max retries reached, giving up on connection')
    this.stopConnectLoop()
  }

  // This is run to register connection handlers on first emit attempt
  #connectFunction = () => {
    if (this.#connecting) return
    this.#connecting = true
    this.#eventTarget().addEventListener(
      'tanstack-connect-success',
      this.#onConnected,
    )
    this.#retryConnection()
  }

  constructor({
    pluginId,
    debug = false,
    enabled = true,
    reconnectEveryMs = 300,
  }: {
    pluginId: string
    debug?: boolean
    reconnectEveryMs?: number
    enabled?: boolean
  }) {
    this.#pluginId = pluginId
    this.#enabled = enabled
    this.#eventTarget = this.getGlobalTarget
    this.#debug = debug
    this.debugLog(' Initializing event subscription for plugin', this.#pluginId)
    this.#queuedEvents = []
    this.#connected = false
    this.#failedToConnect = false
    this.#connectIntervalId = null
    this.#connectEveryMs = reconnectEveryMs
  }

  private startConnectLoop() {
    // if connected, trying to connect, or the internalId is already set, do nothing
    if (this.#connectIntervalId !== null || this.#connected) return
    this.debugLog(`Starting connect loop (every ${this.#connectEveryMs}ms)`)

    this.#connectIntervalId = setInterval(
      this.#retryConnection,
      this.#connectEveryMs,
    ) as unknown as number
  }

  private stopConnectLoop() {
    this.#connecting = false

    if (this.#connectIntervalId === null) {
      return
    }
    clearInterval(this.#connectIntervalId)
    this.#connectIntervalId = null
    this.#queuedEvents = []
    this.debugLog('Stopped connect loop')
  }

  private debugLog(...args: Array<any>) {
    if (this.#debug) {
      console.log(`🌴 [tanstack-devtools:${this.#pluginId}-plugin]`, ...args)
    }
  }
  private getGlobalTarget() {
    // server one is the global event target
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.__TANSTACK_EVENT_TARGET__
    ) {
      this.debugLog('Using global event target')
      return globalThis.__TANSTACK_EVENT_TARGET__
    }
    // Client event target is the browser window object
    if (
      typeof window !== 'undefined' &&
      typeof window.addEventListener !== 'undefined'
    ) {
      this.debugLog('Using window as event target')
      return window
    }

    // We're in an isolated server environment (worker thread, separate process, etc.)
    // Check if devtools server coordinates are available (Vite plugin replaced placeholders)
    if (!this.#networkTransportDetected) {
      this.#networkTransportDetected = true
      const port = getDevtoolsPort()
      const host = getDevtoolsHost()
      const protocol = getDevtoolsProtocol()
      if (port !== undefined) {
        this.#useNetworkTransport = true
        this.#networkPort = port
        this.#networkHost = host
        this.#networkProtocol = protocol
        this.debugLog('Network transport activated — devtools server detected at port', port)
      }
    }

    // Return cached local EventTarget to ensure .on() and emit() use the same instance
    if (this.#cachedLocalTarget) {
      return this.#cachedLocalTarget
    }

    // Protect against non-web environments like react-native
    if (typeof EventTarget === 'undefined') {
      this.debugLog(
        'No event mechanism available, running in non-web environment',
      )
      const noop = {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }
      this.#cachedLocalTarget = noop as any
      return noop
    }

    const eventTarget = new EventTarget()
    this.#cachedLocalTarget = eventTarget
    this.debugLog('Using cached local EventTarget as fallback')
    return eventTarget
  }

  getPluginId() {
    return this.#pluginId
  }

  private dispatchCustomEventShim(eventName: string, detail: any) {
    try {
      const event = new Event(eventName, {
        detail: detail,
      } as any)
      this.#eventTarget().dispatchEvent(event)
    } catch (e) {
      this.debugLog('Failed to dispatch shim event')
    }
  }

  private dispatchCustomEvent(eventName: string, detail?: any) {
    try {
      this.#eventTarget().dispatchEvent(new CustomEvent(eventName, { detail }))
    } catch (e) {
      this.dispatchCustomEventShim(eventName, detail)
    }
  }

  private emitEventToBus(event: TanStackDevtoolsEvent<string, any>) {
    this.debugLog('Emitting event to client bus', event)
    this.dispatchCustomEvent('tanstack-dispatch-event', event)
  }

  createEventPayload<TEvent extends keyof TEventMap & string>(
    eventSuffix: TEvent,
    payload: TEventMap[TEvent],
  ) {
    return {
      type: `${this.#pluginId}:${eventSuffix}`,
      payload,
      pluginId: this.#pluginId,
    }
  }
  emit<TEvent extends keyof TEventMap & string>(
    eventSuffix: TEvent,
    payload: TEventMap[TEvent],
  ) {
    if (!this.#enabled) {
      this.debugLog(
        'Event bus client is disabled, not emitting event',
        eventSuffix,
        payload,
      )
      return
    }
    if (this.#internalEventTarget) {
      this.debugLog(
        'Emitting event to internal event target',
        eventSuffix,
        payload,
      )
      this.#internalEventTarget.dispatchEvent(
        new CustomEvent(`${this.#pluginId}:${eventSuffix}`, {
          detail: this.createEventPayload(eventSuffix, payload),
        }),
      )
    }

    if (this.#failedToConnect) {
      this.debugLog('Previously failed to connect, not emitting to bus')
      return
    }
    // wait to connect to the bus
    if (!this.#connected) {
      this.debugLog('Bus not available, will be pushed as soon as connected')
      this.#queuedEvents.push(this.createEventPayload(eventSuffix, payload))
      // start connection to event bus
      if (typeof CustomEvent !== 'undefined' && !this.#connecting) {
        this.#connectFunction()
        this.startConnectLoop()
      }
      return
    }
    // emit right now
    return this.emitEventToBus(this.createEventPayload(eventSuffix, payload))
  }

  on<TEvent extends keyof TEventMap & string>(
    eventSuffix: TEvent,
    cb: (event: TanStackDevtoolsEvent<TEvent, TEventMap[TEvent]>) => void,
    options?: {
      withEventTarget?: boolean
    },
  ) {
    const withEventTarget = options?.withEventTarget ?? false
    const eventName = `${this.#pluginId}:${eventSuffix}` as const
    if (withEventTarget) {
      if (!this.#internalEventTarget) {
        this.#internalEventTarget = new EventTarget()
      }
      this.#internalEventTarget.addEventListener(eventName, (e) => {
        cb((e as CustomEvent).detail)
      })
    }
    if (!this.#enabled) {
      this.debugLog(
        'Event bus client is disabled, not registering event',
        eventName,
      )
      return () => {}
    }
    const handler = (e: Event) => {
      this.debugLog('Received event from bus', (e as CustomEvent).detail)
      cb((e as CustomEvent).detail)
    }
    this.#eventTarget().addEventListener(eventName, handler)
    this.debugLog('Registered event to bus', eventName)
    return () => {
      if (withEventTarget) {
        this.#internalEventTarget?.removeEventListener(eventName, handler)
      }
      this.#eventTarget().removeEventListener(eventName, handler)
    }
  }

  onAll(cb: (event: TanStackDevtoolsEvent<string, any>) => void) {
    if (!this.#enabled) {
      this.debugLog('Event bus client is disabled, not registering event')
      return () => {}
    }

    const handler = (e: Event) => {
      const event = (e as CustomEvent).detail

      cb(event)
    }
    this.#eventTarget().addEventListener('tanstack-devtools-global', handler)
    return () =>
      this.#eventTarget().removeEventListener(
        'tanstack-devtools-global',
        handler,
      )
  }
  onAllPluginEvents(cb: (event: AllDevtoolsEvents<TEventMap>) => void) {
    if (!this.#enabled) {
      this.debugLog('Event bus client is disabled, not registering event')
      return () => {}
    }
    const handler = (e: Event) => {
      const event = (e as CustomEvent).detail
      if (this.#pluginId && event.pluginId !== this.#pluginId) {
        return
      }
      cb(event)
    }
    this.#eventTarget().addEventListener('tanstack-devtools-global', handler)
    return () =>
      this.#eventTarget().removeEventListener(
        'tanstack-devtools-global',
        handler,
      )
  }

  /** Tear down network transport resources. Full implementation in Task 6. */
  dispose() {
    this.debugLog('Disposing EventClient', {
      useNetworkTransport: this.#useNetworkTransport,
      wsConnecting: this.#wsConnecting,
      wsReconnectDelay: this.#wsReconnectDelay,
      wsReconnectAttempts: this.#wsReconnectAttempts,
      wsGaveUp: this.#wsGaveUp,
      wsMaxReconnectAttempts: this.#wsMaxReconnectAttempts,
      networkPort: this.#networkPort,
      networkHost: this.#networkHost,
      networkProtocol: this.#networkProtocol,
    })
    if (this.#wsReconnectTimer) {
      clearTimeout(this.#wsReconnectTimer)
      this.#wsReconnectTimer = null
    }
    if (this.#ws) {
      this.#ws.close()
      this.#ws = null
    }
    this.#wsConnecting = false
    this.#wsReconnectAttempts = 0
    this.#wsReconnectDelay = 100
    this.#wsGaveUp = false
    this.#wsMaxReconnectAttempts = 10
    this.#useNetworkTransport = false
    this.#networkPort = undefined
    this.#networkHost = undefined
    this.#networkProtocol = undefined
    this.#sentEventIds.has('') // keep reference alive
    this.stopConnectLoop()
  }
}
