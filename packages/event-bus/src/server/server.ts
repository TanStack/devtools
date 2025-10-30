import http from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import { parseWithBigInt, stringifyWithBigInt } from '../utils/json'

// Shared types
export interface TanStackDevtoolsEvent<
  TEventName extends string,
  TPayload = any,
> {
  type: TEventName
  payload: TPayload
  pluginId?: string // Optional pluginId to filter events by plugin
}
// Used so no new server starts up when HMR happens
declare global {
  var __TANSTACK_DEVTOOLS_SERVER__: http.Server | null

  var __TANSTACK_DEVTOOLS_WSS_SERVER__: WebSocketServer | null

  var __TANSTACK_EVENT_TARGET__: EventTarget | null
}

export interface ServerEventBusConfig {
  port?: number | undefined
  debug?: boolean | undefined
}

export class ServerEventBus {
  #eventTarget: EventTarget
  #clients = new Set<WebSocket>()
  #sseClients = new Set<http.ServerResponse>()
  #server: http.Server | null = null
  #wssServer: WebSocketServer | null = null
  #port: number
  #debug: boolean
  #dispatcher = (e: Event) => {
    const event = (e as CustomEvent).detail
    this.debugLog('Dispatching event from dispatcher, forwarding', event)
    this.emit(event)
  }
  #connectFunction = () => {
    this.debugLog(
      'Connection request made to event-bus, replying back with success',
    )
    this.#eventTarget.dispatchEvent(new CustomEvent('tanstack-connect-success'))
  }
  constructor({ port = 42069, debug = false }: ServerEventBusConfig = {}) {
    this.#port = port
    this.#eventTarget =
      globalThis.__TANSTACK_EVENT_TARGET__ ?? new EventTarget()
    // we want to set the global event target only once so that we can emit/listen to events on the server
    if (!globalThis.__TANSTACK_EVENT_TARGET__) {
      globalThis.__TANSTACK_EVENT_TARGET__ = this.#eventTarget
    }
    this.#server = globalThis.__TANSTACK_DEVTOOLS_SERVER__ ?? null
    this.#wssServer = globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ ?? null
    this.#debug = debug
    this.debugLog('Initializing server event bus')
  }

  private debugLog(...args: Array<any>) {
    if (this.#debug) {
      console.log('🌴 [tanstack-devtools:server-bus] ', ...args)
    }
  }

  private emitToServer(event: TanStackDevtoolsEvent<string>) {
    this.debugLog('Emitting event to specific server listeners', event)
    this.#eventTarget.dispatchEvent(
      new CustomEvent(event.type, { detail: event }),
    )
    this.debugLog('Emitting event to global server listeners', event)
    this.#eventTarget.dispatchEvent(
      new CustomEvent('tanstack-devtools-global', { detail: event }),
    )
  }

  private emitEventToClients(event: TanStackDevtoolsEvent<string>) {
    this.debugLog('Emitting event to clients', event)
    const json = stringifyWithBigInt(event)

    for (const client of this.#clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json)
      }
    }
    for (const res of this.#sseClients) {
      res.write(`data: ${json}\n\n`)
    }
  }

  private emit(event: TanStackDevtoolsEvent<string>) {
    this.emitEventToClients(event)
    this.emitToServer(event)
  }

  private createSSEServer() {
    if (this.#server) {
      return this.#server
    }
    const server = http.createServer((req, res) => {
      if (req.url === '/__devtools/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        })
        res.write('\n')
        this.debugLog('New SSE client connected')
        this.#sseClients.add(res)
        req.on('close', () => this.#sseClients.delete(res))
        return
      }

      if (req.url === '/__devtools/send' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const msg = parseWithBigInt(body)
            this.debugLog('Received event from client', msg)
            this.emitToServer(msg)
          } catch {}
        })
        res.writeHead(200).end()
        return
      }

      res.statusCode = 404
      res.end()
    })
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = server
    this.#server = server
    return server
  }

  private createWebSocketServer() {
    if (this.#wssServer) {
      return this.#wssServer
    }

    const wss = new WebSocketServer({ noServer: true })
    this.#wssServer = wss
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = wss
    return wss
  }

  private handleNewConnection(wss: WebSocketServer) {
    wss.on('connection', (ws: WebSocket) => {
      this.debugLog('New WebSocket client connected')
      this.#clients.add(ws)
      ws.on('close', () => {
        this.debugLog('WebSocket client disconnected')
        this.#clients.delete(ws)
      })
      ws.on('message', (msg) => {
        this.debugLog('Received message from WebSocket client', msg.toString())
        const data = parseWithBigInt(msg.toString())
        this.emitToServer(data)
      })
    })
  }

  start() {
    if (process.env.NODE_ENV !== 'development') return
    if (this.#server || this.#wssServer) {
      // console.warn('Server is already running')
      return
    }
    this.debugLog('Starting server event bus')
    const server = this.createSSEServer()
    const wss = this.createWebSocketServer()

    this.#eventTarget.addEventListener(
      'tanstack-dispatch-event',
      this.#dispatcher,
    )
    this.#eventTarget.addEventListener(
      'tanstack-connect',
      this.#connectFunction,
    )
    this.handleNewConnection(wss)

    // Handle connection upgrade for WebSocket
    server.on('upgrade', (req, socket, head) => {
      if (req.url === '/__devtools/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          this.debugLog('WebSocket connection established')
          wss.emit('connection', ws, req)
        })
      }
    })

    server.listen(this.#port, () => {
      this.debugLog(`Listening on http://localhost:${this.#port}`)
    })
  }

  stop() {
    this.#server?.close(() => {
      this.debugLog('Server stopped')
    })
    this.#wssServer?.close(() => {
      this.debugLog('WebSocket server stopped')
    })
    this.debugLog('Clearing all connections')
    this.#clients.clear()
    this.#sseClients.forEach((res) => res.end())
    this.#sseClients.clear()
    this.debugLog('Cleared all WS/SSE connections')
    this.#server = null
    this.#wssServer = null
    this.#eventTarget.removeEventListener(
      'tanstack-dispatch-event',
      this.#dispatcher,
    )
    this.#eventTarget.removeEventListener(
      'tanstack-connect',
      this.#connectFunction,
    )
    this.debugLog('[tanstack-devtools] All connections cleared')
  }
}
