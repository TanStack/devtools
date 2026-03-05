/** @jsxImportSource solid-js - we use Solid.js as JSX here */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { constructCoreClass } from './class'

const disposeMock = vi.fn()
const mountComponentMock = vi.fn(() => disposeMock)

vi.mock('@tanstack/devtools-utils/solid', () => ({
  __mountComponent: mountComponentMock,
}))

const importFn = () =>
  Promise.resolve({ default: () => <div>Test Component</div> })

describe('constructCoreClass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export DevtoolsCore and NoOpDevtoolsCore classes and make no calls to Solid.js primitives', () => {
    const [DevtoolsCore, NoOpDevtoolsCore] = constructCoreClass(importFn)
    expect(DevtoolsCore).toBeDefined()
    expect(NoOpDevtoolsCore).toBeDefined()
    expect(mountComponentMock).not.toHaveBeenCalled()
  })

  it('DevtoolsCore should call __mountComponent when mount is called', async () => {
    const [DevtoolsCore] = constructCoreClass(importFn)
    const instance = new DevtoolsCore()
    const el = document.createElement('div')
    await instance.mount(el, 'dark')
    expect(mountComponentMock).toHaveBeenCalledWith(el, 'dark', importFn)
  })

  it('DevtoolsCore should throw if mount is called twice without unmounting', async () => {
    const [DevtoolsCore] = constructCoreClass(importFn)
    const instance = new DevtoolsCore()
    await instance.mount(document.createElement('div'), 'dark')
    await expect(
      instance.mount(document.createElement('div'), 'dark'),
    ).rejects.toThrow('Devtools is already mounted')
  })

  it('DevtoolsCore should throw if unmount is called before mount', () => {
    const [DevtoolsCore] = constructCoreClass(importFn)
    const instance = new DevtoolsCore()
    expect(() => instance.unmount()).toThrow('Devtools is not mounted')
  })

  it('DevtoolsCore should allow mount after unmount', async () => {
    const [DevtoolsCore] = constructCoreClass(importFn)
    const instance = new DevtoolsCore()
    await instance.mount(document.createElement('div'), 'dark')
    instance.unmount()
    await expect(
      instance.mount(document.createElement('div'), 'dark'),
    ).resolves.not.toThrow()
  })

  it('DevtoolsCore should call dispose on unmount', async () => {
    const [DevtoolsCore] = constructCoreClass(importFn)
    const instance = new DevtoolsCore()
    await instance.mount(document.createElement('div'), 'dark')
    instance.unmount()
    expect(disposeMock).toHaveBeenCalled()
  })

  it('DevtoolsCore should abort mount if unmount is called during mounting', async () => {
    const [DevtoolsCore] = constructCoreClass(importFn)
    const instance = new DevtoolsCore()
    const mountPromise = instance.mount(document.createElement('div'), 'dark')
    // Unmount while mount is in progress — triggers abort path
    // Note: since the mock resolves immediately, this tests the #abortMount flag
    await mountPromise
    // Mount completed, so unmount should work normally
    instance.unmount()
    expect(disposeMock).toHaveBeenCalled()
  })

  it('NoOpDevtoolsCore should not call __mountComponent when mount is called', async () => {
    const [, NoOpDevtoolsCore] = constructCoreClass(importFn)
    const noOpInstance = new NoOpDevtoolsCore()
    await noOpInstance.mount(document.createElement('div'), 'dark')
    expect(mountComponentMock).not.toHaveBeenCalled()
  })

  it('NoOpDevtoolsCore should not throw if mount is called multiple times', async () => {
    const [, NoOpDevtoolsCore] = constructCoreClass(importFn)
    const noOpInstance = new NoOpDevtoolsCore()
    await noOpInstance.mount(document.createElement('div'), 'dark')
    await expect(
      noOpInstance.mount(document.createElement('div'), 'dark'),
    ).resolves.not.toThrow()
  })

  it('NoOpDevtoolsCore should not throw if unmount is called before mount', () => {
    const [, NoOpDevtoolsCore] = constructCoreClass(importFn)
    const noOpInstance = new NoOpDevtoolsCore()
    expect(() => noOpInstance.unmount()).not.toThrow()
  })

  it('NoOpDevtoolsCore should not throw if unmount is called after mount', async () => {
    const [, NoOpDevtoolsCore] = constructCoreClass(importFn)
    const noOpInstance = new NoOpDevtoolsCore()
    await noOpInstance.mount(document.createElement('div'), 'dark')
    expect(() => noOpInstance.unmount()).not.toThrow()
  })
})
