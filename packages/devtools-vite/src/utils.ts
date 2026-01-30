import fs from 'node:fs/promises'
import { normalizePath } from 'vite'
import type { Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PackageJson } from '@tanstack/devtools-client'

export type DevToolsRequestHandler = (data: any) => void

export type DevToolsViteRequestOptions = {
  onOpenSource?: DevToolsRequestHandler
  onConsolePipe?: (entries: Array<any>) => void
  onServerConsolePipe?: (entries: Array<any>) => void
  onConsolePipeSSE?: (
    res: ServerResponse<IncomingMessage>,
    req: Connect.IncomingMessage,
  ) => void
}

export const handleDevToolsViteRequest = (
  req: Connect.IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  next: Connect.NextFunction,
  cbOrOptions: DevToolsRequestHandler | DevToolsViteRequestOptions,
) => {
  // Normalize to options object for backward compatibility
  const options: DevToolsViteRequestOptions =
    typeof cbOrOptions === 'function'
      ? { onOpenSource: cbOrOptions }
      : cbOrOptions

  // Handle open-source requests
  if (req.url?.includes('__tsd/open-source')) {
    const searchParams = new URLSearchParams(req.url.split('?')[1])

    const source = searchParams.get('source')
    if (!source) {
      return
    }

    const parsed = parseOpenSourceParam(source)
    if (!parsed) {
      return
    }
    const { file, line, column } = parsed

    options.onOpenSource?.({
      type: 'open-source',
      routine: 'open-source',
      data: {
        source: file ? normalizePath(`${process.cwd()}/${file}`) : undefined,
        line,
        column,
      },
    })
    res.setHeader('Content-Type', 'text/html')
    res.write(`<script> window.close(); </script>`)
    res.end()
    return
  }

  // Handle console-pipe SSE endpoint
  if (req.url?.includes('__tsd/console-pipe/sse') && req.method === 'GET') {
    if (options.onConsolePipeSSE) {
      options.onConsolePipeSSE(res, req)
      return
    }
    return next()
  }

  // Handle server console-pipe POST endpoint (from app server runtime)
  if (req.url?.includes('__tsd/console-pipe/server') && req.method === 'POST') {
    if (options.onServerConsolePipe) {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const { entries } = JSON.parse(body)
          options.onServerConsolePipe!(entries)
          res.statusCode = 200
          res.end('OK')
        } catch (err) {
          res.statusCode = 400
          res.end('Bad Request')
        }
      })
      return
    }
    return next()
  }

  // Handle console-pipe POST endpoint (from client)
  if (req.url?.includes('__tsd/console-pipe') && req.method === 'POST') {
    if (options.onConsolePipe) {
      let body = ''
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })
      req.on('end', () => {
        try {
          const { entries } = JSON.parse(body)
          options.onConsolePipe!(entries)
          res.statusCode = 200
          res.end('OK')
        } catch (err) {
          res.statusCode = 400
          res.end('Bad Request')
        }
      })
      return
    }
    return next()
  }

  if (!req.url?.includes('__tsd')) {
    return next()
  }

  const chunks: Array<any> = []
  req.on('data', (chunk) => {
    chunks.push(chunk)
  })
  req.on('end', () => {
    const dataToParse = Buffer.concat(chunks)
    try {
      const parsedData = JSON.parse(dataToParse.toString())
      options.onOpenSource?.(parsedData)
    } catch (e) {}
    res.write('OK')
  })
}

export const parseOpenSourceParam = (source: string) => {
  // Capture everything up to the last two colon-separated numeric parts as the file.
  // This supports filenames that may themselves contain colons.
  const parts = source.match(/^(.+):(\d+):(\d+)$/)

  if (!parts) return null

  const [, file, line, column] = parts
  return { file, line, column }
}

const tryReadFile = async (filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return data
  } catch (error) {
    return null
  }
}

export const tryParseJson = <T extends any>(
  jsonString: string | null | undefined,
) => {
  if (!jsonString) {
    return null
  }
  try {
    const result = JSON.parse(jsonString)
    return result as T
  } catch (error) {
    return null
  }
}

export const readPackageJson = async () =>
  tryParseJson<PackageJson>(await tryReadFile(process.cwd() + '/package.json'))
