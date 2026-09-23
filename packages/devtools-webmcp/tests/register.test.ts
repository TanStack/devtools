import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerDevtoolsTools } from '../src/register'
import type { MockInstance } from 'vitest'

declare global {
  interface Navigator {
    modelContext?: NonNullable<Document['modelContext']>
  }
}

interface SeenTool {
  name: string
  description: string
  title?: string
  inputSchema?: Record<string, unknown>
  annotations?: {
    debugging?: boolean
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
    consequentialHint?: boolean
  }
  execute?: (input: unknown, options: { signal: AbortSignal }) => unknown
}

interface RegisterCall {
  tool: SeenTool
  signal: AbortSignal | undefined
}

const stops: Array<() => void> = []

let consoleError: MockInstance

function createTool(
  name: string,
  execute: (input: unknown, options: { signal: AbortSignal }) => unknown = () =>
    undefined,
) {
  return {
    name,
    description: 'Read the library state.',
    execute,
  }
}

function isSignalOptions(value: unknown): value is { signal: AbortSignal } {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('signal' in value)) {
    return false
  }
  return value.signal instanceof AbortSignal
}

function watchRegisterTool(
  impl: (tool: SeenTool) => unknown = () => undefined,
) {
  const calls: Array<RegisterCall> = []
  function registerTool(tool: SeenTool, ...rest: Array<unknown>) {
    const options = rest[0]
    const signal = isSignalOptions(options) ? options.signal : undefined
    calls.push({ tool, signal })
    return impl(tool)
  }
  return { calls, registerTool }
}

function installDocumentContext(impl?: (tool: SeenTool) => unknown) {
  const watched = watchRegisterTool(impl)
  document.modelContext = { registerTool: watched.registerTool }
  return watched
}

function installNavigatorContext(impl?: (tool: SeenTool) => unknown) {
  const watched = watchRegisterTool(impl)
  navigator.modelContext = { registerTool: watched.registerTool }
  return watched
}

function register(options: Parameters<typeof registerDevtoolsTools>[0]) {
  const stop = registerDevtoolsTools(options)
  stops.push(stop)
  return stop
}

function signalAt(calls: Array<RegisterCall>, index: number) {
  const signal = calls[index]?.signal
  expect(signal).toBeInstanceOf(AbortSignal)
  if (!(signal instanceof AbortSignal)) {
    throw new Error(`registerTool call ${index} has no AbortSignal`)
  }
  return signal
}

function expectRegistered(
  calls: Array<RegisterCall>,
  index: number,
  name: string,
) {
  const call = calls[index]
  expect(call?.tool.name).toBe(name)
  expect(call?.tool.annotations).toEqual({ debugging: true })
  expect(call?.signal).toBeInstanceOf(AbortSignal)
}

function clearModelContext() {
  delete document.modelContext
  delete navigator.modelContext
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  clearModelContext()
})

afterEach(() => {
  for (const stop of stops) {
    stop()
  }
  stops.length = 0
  consoleError.mockRestore()
  clearModelContext()
})

describe('registerDevtoolsTools', () => {
  it('returns a cleanup without logging when modelContext is missing', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.missing',
      tools: [createTool('getQueryCache')],
    })
    const signal = signalAt(watched.calls, 0)
    clearModelContext()
    consoleError.mockClear()

    const stop = register({
      pluginId: 'tanstack.query.missing',
      tools: [createTool('listQueries')],
    })

    expect(stop).toBeTypeOf('function')
    expect(() => {
      stop()
    }).not.toThrow()
    expect(consoleError).not.toHaveBeenCalled()
    expect(signal.aborted).toBe(false)
  })

  it('registers the prefixed name on document.modelContext with debugging true', () => {
    const execute = () => ({ queries: [] })
    const inputSchema = {
      type: 'object',
      properties: {
        queryHash: { type: 'string' },
      },
    }
    const documentContext = installDocumentContext()
    const navigatorContext = installNavigatorContext()

    register({
      pluginId: 'tanstack.query',
      instanceId: 'main',
      tools: [
        {
          name: 'getQueryCache',
          title: 'Query cache',
          description: 'Return a JSON summary of the query cache.',
          inputSchema,
          annotations: {
            readOnlyHint: true,
            untrustedContentHint: false,
            consequentialHint: true,
          },
          execute,
        },
      ],
    })

    expect(documentContext.calls).toEqual([
      {
        tool: {
          name: 'tanstack.query.main.getQueryCache',
          title: 'Query cache',
          description: 'Return a JSON summary of the query cache.',
          inputSchema,
          annotations: {
            readOnlyHint: true,
            untrustedContentHint: false,
            consequentialHint: true,
            debugging: true,
          },
          execute,
        },
        signal: expect.any(AbortSignal),
      },
    ])
    expect(documentContext.calls[0]?.tool.execute).toBe(execute)
    expect(documentContext.calls[0]?.tool.inputSchema).toBe(inputSchema)
    expect(navigatorContext.calls).toEqual([])
  })

  it('uses navigator.modelContext when document.modelContext.registerTool is missing', () => {
    const navigatorContext = installNavigatorContext()
    // The DOM type requires registerTool. This object omits it at runtime.
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      writable: true,
      value: {},
    })

    register({
      pluginId: 'tanstack.query.nav',
      tools: [createTool('getQueryCache')],
    })

    expect(navigatorContext.calls).toHaveLength(1)
    expectRegistered(
      navigatorContext.calls,
      0,
      'tanstack.query.nav.getQueryCache',
    )
    expect(document.modelContext?.registerTool).toBeUndefined()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('aborts the first signal and registers the new tool on a second call', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.replace',
      instanceId: 'main',
      tools: [createTool('getQueryCache')],
    })
    const firstSignal = signalAt(watched.calls, 0)

    register({
      pluginId: 'tanstack.query.replace',
      instanceId: 'main',
      tools: [createTool('listQueries')],
    })

    expect(firstSignal.aborted).toBe(true)
    expectRegistered(
      watched.calls,
      1,
      'tanstack.query.replace.main.listQueries',
    )
  })

  it('does nothing when the first cleanup runs after a replacement', () => {
    const watched = installDocumentContext()
    const firstStop = register({
      pluginId: 'tanstack.query.oldstop',
      tools: [createTool('getQueryCache')],
    })
    register({
      pluginId: 'tanstack.query.oldstop',
      tools: [createTool('listQueries')],
    })
    const secondSignal = signalAt(watched.calls, 1)

    firstStop()

    expect(secondSignal.aborted).toBe(false)
    expect(watched.calls).toHaveLength(2)
  })

  it('aborts the previous signal and registers no tool when tools is empty', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.empty',
      tools: [createTool('getQueryCache')],
    })
    const firstSignal = signalAt(watched.calls, 0)
    watched.calls.length = 0

    register({
      pluginId: 'tanstack.query.empty',
      tools: [],
    })

    expect(firstSignal.aborted).toBe(true)
    expect(watched.calls).toEqual([])
  })

  it('logs once and keeps the previous registration when pluginId is illegal', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.keep',
      tools: [createTool('getQueryCache')],
    })
    const firstSignal = signalAt(watched.calls, 0)
    watched.calls.length = 0
    consoleError.mockClear()

    const stop = register({
      pluginId: 'tanstack query',
      tools: [createTool('getQueryCache')],
    })

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Devtools WebMCP skipped registration. pluginId "tanstack query" is not legal. Use letters, digits, "_", "-", and ".".',
    )
    expect(watched.calls).toEqual([])
    expect(firstSignal.aborted).toBe(false)
    stop()
    expect(firstSignal.aborted).toBe(false)
  })

  it('skips an illegal tool name and registers the legal tool', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.skip',
      tools: [createTool('getQueryCache')],
    })
    const previousSignal = signalAt(watched.calls, 0)
    watched.calls.length = 0
    consoleError.mockClear()

    register({
      pluginId: 'tanstack.query.skip',
      tools: [createTool('bad name'), createTool('listQueries')],
    })

    expect(previousSignal.aborted).toBe(true)
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Devtools WebMCP skipped "bad name". The tool name is not legal. Use letters, digits, "_", "-", and ".".',
    )
    expect(watched.calls).toHaveLength(1)
    expectRegistered(watched.calls, 0, 'tanstack.query.skip.listQueries')
  })

  it('logs a rejected registerTool promise without rejecting the caller', async () => {
    const watched = installDocumentContext((tool) => {
      if (tool.name === 'tanstack.query.reject.getQueryCache') {
        return Promise.reject(new Error('register failed'))
      }
      return undefined
    })

    const stop = register({
      pluginId: 'tanstack.query.reject',
      tools: [createTool('getQueryCache'), createTool('listQueries')],
    })

    expect(stop).toBeTypeOf('function')
    expect(watched.calls).toHaveLength(2)
    expectRegistered(watched.calls, 1, 'tanstack.query.reject.listQueries')
    await flushPromises()
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Devtools WebMCP failed to register "tanstack.query.reject.getQueryCache".',
      expect.objectContaining({ message: 'register failed' }),
    )
  })

  it('does not log a registerTool rejection after abort', async () => {
    let rejectRegistration: ((reason: unknown) => void) | undefined
    const watched = installDocumentContext(
      () =>
        new Promise((_resolve, reject) => {
          rejectRegistration = reject
        }),
    )

    const stop = register({
      pluginId: 'tanstack.query.abortlog',
      tools: [createTool('getQueryCache')],
    })
    stop()
    expect(rejectRegistration).toBeTypeOf('function')
    if (rejectRegistration === undefined) {
      throw new Error('registerTool did not return a promise')
    }
    rejectRegistration(new Error('aborted'))
    await flushPromises()

    expect(watched.calls).toHaveLength(1)
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('aborts the signal passed to registerTool on cleanup', () => {
    const watched = installDocumentContext()
    const stop = register({
      pluginId: 'tanstack.query.stop',
      tools: [createTool('getQueryCache')],
    })
    const signal = signalAt(watched.calls, 0)

    expect(signal.aborted).toBe(false)
    stop()
    expect(signal.aborted).toBe(true)
  })

  it('treats an empty instanceId like an omitted instanceId', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.blank',
      tools: [createTool('getQueryCache')],
    })
    const firstSignal = signalAt(watched.calls, 0)

    register({
      pluginId: 'tanstack.query.blank',
      instanceId: '',
      tools: [createTool('listQueries')],
    })

    expect(firstSignal.aborted).toBe(true)
    expectRegistered(watched.calls, 1, 'tanstack.query.blank.listQueries')
  })

  it('does not abort a different instanceId', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.pair',
      instanceId: 'main',
      tools: [createTool('getQueryCache')],
    })
    const mainSignal = signalAt(watched.calls, 0)

    register({
      pluginId: 'tanstack.query.pair',
      instanceId: 'other',
      tools: [createTool('getQueryCache')],
    })

    expect(mainSignal.aborted).toBe(false)
    expectRegistered(
      watched.calls,
      1,
      'tanstack.query.pair.other.getQueryCache',
    )
  })

  it('skips a tool when the full name is longer than 128 characters', () => {
    const watched = installDocumentContext()
    // pluginId "tanstack.query.long" is 19 characters. 19 + 1 + 109 = 129.
    const longName = 'n'.repeat(109)

    register({
      pluginId: 'tanstack.query.long',
      tools: [createTool(longName), createTool('getQueryCache')],
    })

    expect(consoleError).toHaveBeenCalledTimes(1)
    const logged = consoleError.mock.calls[0]?.[0]
    expect(logged).toEqual(
      expect.stringContaining('The full name is longer than 128 characters.'),
    )
    expect(logged).toEqual(expect.stringContaining(longName))
    expect(watched.calls).toHaveLength(1)
    expectRegistered(watched.calls, 0, 'tanstack.query.long.getQueryCache')
  })

  it('logs once and keeps the previous registration when instanceId is illegal', () => {
    const watched = installDocumentContext()
    register({
      pluginId: 'tanstack.query.badinstance',
      instanceId: 'main',
      tools: [createTool('getQueryCache')],
    })
    const firstSignal = signalAt(watched.calls, 0)
    watched.calls.length = 0
    consoleError.mockClear()

    const stop = register({
      pluginId: 'tanstack.query.badinstance',
      instanceId: 'bad id',
      tools: [createTool('getQueryCache')],
    })

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Devtools WebMCP skipped registration. instanceId "bad id" is not legal. Use letters, digits, "_", "-", and ".".',
    )
    expect(watched.calls).toEqual([])
    expect(firstSignal.aborted).toBe(false)
    stop()
    expect(firstSignal.aborted).toBe(false)
  })

  it('logs a thrown registerTool error and registers the next tool', () => {
    const watched = installDocumentContext((tool) => {
      if (tool.name === 'tanstack.query.throw.badTool') {
        throw new Error('register failed')
      }
      return undefined
    })

    const stop = register({
      pluginId: 'tanstack.query.throw',
      tools: [createTool('badTool'), createTool('getQueryCache')],
    })

    expect(stop).toBeTypeOf('function')
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Devtools WebMCP failed to register "tanstack.query.throw.badTool".',
      expect.objectContaining({ message: 'register failed' }),
    )
    expect(watched.calls).toHaveLength(2)
    expectRegistered(watched.calls, 1, 'tanstack.query.throw.getQueryCache')
  })
})
