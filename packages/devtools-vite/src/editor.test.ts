import { describe, expect, it, vi } from 'vitest'
import { handleOpenSource } from './editor'

describe('handleOpenSource', () => {
  it('calls openInEditor with source, stringified line and column when all provided', async () => {
    const openInEditor = vi.fn().mockResolvedValue(undefined)
    await handleOpenSource({
      data: { type: 'open-source', data: { source: '/app/routes/foo.tsx', line: 10, column: 5 } },
      openInEditor,
    })
    expect(openInEditor).toHaveBeenCalledOnce()
    expect(openInEditor).toHaveBeenCalledWith('/app/routes/foo.tsx', '10', '5')
  })

  it('calls openInEditor with source only when line and column are undefined', async () => {
    const openInEditor = vi.fn().mockResolvedValue(undefined)
    await handleOpenSource({
      data: { type: 'open-source', data: { source: '/app/routes/bar.tsx' } },
      openInEditor,
    })
    expect(openInEditor).toHaveBeenCalledOnce()
    expect(openInEditor).toHaveBeenCalledWith('/app/routes/bar.tsx', undefined, undefined)
  })

  it('does NOT call openInEditor and returns undefined when source is absent', async () => {
    const openInEditor = vi.fn()
    const result = await handleOpenSource({
      data: { type: 'open-source', data: { line: 1, column: 2 } },
      openInEditor,
    })
    expect(openInEditor).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('treats falsy line: 0 and column: 0 as undefined (truthy check in impl)', async () => {
    const openInEditor = vi.fn().mockResolvedValue(undefined)
    await handleOpenSource({
      data: { type: 'open-source', data: { source: '/app/routes/baz.tsx', line: 0, column: 0 } },
      openInEditor,
    })
    expect(openInEditor).toHaveBeenCalledOnce()
    expect(openInEditor).toHaveBeenCalledWith('/app/routes/baz.tsx', undefined, undefined)
  })

  it('calls openInEditor with stringified line and undefined column when only line is provided', async () => {
    const openInEditor = vi.fn().mockResolvedValue(undefined)
    await handleOpenSource({
      data: { type: 'open-source', data: { source: '/app/routes/qux.tsx', line: 42 } },
      openInEditor,
    })
    expect(openInEditor).toHaveBeenCalledOnce()
    expect(openInEditor).toHaveBeenCalledWith('/app/routes/qux.tsx', '42', undefined)
  })
})
