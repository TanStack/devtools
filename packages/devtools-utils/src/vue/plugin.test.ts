import { describe, it, expect } from 'vitest'
import { createVuePlugin } from '../src/vue/plugin'
import { defineComponent } from 'vue'
import type { TanStackDevtoolsVuePlugin } from '@tanstack/vue-devtools'

describe('createVuePlugin', () => {
  it('should create plugins with proper types', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      props: {
        test: String,
      },
      setup() {
        return () => null
      },
    })

    const [Plugin, NoOpPlugin] = createVuePlugin<{ test: string }>(
      'Test',
      TestComponent,
    )

    // Test that plugins can be created
    const plugin = Plugin({ test: 'value' })
    const noOpPlugin = NoOpPlugin({ test: 'value' })

    // Test that plugins have correct structure
    expect(plugin).toHaveProperty('name', 'Test')
    expect(plugin).toHaveProperty('component')
    expect(plugin).toHaveProperty('props', { test: 'value' })

    expect(noOpPlugin).toHaveProperty('name', 'Test')
    expect(noOpPlugin).toHaveProperty('component')
    expect(noOpPlugin).toHaveProperty('props', { test: 'value' })

    // Test that components are valid Vue components
    expect(typeof plugin.component).toBe('object')
    expect(typeof noOpPlugin.component).toBe('object')
  })

  it('should create plugins compatible with TanStackDevtoolsVuePlugin type', () => {
    const TestComponent = defineComponent({
      name: 'TestComponent',
      setup() {
        return () => null
      },
    })

    const [Plugin, NoOpPlugin] = createVuePlugin('Test', TestComponent)

    const plugin: TanStackDevtoolsVuePlugin = Plugin({})
    const noOpPlugin: TanStackDevtoolsVuePlugin = NoOpPlugin({})

    // This should not cause type errors
    expect(plugin.name).toBe('Test')
    expect(noOpPlugin.name).toBe('Test')
  })
})
