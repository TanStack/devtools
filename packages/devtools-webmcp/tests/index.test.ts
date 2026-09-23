import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerDevtoolsTools } from '../src'
import { registerDevtoolsTools as registerDevtoolsToolsProduction } from '../src/production'

interface SeenTool {
  name: string
  description: string
  annotations?: {
    debugging?: boolean
  }
}

function createTool(name: string) {
  return {
    name,
    description: 'Return a JSON summary of the query cache.',
    execute: () => ({ status: 'ok' }),
  }
}

function installDocumentContext() {
  const calls: Array<SeenTool> = []
  const registerTool = (tool: SeenTool): void => {
    calls.push(tool)
  }
  document.modelContext = { registerTool }
  return calls
}

function expectRegistered(calls: Array<SeenTool>, name: string) {
  expect(calls).toHaveLength(1)
  expect(calls[0]?.name).toBe(name)
  expect(calls[0]?.annotations?.debugging).toBe(true)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  delete document.modelContext
})

describe('registerDevtoolsTools', () => {
  it('returns a cleanup function and does not call registerTool when NODE_ENV is test', () => {
    const calls = installDocumentContext()

    const stop = registerDevtoolsTools({
      pluginId: 'tanstack.query.noop',
      tools: [createTool('getQueryCache')],
    })

    expect(stop).toBeTypeOf('function')
    stop()
    expect(calls).toEqual([])
  })

  it('calls registerTool from the root import when NODE_ENV is development', async () => {
    const calls = installDocumentContext()
    vi.stubEnv('NODE_ENV', 'development')
    vi.resetModules()
    // The re-import is required because NODE_ENV is read at module load.
    const { registerDevtoolsTools: registerInDevelopment } = await import(
      '../src'
    )

    const stop = registerInDevelopment({
      pluginId: 'tanstack.query',
      tools: [createTool('getQueryCache')],
    })

    expectRegistered(calls, 'tanstack.query.getQueryCache')
    stop()
  })

  it('calls registerTool from the production import when NODE_ENV is test', () => {
    const calls = installDocumentContext()

    const stop = registerDevtoolsToolsProduction({
      pluginId: 'tanstack.query.production',
      tools: [createTool('getQueryCache')],
    })

    expectRegistered(calls, 'tanstack.query.production.getQueryCache')
    stop()
  })
})
