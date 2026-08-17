import { afterEach, expect, it, vi } from 'vitest'

const scan = vi.fn()

vi.mock('react-scan', () => ({
  scan: (...args: Array<unknown>) => scan(...args),
  setOptions: vi.fn(),
}))

vi.mock('@tanstack/devtools-utils/react', () => ({
  createReactPanel: () => [() => null, () => null],
  createReactPlugin: ({ name, id }: { name: string; id?: string }) => [
    () => ({
      name,
      id,
      render: () => ({ type: Symbol.for('development') }),
    }),
    () => ({
      name,
      id,
      render: () => ({ type: Symbol.for('react.fragment') }),
    }),
  ],
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  scan.mockReset()
})

it('returns React Scan metadata and starts scan in development', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.resetModules()
  const { reactScanDevtoolsPlugin } = await import('../src/index')
  const definition = reactScanDevtoolsPlugin()
  expect(definition.name).toBe('React Scan')
  expect(definition.id).toBe('react-scan')
  expect(scan).toHaveBeenCalledTimes(1)
  expect(scan).toHaveBeenCalledWith(
    expect.objectContaining({ showToolbar: false }),
  )
})

it('does not start scan twice when the factory is called twice', async () => {
  vi.stubEnv('NODE_ENV', 'development')
  vi.resetModules()
  const { reactScanDevtoolsPlugin } = await import('../src/index')
  reactScanDevtoolsPlugin()
  reactScanDevtoolsPlugin()
  expect(scan).toHaveBeenCalledTimes(1)
})

it('keeps the React Scan plugin a no-op in production', async () => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.resetModules()
  const { reactScanDevtoolsPlugin } = await import('../src/index')
  const definition = reactScanDevtoolsPlugin()
  expect(definition.name).toBe('React Scan')
  expect(definition.id).toBe('react-scan')
  const rendered = definition.render(document.createElement('div'), {
    theme: 'dark',
    devtoolsOpen: true,
  })
  expect(rendered).toMatchObject({ type: Symbol.for('react.fragment') })
  expect(scan).not.toHaveBeenCalled()
})
