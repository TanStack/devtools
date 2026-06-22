import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { emitServerPing } from '@tanstack/devtools-e2e/event-probe/server'

// NOTE: In Start dev this handler runs in a separate Vite SSR module-runner
// environment that does NOT share `globalThis.__TANSTACK_EVENT_TARGET__` with the
// main Vite node process that hosts the devtools ServerEventBus. The emit therefore
// resolves to an isolated fallback EventTarget and never reaches connected clients.
// See the `// ponytail:` note in tests/start.spec.ts. The route is kept so the same
// wiring can be re-tested if Start later shares the global across environments.
export const Route = createFileRoute('/emit-server-ping')({
  server: {
    handlers: {
      GET: () => {
        emitServerPing(1)
        return json({ ok: true })
      },
    },
  },
})
