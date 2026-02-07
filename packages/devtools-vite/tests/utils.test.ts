import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizePath } from 'vite'
import { handleDevToolsViteRequest, parseOpenSourceParam } from '../src/utils'

function createMockReq(url?: string) {
  const emitter = new EventEmitter() as unknown as EventEmitter & {
    url?: string
    on: (event: string, listener: (...args: Array<any>) => void) => any
  }
  ;(emitter as any).url = url
  return emitter as any
}

function createMockRes() {
  return {
    setHeader: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  }
}

describe('handleDevToolsViteRequest', () => {
  let next: ReturnType<typeof vi.fn>
  let cb: ReturnType<typeof vi.fn>

  beforeEach(() => {
    next = vi.fn()
    cb = vi.fn()
  })

  it('calls next() when url does not include __tsd', () => {
    const req = createMockReq('/some/other/path')
    const res = createMockRes()

    handleDevToolsViteRequest(req, res as any, next as any, cb as any)

    expect(next).toHaveBeenCalledTimes(1)
    expect(cb).not.toHaveBeenCalled()
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(res.write).not.toHaveBeenCalled()
    expect(res.end).not.toHaveBeenCalled()
  })

  it('handles __tsd/open-source with valid source and responds/ends', () => {
    const file = 'src/file.ts'
    const line = '12'
    const column = '5'
    const url = `/__tsd/open-source?source=${encodeURIComponent(`${file}:${line}:${column}`)}`

    const req = createMockReq(url)
    const res = createMockRes()

    handleDevToolsViteRequest(req, res as any, next as any, cb as any)

    // callback payload
    expect(cb).toHaveBeenCalledTimes(1)
    const payload = cb.mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      type: 'open-source',
      routine: 'open-source',
    })
    expect(payload.data.line).toBe(line)
    expect(payload.data.column).toBe(column)

    const expectedSource = normalizePath(`${process.cwd()}/${file}`)
    expect(payload.data.source).toBe(expectedSource)

    // response behavior
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html')
    expect(res.write).toHaveBeenCalledWith('<script> window.close(); </script>')
    expect(res.end).toHaveBeenCalled()

    // next() is not called for handled route
    expect(next).not.toHaveBeenCalled()
  })

  it('does nothing for __tsd/open-source when source is missing', () => {
    const req = createMockReq('/__tsd/open-source')
    const res = createMockRes()

    handleDevToolsViteRequest(req, res as any, next as any, cb as any)

    expect(cb).not.toHaveBeenCalled()
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(res.write).not.toHaveBeenCalled()
    expect(res.end).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('does nothing for __tsd/open-source when source is malformed', () => {
    const malformed = encodeURIComponent('src/file.ts:abc:def')
    const req = createMockReq(`/__tsd/open-source?source=${malformed}`)
    const res = createMockRes()

    handleDevToolsViteRequest(req, res as any, next as any, cb as any)

    expect(cb).not.toHaveBeenCalled()
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(res.write).not.toHaveBeenCalled()
    expect(res.end).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('parses JSON body for other __tsd requests and writes OK', () => {
    const req = createMockReq('/__tsd/some-endpoint')
    const res = createMockRes()

    handleDevToolsViteRequest(req, res as any, next as any, cb as any)

    // simulate streaming body
    const chunks = [Buffer.from('{"foo":'), Buffer.from('1}')]
    req.emit('data', chunks[0])
    req.emit('data', chunks[1])
    req.emit('end')

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({ foo: 1 })
    expect(res.write).toHaveBeenCalledWith('OK')
    expect(res.end).toHaveBeenCalled()

    // these are not used in this branch
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('swallows JSON parse errors but still writes OK', () => {
    const req = createMockReq('/__tsd/another')
    const res = createMockRes()

    handleDevToolsViteRequest(req, res as any, next as any, cb as any)
    req.emit('data', Buffer.from('{ invalid json'))
    req.emit('end')

    expect(cb).not.toHaveBeenCalled()
    expect(res.write).toHaveBeenCalledWith('OK')
    expect(res.end).toHaveBeenCalled()
  })
})

describe('parseOpenSourceParam', () => {
  it('parses simple filename foo.tsx with line/column', () => {
    const input = 'foo.tsx:10:20'
    const parsed = parseOpenSourceParam(input)
    expect(parsed).toEqual({ file: 'foo.tsx', line: '10', column: '20' })
  })

  it('parses filename containing colon bar:baz.tsx with line/column', () => {
    const input = 'bar:baz.tsx:3:7'
    const parsed = parseOpenSourceParam(input)
    expect(parsed).toEqual({ file: 'bar:baz.tsx', line: '3', column: '7' })
  })
})
