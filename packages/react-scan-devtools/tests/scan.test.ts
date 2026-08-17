import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const scan = vi.fn()
const setOptions = vi.fn()

vi.mock('react-scan', () => ({
  scan: (...args: Array<unknown>) => scan(...args),
  setOptions: (...args: Array<unknown>) => setOptions(...args),
}))

beforeEach(() => {
  vi.resetModules()
  scan.mockReset()
  setOptions.mockReset()
  localStorage.clear()
})

afterEach(() => {
  vi.resetModules()
})

describe('startReactScan', () => {
  it('calls scan once with showToolbar false', async () => {
    const { startReactScan } = await import('../src/core/scan')
    startReactScan({ enabled: true, log: true })
    expect(scan).toHaveBeenCalledTimes(1)
    expect(scan).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        log: true,
        showToolbar: false,
        onRender: expect.any(Function),
      }),
    )
    expect(scan.mock.calls[0]?.[0]).not.toHaveProperty(
      'dangerouslyForceRunInProduction',
    )
  })

  it('still starts scan when the factory asks for enabled false', async () => {
    const { startReactScan } = await import('../src/core/scan')
    startReactScan({ enabled: false })
    expect(scan).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        showToolbar: false,
      }),
    )
    expect(setOptions).toHaveBeenCalledWith({
      enabled: false,
      showToolbar: false,
    })
  })

  it('writes react-scan-options so storage cannot override the factory', async () => {
    localStorage.setItem(
      'react-scan-options',
      JSON.stringify({ enabled: false, showToolbar: true }),
    )
    const { startReactScan } = await import('../src/core/scan')
    startReactScan({ enabled: true })
    expect(
      JSON.parse(localStorage.getItem('react-scan-options') || '{}'),
    ).toEqual(
      expect.objectContaining({
        enabled: true,
        showToolbar: false,
      }),
    )
  })

  it('passes forceRunInProduction only when asked', async () => {
    const { startReactScan } = await import('../src/core/scan')
    startReactScan({}, { forceRunInProduction: true })
    expect(scan).toHaveBeenCalledWith(
      expect.objectContaining({
        dangerouslyForceRunInProduction: true,
        showToolbar: false,
      }),
    )
  })

  it('does not call scan a second time', async () => {
    const { startReactScan } = await import('../src/core/scan')
    startReactScan()
    startReactScan({ log: true })
    expect(scan).toHaveBeenCalledTimes(1)
  })

  it('calls the user onRender after the store update', async () => {
    const userOnRender = vi.fn()
    const { startReactScan } = await import('../src/core/scan')
    const { clearRenderStore, getRenderSnapshot } =
      await import('../src/core/store')
    clearRenderStore()
    startReactScan({ onRender: userOnRender })
    const onRender = scan.mock.calls[0]?.[0]?.onRender as (
      fiber: unknown,
      renders: Array<{
        componentName: string
        time: number
        count: number
        forget: boolean
        changes: Array<never>
        unnecessary: boolean
        didCommit: boolean
        fps: number
        phase: number
      }>,
    ) => void
    const renders = [
      {
        phase: 2,
        componentName: 'Box',
        time: 1,
        count: 1,
        forget: false,
        changes: [],
        unnecessary: false,
        didCommit: true,
        fps: 60,
      },
    ]
    onRender({}, renders)
    expect(getRenderSnapshot()[0]?.name).toBe('Box')
    expect(userOnRender).toHaveBeenCalledWith({}, renders)
  })

  it('keeps the first user onRender on a later start call', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const { startReactScan } = await import('../src/core/scan')
    startReactScan({ onRender: first })
    startReactScan({ onRender: second })
    const onRender = scan.mock.calls[0]?.[0]?.onRender as (
      fiber: unknown,
      renders: Array<never>,
    ) => void
    onRender({}, [])
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })

  it('forces showToolbar false on setOptions', async () => {
    const { startReactScan, updateReactScanOptions } =
      await import('../src/core/scan')
    startReactScan()
    updateReactScanOptions({ enabled: false })
    expect(setOptions).toHaveBeenCalledWith({
      enabled: false,
      showToolbar: false,
    })
  })

  it('exposes the last applied settings', async () => {
    const {
      startReactScan,
      getReactScanPluginOptions,
      updateReactScanOptions,
    } = await import('../src/core/scan')
    startReactScan({ enabled: false, log: true })
    expect(getReactScanPluginOptions()).toEqual({
      enabled: false,
      log: true,
      animationSpeed: 'fast',
    })
    updateReactScanOptions({ animationSpeed: 'off' })
    expect(getReactScanPluginOptions().animationSpeed).toBe('off')
  })
})
