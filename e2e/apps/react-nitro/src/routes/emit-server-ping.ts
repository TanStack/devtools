import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { emitServerPing } from '@tanstack/devtools-e2e/event-probe/server'

// In Start dev this handler runs in Nitro's isolated Vite SSR module-runner
// environment. PR #384's runtime bridge (packages/devtools-vite/src/runtime-bridge.ts)
// installs a `globalThis.__TANSTACK_EVENT_TARGET__` in that runtime and bridges it to
// the main Vite process (which hosts the devtools ServerEventBus) over the framework
// plugin's HMR HotChannel, so this emit reaches all connected browser clients.
// Exercised by the server->client test in tests/nitro.spec.ts.
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
