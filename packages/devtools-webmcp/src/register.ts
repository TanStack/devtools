import type { DevtoolsTool, RegisterDevtoolsToolsOptions } from './types'

const legalNamePattern = /^[A-Za-z0-9_.-]+$/
const maxFullNameLength = 128
const registrations = new Map<string, AbortController>()

interface WebMcpToolAnnotations {
  debugging: true
  readOnlyHint?: boolean
  untrustedContentHint?: boolean
  consequentialHint?: boolean
}

interface WebMcpToolRegistration {
  name: string
  title?: string
  description: string
  inputSchema?: Record<string, unknown>
  annotations: WebMcpToolAnnotations
  execute: DevtoolsTool['execute']
}

interface RegisterableModelContext {
  registerTool: (
    tool: WebMcpToolRegistration,
    options: { signal: AbortSignal },
  ) => unknown
}

function noopCleanup() {}

function isLegalNamePart(value: string) {
  return legalNamePattern.test(value)
}

// An empty instanceId is the same as an omitted instanceId.
function normalizedInstanceId(instanceId: string | undefined) {
  if (instanceId === undefined || instanceId === '') {
    return undefined
  }
  return instanceId
}

function registrationKey(pluginId: string, instanceId: string | undefined) {
  if (instanceId === undefined) {
    return pluginId
  }
  // `\0` is not a legal name character, so two pairs cannot share a key.
  return `${pluginId}\0${instanceId}`
}

function browserToolName(
  pluginId: string,
  instanceId: string | undefined,
  name: string,
) {
  if (instanceId === undefined) {
    return `${pluginId}.${name}`
  }
  return `${pluginId}.${instanceId}.${name}`
}

function hasModelContextKey(host: object): host is { modelContext?: unknown } {
  return 'modelContext' in host
}

function modelContextOf(host: object | undefined) {
  if (host === undefined || !hasModelContextKey(host)) {
    return undefined
  }
  return host.modelContext
}

function globalHost(name: 'document' | 'navigator') {
  if (name === 'document') {
    if (typeof document === 'undefined') {
      return undefined
    }
    return document
  }
  if (typeof navigator === 'undefined') {
    return undefined
  }
  return navigator
}

function hasRegisterTool(
  context: unknown,
): context is RegisterableModelContext {
  const isObject = typeof context === 'object' && context !== null
  if (!isObject) {
    return false
  }
  if (!('registerTool' in context)) {
    return false
  }
  return typeof context.registerTool === 'function'
}

function readModelContext() {
  const documentContext = modelContextOf(globalHost('document'))
  if (hasRegisterTool(documentContext)) {
    return documentContext
  }
  const navigatorContext = modelContextOf(globalHost('navigator'))
  if (hasRegisterTool(navigatorContext)) {
    return navigatorContext
  }
  return undefined
}

function logIllegalPart(part: 'pluginId' | 'instanceId', value: string) {
  console.error(
    `Devtools WebMCP skipped registration. ${part} "${value}" is not legal. Use letters, digits, "_", "-", and ".".`,
  )
}

function idsAreLegal(pluginId: string, instanceId: string | undefined) {
  const pluginIdIsLegal = isLegalNamePart(pluginId)
  const instanceIdIsLegal =
    instanceId === undefined || isLegalNamePart(instanceId)

  if (!pluginIdIsLegal) {
    logIllegalPart('pluginId', pluginId)
  }
  if (instanceId !== undefined && !isLegalNamePart(instanceId)) {
    logIllegalPart('instanceId', instanceId)
  }

  return pluginIdIsLegal && instanceIdIsLegal
}

function toolSkipReason(name: string, fullName: string) {
  if (!isLegalNamePart(name)) {
    return `Devtools WebMCP skipped "${name}". The tool name is not legal. Use letters, digits, "_", "-", and ".".`
  }
  if (fullName.length > maxFullNameLength) {
    return `Devtools WebMCP skipped "${fullName}". The full name is longer than 128 characters.`
  }
  return undefined
}

function toRegistration(tool: DevtoolsTool, name: string) {
  const registration: WebMcpToolRegistration = {
    name,
    description: tool.description,
    annotations: {
      ...tool.annotations,
      debugging: true,
    },
    execute: tool.execute,
  }
  if (tool.title !== undefined) {
    registration.title = tool.title
  }
  if (tool.inputSchema !== undefined) {
    registration.inputSchema = tool.inputSchema
  }
  return registration
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (typeof value !== 'object' && typeof value !== 'function') {
    return false
  }
  if (value === null) {
    return false
  }
  if (!('then' in value)) {
    return false
  }
  return typeof value.then === 'function'
}

function watchRegistration(
  result: unknown,
  signal: AbortSignal,
  fullName: string,
) {
  if (!isPromiseLike(result)) {
    return
  }
  void Promise.resolve(result).then(
    () => undefined,
    (error: unknown) => {
      // The browser can reject an in-flight registerTool call after abort.
      if (signal.aborted) {
        return
      }
      console.error(`Devtools WebMCP failed to register "${fullName}".`, error)
    },
  )
}

function registerOne(
  modelContext: RegisterableModelContext,
  tool: DevtoolsTool,
  fullName: string,
  signal: AbortSignal,
) {
  try {
    const result = modelContext.registerTool(toRegistration(tool, fullName), {
      signal,
    })
    watchRegistration(result, signal, fullName)
  } catch (error) {
    if (signal.aborted) {
      return
    }
    console.error(`Devtools WebMCP failed to register "${fullName}".`, error)
  }
}

function releaseRegistration(key: string, controller: AbortController) {
  if (registrations.get(key) !== controller) {
    return
  }
  registrations.delete(key)
  controller.abort()
}

function replaceRegistration(key: string) {
  const previous = registrations.get(key)
  if (previous !== undefined) {
    registrations.delete(key)
    previous.abort()
  }
  const controller = new AbortController()
  registrations.set(key, controller)
  return controller
}

/**
 * Register WebMCP tools for one plugin on the page.
 *
 * `options.pluginId` is required. `options.instanceId` is optional.
 * An empty `instanceId` means the same as an omitted `instanceId`.
 * When `instanceId` is omitted, the browser tool name is `pluginId.name`.
 * When `instanceId` is set, the browser tool name is `pluginId.instanceId.name`.
 * The helper sets `annotations.debugging` to `true`.
 *
 * The function returns a cleanup function. The caller removes the tools with that function.
 * A second call with the same `pluginId` and `instanceId` replaces the previous tools.
 * The previous cleanup function then does nothing.
 *
 * This function does not throw. It writes one `console.error` for each failure.
 *
 * @param options - The plugin id, the optional instance id, and the tools to register.
 *
 * @example
 * ```ts
 * const stop = registerDevtoolsTools({
 *   pluginId: 'tanstack.query',
 *   instanceId: 'main',
 *   tools: [
 *     {
 *       name: 'getQueryCache',
 *       description: 'Return a JSON summary of the query cache.',
 *       execute: (input) => summarize(input),
 *     },
 *   ],
 * })
 *
 * stop()
 * ```
 */
export function registerDevtoolsTools(options: RegisterDevtoolsToolsOptions) {
  const modelContext = readModelContext()
  if (modelContext === undefined) {
    return noopCleanup
  }

  const instanceId = normalizedInstanceId(options.instanceId)
  if (!idsAreLegal(options.pluginId, instanceId)) {
    return noopCleanup
  }

  const key = registrationKey(options.pluginId, instanceId)
  const controller = replaceRegistration(key)
  const tools = options.tools

  for (const tool of tools) {
    const fullName = browserToolName(options.pluginId, instanceId, tool.name)
    const skipReason = toolSkipReason(tool.name, fullName)
    if (skipReason !== undefined) {
      console.error(skipReason)
      continue
    }
    registerOne(modelContext, tool, fullName, controller.signal)
  }

  return () => {
    releaseRegistration(key, controller)
  }
}
