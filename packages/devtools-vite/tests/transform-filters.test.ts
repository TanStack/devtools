// @vitest-environment node
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { detectDevtoolsFile } from '@tanstack/devtools-bundler-core'
import { createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { devtools } from '../src/plugin'
import type { Plugin, ViteDevServer } from 'vite'

type Pattern = string | RegExp
type StringFilter =
  | Pattern
  | Array<Pattern>
  | { include?: Pattern | Array<Pattern>; exclude?: Pattern | Array<Pattern> }
type Filter = { id?: StringFilter; code?: StringFilter }
type Handler = (
  this: unknown,
  code: string,
  id: string,
) => string | { code: string } | undefined | null

// Vite's rules: `exclude` wins, then an `include`, if given, must match. A
// RegExp is tested on the value. A string in `code` means "contains"; in `id`
// it would be a glob, which these filters do not use.
function matches(
  filter: StringFilter | undefined,
  value: string,
  kind: 'id' | 'code',
) {
  if (filter === undefined) return true
  const { include, exclude } =
    typeof filter === 'string' ||
    filter instanceof RegExp ||
    Array.isArray(filter)
      ? { include: filter, exclude: undefined }
      : filter
  const test = (pattern: Pattern) => {
    if (typeof pattern !== 'string') return pattern.test(value)
    if (kind === 'id') throw new Error(`glob id filter: ${pattern}`)
    return value.includes(pattern)
  }
  if (exclude !== undefined && [exclude].flat().some(test)) return false
  const includes = include === undefined ? [] : [include].flat()
  return includes.length === 0 || includes.some(test)
}

function transformHook(plugins: Array<Plugin>, name: string) {
  const hook = plugins.find((p) => p.name === name)?.transform
  if (!hook || typeof hook === 'function' || !hook.filter) {
    throw new Error(`${name} has no transform filter`)
  }
  const filter = hook.filter as Filter
  return {
    passes: (id: string, code: string) =>
      matches(filter.id, id, 'id') && matches(filter.code, code, 'code'),
    handler: hook.handler as unknown as Handler,
  }
}

const plugins = devtools({ logging: false })
const ssr = { environment: { name: 'ssr' } }

describe('transform hook filters', () => {
  it('every transform hook has a filter', () => {
    const unfiltered = plugins
      .filter((p) => p.transform)
      .filter((p) => typeof p.transform === 'function' || !p.transform!.filter)
      .map((p) => p.name)
    expect(unfiltered).toEqual([])
  })

  describe('inject-source', () => {
    const { passes, handler } = transformHook(
      plugins,
      '@tanstack/devtools:inject-source',
    )

    it.each([
      ['/app/src/App.tsx', 'export const App = () => <div>hi</div>'],
      ['/app/src/App.jsx', 'export const App = () => <div>hi</div>'],
      ['/app/src/legacy.js', 'export const App = () => <div>hi</div>'],
      ['/app/src/spaced.jsx', 'export const App = () => < div>hi</div>'],
      [
        '/app/src/routes/index.tsx?tsr-split=component',
        'const Route = () => <main />',
      ],
      [
        '/app/src/Card.vue?vue&type=script&setup=true&lang.tsx',
        'export default () => <section />',
      ],
      [
        '/app/src/post.mdx',
        'export default function MDXContent() { return <h1>Hi</h1> }',
      ],
    ])('runs on %s', (id, code) => {
      expect(handler(code, id)).toBeDefined()
      expect(passes(id, code)).toBe(true)
    })

    it.each([
      ['/app/src/ids.ts', 'export const ids = () => new Map<string, number>()'],
      ['/app/src/api.mts', 'export const get = <T,>(url: string) => url'],
      ['/app/src/api.cts?v=1', 'export const x = <T>(y: T) => y'],
      ['/app/src/env.d.ts', 'declare const a: Array<string>'],
      [
        '/app/src/Card.vue?vue&type=script&setup=true&lang.ts',
        'const items = ref<Array<string>>([])',
      ],
      ['/app/src/math.js', 'export const add = (a, b) => a + b'],
      ['/app/src/styles.css', 'a { color: red }'],
      ['/app/src/data.json', '{ "a": 1 }'],
    ])('skips %s', (id, code) => {
      expect(handler(code, id)).toBeUndefined()
      expect(passes(id, code)).toBe(false)
    })
  })

  describe('remove-devtools-on-build', () => {
    const { passes, handler } = transformHook(
      plugins,
      '@tanstack/devtools:remove-devtools-on-build',
    )
    const app = [
      `import { TanStackDevtools } from '@tanstack/react-devtools'`,
      `export const App = () => <TanStackDevtools plugins={[]} />`,
    ].join('\n')

    it('runs on a file that imports devtools', () => {
      expect(handler(app, '/app/src/App.tsx')).toBeDefined()
      expect(passes('/app/src/App.tsx', app)).toBe(true)
    })

    it.each([
      ['/app/src/App.tsx', 'export const App = () => <div />'],
      ['/app/src/App.tsx?raw', app],
      ['/app/node_modules/lib/dist/index.js', app],
    ])('skips %s', (id, code) => {
      expect(handler(code, id)).toBeUndefined()
      expect(passes(id, code)).toBe(false)
    })
  })

  describe('console-pipe-transform', () => {
    const { passes, handler } = transformHook(
      plugins,
      '@tanstack/devtools:console-pipe-transform',
    )

    it.each([
      ['/app/src/main.tsx', `createRoot(el).render(<App />)`],
      ['/app/src/entry-client.tsx', `hydrateRoot(document, <App />)`],
      ['/app/src/client.tsx', `hydrateRoot(document, <StartClient />)`],
      ['/app/src/routes/__root.tsx', `const Doc = () => <html lang="en" />`],
      ['/app/src/root.jsx', `const Doc = () => <HTML>{children}</HTML>`],
      [
        '/app/src/index.tsx',
        `import { render } from 'solid-js/web'\nrender(() => <App />, el)`,
      ],
    ])('runs on %s', (id, code) => {
      expect(handler(code, id)).toBeDefined()
      expect(passes(id, code)).toBe(true)
    })

    it.each([
      ['/app/src/App.tsx', 'export const App = () => <div />'],
      ['/app/src/utils.ts', 'export const add = (a: number) => a + 1'],
    ])('skips %s', (id, code) => {
      expect(handler(code, id)).toBeUndefined()
      expect(passes(id, code)).toBe(false)
    })
  })

  describe('inject-plugin', () => {
    const { passes } = transformHook(
      plugins,
      '@tanstack/devtools:inject-plugin',
    )

    it.each([
      [
        '/app/src/routes/__root.tsx',
        `import { TanStackDevtools } from '@tanstack/react-devtools'`,
      ],
      [
        '/app/src/main.tsx',
        `import { jsxDEV } from "react/jsx-dev-runtime";\nimport { TanStackDevtools } from "@tanstack/react-devtools";`,
      ],
      [
        '/app/src/index.tsx',
        `import { TanStackDevtools } from '@tanstack/solid-devtools'`,
      ],
      [
        '/app/src/main.ts',
        `import { TanStackDevtoolsCore } from '@tanstack/devtools'`,
      ],
    ])('runs on %s', (id, code) => {
      expect(detectDevtoolsFile(code)).toBe(true)
      expect(passes(id, code)).toBe(true)
    })

    it.each([
      ['/app/src/App.tsx', `import { useState } from 'react'`],
      ['/app/src/utils.ts', 'export const add = (a: number) => a + 1'],
    ])('skips %s', (id, code) => {
      expect(detectDevtoolsFile(code)).toBe(false)
      expect(passes(id, code)).toBe(false)
    })

    it('skips installed packages that import devtools', () => {
      const code = `import { TanStackDevtools } from '@tanstack/react-devtools'`
      expect(passes('/app/node_modules/@acme/shell/dist/index.js', code)).toBe(
        false,
      )
    })
  })

  describe('connection-injection', () => {
    const { passes, handler } = transformHook(
      plugins,
      '@tanstack/devtools:connection-injection',
    )

    it.each([
      [
        '/app/node_modules/@tanstack/event-bus/dist/esm/client/client.js',
        'const port = __TANSTACK_DEVTOOLS_PORT__',
      ],
      [
        '/app/node_modules/.pnpm/@tanstack+devtools@0.10.0/node_modules/@tanstack/devtools/dist/esm/index.js',
        'const host = __TANSTACK_DEVTOOLS_HOST__',
      ],
      [
        '/app/node_modules/@tanstack/devtools-event-client/dist/esm/index.js',
        'const protocol = __TANSTACK_DEVTOOLS_PROTOCOL__',
      ],
    ])('runs on %s', (id, code) => {
      expect(handler(code, id)).toBeDefined()
      expect(passes(id, code)).toBe(true)
    })

    it.each([
      [
        '/app/node_modules/some-other-package/index.js',
        'const port = __TANSTACK_DEVTOOLS_PORT__',
      ],
      [
        '/app/node_modules/@tanstack/event-bus/dist/esm/index.js',
        'const x = 1',
      ],
      ['/app/src/App.tsx', 'export const App = () => <div />'],
    ])('skips %s', (id, code) => {
      expect(handler(code, id)).toBeUndefined()
      expect(passes(id, code)).toBe(false)
    })
  })

  describe('runtime-bridge', () => {
    const { passes, handler } = transformHook(
      plugins,
      '@tanstack/devtools:runtime-bridge',
    )

    it.each([
      [
        '/app/node_modules/@tanstack/devtools-event-client/dist/esm/plugin.js',
        'export class EventClient {}',
      ],
      ['/app/packages/event-bus-client/src/index.js', 'class EventClient {}'],
    ])('runs on %s', (id, code) => {
      expect(handler.call(ssr, code, id)).toBeDefined()
      expect(passes(id, code)).toBe(true)
    })

    it.each([
      [
        '/app/node_modules/@tanstack/devtools-event-client/dist/esm/plugin.js?v=1',
        'export class EventClient {}',
      ],
      [
        '/app/node_modules/@tanstack/devtools-event-client/dist/esm/index.js',
        `export * from './plugin.js'`,
      ],
      ['/app/src/client.ts', 'export class EventClient {}'],
    ])('skips %s', (id, code) => {
      expect(handler.call(ssr, code, id)).toBeUndefined()
      expect(passes(id, code)).toBe(false)
    })
  })
})

describe('transform hook filters in a Vite dev server', () => {
  let root: string
  let server: ViteDevServer
  const calls: Record<string, Array<string>> = {}

  const write = (file: string, code: string) => {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), code)
  }

  beforeAll(async () => {
    // The real path, as Vite resolves ids through symlinks such as macOS /var.
    root = realpathSync(mkdtempSync(join(tmpdir(), 'tsd-filters-')))
    write('App.tsx', 'export const App = () => <div>hi</div>\n')
    write('ids.ts', 'export const ids = () => new Map<string, number>()\n')
    write('style.css', 'a { color: red }\n')
    write(
      'node_modules/@tanstack/event-bus/dist/client.js',
      'export const port = __TANSTACK_DEVTOOLS_PORT__\n',
    )
    write(
      'node_modules/other/index.js',
      'export const port = __TANSTACK_DEVTOOLS_PORT__\n',
    )

    const devtoolsPlugins = devtools({
      eventBusConfig: { enabled: false },
      consolePiping: { enabled: false },
    })
    // Record which modules reach each handler.
    for (const plugin of devtoolsPlugins) {
      const hook = plugin.transform
      if (!hook || typeof hook === 'function') continue
      const handler = hook.handler as Handler
      ;(hook as { handler: Handler }).handler = function (code, id) {
        ;(calls[plugin.name] ??= []).push(id.slice(root.length).split('?')[0]!)
        return handler.call(this, code, id)
      }
    }

    server = await createServer({
      root,
      mode: 'development',
      configFile: false,
      logLevel: 'silent',
      server: { middlewareMode: true, ws: false },
      // The classic runtime needs no react import.
      oxc: { jsx: { runtime: 'classic' } },
      plugins: devtoolsPlugins,
    })
  })

  afterAll(async () => {
    await server.close()
    rmSync(root, { recursive: true, force: true })
  })

  it('calls the handlers only for the modules they transform', async () => {
    const app = await server.transformRequest('/App.tsx')
    await server.transformRequest('/ids.ts')
    await server.transformRequest('/style.css')
    const bus = await server.transformRequest(
      '/node_modules/@tanstack/event-bus/dist/client.js',
    )
    await server.transformRequest('/node_modules/other/index.js')

    expect(app?.code).toContain('data-tsd-source')
    expect(bus?.code).toContain('4206')
    expect(calls['@tanstack/devtools:inject-source']).toEqual(['/App.tsx'])
    expect(calls['@tanstack/devtools:connection-injection']).toEqual([
      '/node_modules/@tanstack/event-bus/dist/client.js',
    ])
    expect(calls['@tanstack/devtools:inject-plugin']).toBeUndefined()
    expect(calls['@tanstack/devtools:runtime-bridge']).toBeUndefined()
  })
})
