// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { devtools } from '../src/plugin'
import type { ViteDevServer } from 'vite'

describe('inject-source order', () => {
  let root: string
  let server: ViteDevServer

  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'tsd-inject-order-'))
    writeFileSync(
      join(root, 'App.tsx'),
      'export function App() {\n  return <div>hi</div>\n}\n',
    )
    server = await createServer({
      root,
      mode: 'development',
      configFile: false,
      logLevel: 'silent',
      server: { middlewareMode: true, ws: false },
      // The classic runtime needs no react import, so the fixture needs no
      // node_modules.
      oxc: { jsx: { runtime: 'classic' } },
      plugins: [
        // A framework plugin listed before devtools() that changes the code of
        // one environment only, like a server-function compiler.
        {
          name: 'shift-ssr-lines',
          enforce: 'pre',
          transform(code, id, options) {
            return options?.ssr && id.endsWith('.tsx')
              ? `\n\n\n${code}`
              : undefined
          },
        },
        devtools({
          eventBusConfig: { enabled: false },
          consolePiping: { enabled: false },
        }),
      ],
    })
  })

  afterAll(async () => {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  })

  it('injects the same source location on the client and the server', async () => {
    const client = await server.transformRequest('/App.tsx')
    const ssr = await server.transformRequest('/App.tsx', { ssr: true })
    const sourceOf = (code = '') => code.match(/App\.tsx:\d+:\d+/)?.[0]

    expect(sourceOf(client?.code)).toBe('App.tsx:2:10')
    expect(sourceOf(ssr?.code)).toBe('App.tsx:2:10')
  })
})
