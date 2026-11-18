import { useState } from 'react'
import { registerDevtoolsTools } from '@tanstack/devtools-webmcp'
import { Button } from './button'

type ToolRecord = {
  name: string
  debugging: boolean
  signal: AbortSignal
  execute: (
    input: unknown,
    options: { signal: AbortSignal },
  ) => unknown | Promise<unknown>
}

type ModelContextTool = {
  name: string
  description: string
  annotations?: {
    debugging?: boolean
  }
  execute: ToolRecord['execute']
}

type ModelContext = {
  registerTool: (
    tool: ModelContextTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void>
}

type ActiveTool = {
  stop: () => void
  record: ToolRecord
}

let recorderReady = false
let onRecord: (record: ToolRecord) => void = () => {}

function ensureRecorder() {
  if (recorderReady) {
    return
  }

  const doc = document as Document & { modelContext?: ModelContext }
  const previous = doc.modelContext

  doc.modelContext = {
    async registerTool(tool, options) {
      const signal = options?.signal
      if (signal) {
        onRecord({
          name: tool.name,
          debugging: tool.annotations?.debugging === true,
          signal,
          execute: tool.execute,
        })
      }
      if (previous) {
        await previous.registerTool(tool, options)
      }
    },
  }
  recorderReady = true
}

export function WebMcpProof() {
  const [status, setStatus] = useState('No tool is registered.')
  const [active, setActive] = useState<ActiveTool | null>(null)

  function registerTool() {
    ensureRecorder()
    const previousSignal = active?.record.signal
    let recorded: ToolRecord | null = null
    onRecord = (record) => {
      recorded = record
    }

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

    if (!recorded) {
      setActive(null)
      setStatus('The helper did not register a tool.')
      return
    }

    const record: ToolRecord = recorded
    const debuggingText = record.debugging ? 'true' : 'false'
    const previousText =
      previousSignal === undefined
        ? ''
        : previousSignal.aborted
          ? ' The previous signal is aborted.'
          : ' The previous signal is still active.'

    setActive({ stop, record })
    setStatus(
      `Registered ${record.name}. debugging is ${debuggingText}.${previousText}`,
    )
  }

  function runTool() {
    if (!active) {
      return
    }
    const result = active.record.execute({}, { signal: active.record.signal })
    setStatus(`Tool result is ${JSON.stringify(result)}.`)
  }

  function stopTool() {
    if (!active) {
      return
    }
    active.stop()
    const name = active.record.name
    setActive(null)
    setStatus(
      active.record.signal.aborted
        ? `Stopped ${name}. The signal is aborted.`
        : `Stopped ${name}. The signal is still active.`,
    )
  }

  return (
    <section className="example-card" aria-labelledby="webmcp-tool-heading">
      <h2 id="webmcp-tool-heading">WebMCP tool</h2>
      <p>
        Register a development tool. Then read the name the browser receives.
      </p>
      <div className="example-button-row">
        <Button type="button" onClick={registerTool}>
          Register tool
        </Button>
        <Button type="button" onClick={runTool} disabled={active === null}>
          Run tool
        </Button>
        <Button type="button" onClick={stopTool} disabled={active === null}>
          Stop registration
        </Button>
      </div>
      <p aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </section>
  )
}
