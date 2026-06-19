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
