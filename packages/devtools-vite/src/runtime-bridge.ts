/**
 * Worker-side bridge for isolated server runtimes (Nitro v3 worker, Cloudflare workerd).
 *
 * Injected into the `@tanstack/devtools-event-client` module ONLY in non-client
 * (server) environments during dev. At module-eval time it gives the isolated
 * runtime a real `globalThis.__TANSTACK_EVENT_TARGET__` (so the unchanged
 * `EventClient` uses it instead of a throwaway target) and bridges that target to
 * the Vite dev process over the framework plugin's existing HMR HotChannel.
 *
 * Guards:
 * - `import.meta.hot` falsy (production / no HMR) -> tree-shaken / no-op.
 * - global target already set (in-process RunnableDevEnvironment, where
 *   ServerEventBus lives) -> no-op, so existing behavior is unchanged.
 *
 * The bridge replicates ServerEventBus's in-process responsibilities so the
 * EventClient protocol is identical across the wire (see design doc).
 */
export function generateRuntimeBridgeCode(): string {
  return `
;(function __tsdRuntimeBridge() {
  if (typeof import.meta === 'undefined' || !import.meta.hot) return;
  if (!globalThis.__TANSTACK_EVENT_TARGET__) {
    var target = new EventTarget();
    globalThis.__TANSTACK_EVENT_TARGET__ = target;

    // Complete EventClient's connect handshake locally so queued events flush.
    target.addEventListener('tanstack-connect', function () {
      target.dispatchEvent(new CustomEvent('tanstack-connect-success'));
    });

    // Worker -> Vite dev server.
    target.addEventListener('tanstack-dispatch-event', function (e) {
      import.meta.hot.send('tsd:to-server', e.detail);
    });

    // Vite dev server -> worker listeners.
    import.meta.hot.on('tsd:to-client', function (event) {
      target.dispatchEvent(new CustomEvent(event.type, { detail: event }));
      target.dispatchEvent(new CustomEvent('tanstack-devtools-global', { detail: event }));
    });
  }
})();
`
}

function isEventClientModule(id: string, code: string): boolean {
  const isEventClientPath =
    id.includes('devtools-event-client') || id.includes('event-bus-client')
  // Only the module that actually defines the class — avoids re-export shims
  // and unrelated files inside the package.
  return isEventClientPath && code.includes('EventClient')
}

export function injectRuntimeBridge(
  code: string,
  id: string,
  environmentName: string | undefined,
): string | undefined {
  // Only isolated server environments need the bridge. The client environment
  // has `window`; the in-process RunnableDevEnvironment is handled by the
  // runtime global guard inside the injected code.
  if (!environmentName || environmentName === 'client') return undefined
  if (!isEventClientModule(id, code)) return undefined
  return `${code}\n${generateRuntimeBridgeCode()}`
}

interface BridgeHotChannel {
  on?: (event: string, cb: (data: any) => void) => void
  send?: (event: string, data: any) => void
}
interface BridgeServerLike {
  environments: Record<string, { hot?: BridgeHotChannel | null } | undefined>
}

export function wireRuntimeBridgeChannels(
  server: BridgeServerLike,
  getTarget: () => EventTarget | null | undefined,
): () => void {
  const forwarders: Array<() => void> = []

  for (const [name, env] of Object.entries(server.environments)) {
    if (name === 'client') continue
    const hot = env?.hot
    if (!hot || typeof hot.on !== 'function' || typeof hot.send !== 'function') {
      continue
    }

    // Worker -> ServerEventBus (broadcasts to browser + in-process listeners).
    hot.on('tsd:to-server', (event: any) => {
      getTarget()?.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', { detail: event }),
      )
    })

    // ServerEventBus output -> worker listeners.
    const forward = (e: Event) =>
      hot.send!('tsd:to-client', (e as CustomEvent).detail)
    const target = getTarget()
    target?.addEventListener('tanstack-devtools-global', forward)
    forwarders.push(() =>
      getTarget()?.removeEventListener('tanstack-devtools-global', forward),
    )
  }

  return () => forwarders.forEach((off) => off())
}
