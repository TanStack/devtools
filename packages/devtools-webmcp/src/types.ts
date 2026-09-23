export interface DevtoolsToolAnnotations {
  readOnlyHint?: boolean
  untrustedContentHint?: boolean
  consequentialHint?: boolean
}

export interface DevtoolsTool<TInput = any> {
  name: string
  title?: string
  description: string
  inputSchema?: Record<string, unknown>
  annotations?: DevtoolsToolAnnotations
  execute: (
    input: TInput,
    options: { signal: AbortSignal },
  ) => unknown | Promise<unknown>
}

export interface RegisterDevtoolsToolsOptions {
  pluginId: string
  instanceId?: string
  tools: Array<DevtoolsTool>
}
