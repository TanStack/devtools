import { parseWithBigInt, stringifyWithBigInt } from '../utils/json'

interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
  type: TEventName
  payload: TPayload
  pluginId?: string // Optional pluginId to filter events by plugin
}

export interface ClientEventBusConfig {
  /**
   * Optional flag to indicate if the devtools server event bus is available to connect to.
   * This is used to determine if the devtools can connect to the server for real-time event streams.
   */
  connectToServerBus?: boolean

  /**
   * Optional flag to enable debug mode for the event bus.
   */
  debug?: boolean

  /**
   * Optional port to connect to the devtools server event bus.
   * Defaults to 42069.
   */
  port?: number
}

export class ClientEventBus {
  #port: number
  #socket: WebSocket | null
  #eventSource: EventSource | null
  #eventTarget: EventTarget
  #debug: boolean
  #connectToServerBus: boolean
  #broadcastChannel: BroadcastChannel | null
  #dispatcher = (e: Event) => {
    const event = (e as CustomEvent).detail
    this.emitToServer(event)
    this.emitToClients(event)
  }
  #connectFunction = () => {
    this.debugLog(
      'Connection request made to event-bus, replying back with success',
    )
    this.#eventTarget.dispatchEvent(new CustomEvent('tanstack-connect-success'))
  }
  constructor({
    port = 42069,
    debug = false,
    connectToServerBus = false,
  }: ClientEventBusConfig = {}) {
    this.#debug = debug
    this.#broadcastChannel = new BroadcastChannel('tanstack-devtools')
    this.#eventSource = null
    this.#port = port
    this.#socket = null
    this.#connectToServerBus = connectToServerBus
    this.#eventTarget = this.getGlobalTarget()
    this.#broadcastChannel.onmessage = (e) => {
      this.emitToClients(parseWithBigInt(e.data), true)
    }
    this.debugLog('Initializing client event bus')
  }

  private emitToClients(
    event: TanStackDevtoolsEvent<string>,
    fromBroadcastChannel = false,
  ) {
    this.debugLog('Emitting event from client bus', event)
    const specificEvent = new CustomEvent(event.type, { detail: event })
    this.debugLog('Emitting event to specific client listeners', event)
    this.#eventTarget.dispatchEvent(specificEvent)
    const globalEvent = new CustomEvent('tanstack-devtools-global', {
      detail: event,
    })
    // We only emit the events if they didn't come from the broadcast channel
    // otherwise it would infinitely send events between
    if (!fromBroadcastChannel) {
      this.#broadcastChannel?.postMessage(stringifyWithBigInt(event))
    }
    this.debugLog('Emitting event to global client listeners', event)
    this.#eventTarget.dispatchEvent(globalEvent)
  }

  private emitToServer(event: TanStackDevtoolsEvent<string, any>) {
    const json = stringifyWithBigInt(event)
    // try to emit it to the event bus first
    if (this.#socket && this.#socket.readyState === WebSocket.OPEN) {
      this.debugLog('Emitting event to server via WS', event)
      this.#socket.send(json)
      // try to emit to SSE if WebSocket is not available (this will only happen on the client side)
    } else if (this.#eventSource) {
      this.debugLog('Emitting event to server via SSE', event)

      fetch(`http://localhost:${this.#port}/__devtools/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      }).catch(() => {})
    }
  }
  start() {
    this.debugLog('Starting client event bus')
    if (typeof window === 'undefined') {
      return
    }
    if (this.#connectToServerBus) {
      this.connect()
    }
    this.#eventTarget = window
    this.#eventTarget.addEventListener(
      'tanstack-dispatch-event',
      this.#dispatcher,
    )
    this.#eventTarget.addEventListener(
      'tanstack-connect',
      this.#connectFunction,
    )
  }
  stop() {
    this.debugLog('Stopping client event bus')
    if (typeof window === 'undefined') {
      return
    }
    this.#eventTarget.removeEventListener(
      'tanstack-dispatch-event',
      this.#dispatcher,
    )
    this.#eventTarget.removeEventListener(
      'tanstack-connect',
      this.#connectFunction,
    )
    this.#eventSource?.close()
    this.#socket?.close()
    this.#socket = null
    this.#eventSource = null
  }
  private getGlobalTarget() {
    if (typeof window !== 'undefined') {
      return window
    }

    return new EventTarget()
  }
  private debugLog(...messages: Array<any>) {
    if (this.#debug) {
      console.log('🌴 [tanstack-devtools:client-bus]', ...messages)
    }
  }
  private connectSSE() {
    this.debugLog('Connecting to SSE server')
    this.#eventSource = new EventSource(
      `http://localhost:${this.#port}/__devtools/sse`,
    )
    this.#eventSource.onmessage = (e) => {
      this.debugLog('Received message from SSE server', e.data)
      this.handleEventReceived(e.data)
    }
  }

  private connectWebSocket() {
    this.debugLog('Connecting to WebSocket server')

    this.#socket = new WebSocket(`ws://localhost:${this.#port}/__devtools/ws`)
    this.#socket.onmessage = (e) => {
      this.debugLog('Received message from server', e.data)
      this.handleEventReceived(e.data)
    }
    this.#socket.onclose = () => {
      this.debugLog('WebSocket connection closed')
      this.#socket = null
    }
    this.#socket.onerror = () => {
      this.debugLog('WebSocket connection error')
    }
  }

  private connect() {
    try {
      this.connectWebSocket()
    } catch {
      // Do not try to connect if we're on the server side
      if (typeof window === 'undefined') return
      this.connectSSE()
    }
  }

  private handleEventReceived(data: string) {
    try {
      const event = parseWithBigInt(data) as TanStackDevtoolsEvent<string, any>
      this.emitToClients(event)
    } catch {}
  }
}
