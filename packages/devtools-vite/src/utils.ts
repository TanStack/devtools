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
    if (!source) {
      return;
    }
    const [file, line, column] = source.split(':')

    cb({
      type: 'open-source',
      routine: 'open-source',
      data: {
        source: file
          ? normalizePath(`${process.cwd()}/${file}`)
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
    } catch (e) { }
    res.write('OK')
  })
}

