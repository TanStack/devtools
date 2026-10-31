import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/devtools-utils/react', () => ({
  createReactPanel: () => [() => null, () => null],
  createReactPlugin: ({ name }: { name: string }) => [
    () => ({ name, render: () => ({ type: Symbol.for('development') }) }),
    () => ({ name, render: () => ({ type: Symbol.for('react.fragment') }) }),
  ],
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('devtools', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })
})

it('keeps the React accessibility plugin a no-op in production', async () => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.resetModules()
  const { a11yDevtoolsPlugin } = await import('../src/react/index')
  const definition = a11yDevtoolsPlugin()
  expect(definition.name).toBe('TanStack A11y')
  const rendered = definition.render(document.createElement('div'), {
    theme: 'dark',
    devtoolsOpen: true,
  })
  expect(rendered).toMatchObject({ type: Symbol.for('react.fragment') })
})
