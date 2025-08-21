import { normalizePath } from 'vite'
import type { Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const handleDevToolsViteRequest = (
  req: Connect.IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  next: Connect.NextFunction,
  cb: (data: any) => void,
) => {
  if (req.url?.includes('__tsd/open-source')) {
    const searchParams = new URLSearchParams(req.url.split('?')[1])
    const source = searchParams.get('source')
    const line = searchParams.get('line')
    const column = searchParams.get('column')
    cb({
      type: 'open-source',
      routine: 'open-source',
      data: {
        source: source
          ? normalizePath(`${process.cwd()}/${source}`)
          : undefined,
        line,
        column,
      },
    })
    res.setHeader('Content-Type', 'text/html')
    res.write(`<script> window.close(); </script>`)
    res.end()
    return
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
      cb(parsedData)
    } catch (e) {}
    res.write('OK')
  })
}

export async function checkPath(
  routePath: string,
  extensions = ['.tsx', '.jsx', '.ts', '.js'],
) {
  const fs = await import('node:fs')
  // Check if the path exists as a directory
  if (fs.existsSync(routePath) && fs.lstatSync(routePath).isDirectory()) {
    return { validPath: routePath, type: 'directory' } as const
  }

  // Check if the path exists as a file with one of the given extensions
  for (const ext of extensions) {
    const filePath = `${routePath}${ext}`
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      return { validPath: filePath, type: 'file' } as const
    }
  }

  // If neither a file nor a directory is found
  return null
}
