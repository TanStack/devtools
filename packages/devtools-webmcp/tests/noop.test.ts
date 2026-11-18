import { describe, expect, it } from 'vitest'
import { registerDevtoolsTools } from '../src/noop'

interface RegisteredTool {
  name: string
  description: string
}

interface ModelContext {
  registerTool: (tool: RegisteredTool) => void
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
}

describe('registerDevtoolsTools', () => {
  it('returns a cleanup function and does not call registerTool', () => {
    const calls: Array<RegisteredTool> = []

    const registerTool = (tool: RegisteredTool): void => {
      calls.push(tool)
    }

    document.modelContext = { registerTool }

    try {
      const stop = registerDevtoolsTools({
        pluginId: 'tanstack.query',
        instanceId: 'main',
        tools: [
          {
            name: 'getQueryCache',
            description: 'Return a JSON summary of the query cache.',
            execute: () => ({ status: 'ok' }),
          },
        ],
      })

      expect(stop).toBeTypeOf('function')
      expect(() => {
        stop()
      }).not.toThrow()
      expect(calls).toEqual([])
    } finally {
      delete document.modelContext
    }
  })
})
