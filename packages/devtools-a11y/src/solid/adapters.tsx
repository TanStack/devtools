import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { createA11yDevtoolsCoreClass } from '../core/create-core-class'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/solid'
import type { A11yPluginOptions } from '../types'

export function createA11yDevtoolsSolidPanel(options: A11yPluginOptions = {}) {
  const CoreClass = createA11yDevtoolsCoreClass(options)

  function Panel(props: DevtoolsPanelProps) {
    let devtoolRef: HTMLDivElement | undefined
    const [devtools] = createSignal(new CoreClass())

    createEffect(() => {
      devtools().setTheme(props.theme ?? 'dark')
    })

    onMount(() => {
      if (devtoolRef) {
        devtools().mount(devtoolRef, props.theme ?? 'dark')
      }
      onCleanup(() => {
        devtools().unmount()
      })
    })

    return (
      <div
        style={{
          display: 'inline',
          flex: '1',
          height: '100%',
          width: '100%',
        }}
        ref={devtoolRef}
      />
    )
  }

  function NoOpPanel(_props: DevtoolsPanelProps) {
    return <></>
  }

  return [Panel, NoOpPanel] as const
}

const [A11yDevtoolsPanel, A11yDevtoolsPanelNoOp] =
  createA11yDevtoolsSolidPanel()

export { A11yDevtoolsPanel, A11yDevtoolsPanelNoOp }

export function createA11yDevtoolsSolidPlugin(options: A11yPluginOptions = {}) {
  const CoreClass = createA11yDevtoolsCoreClass(options)

  function PluginPanel(props: {
    mountEl: HTMLElement
    theme: 'light' | 'dark'
  }) {
    const [devtools] = createSignal(new CoreClass())

    createEffect(() => {
      devtools().setTheme(props.theme)
    })

    onMount(() => {
      devtools().mount(props.mountEl, props.theme)
      onCleanup(() => {
        devtools().unmount()
      })
    })

    return <></>
  }

  function Plugin() {
    return {
      name: 'Accessibility',
      id: 'devtools-a11y',
      render: (el: HTMLElement, theme: 'light' | 'dark') => (
        <PluginPanel mountEl={el} theme={theme} />
      ),
    }
  }

  function NoOpPlugin() {
    return {
      name: 'Accessibility',
      id: 'devtools-a11y',
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => <></>,
    }
  }

  return [Plugin, NoOpPlugin] as const
}

const [a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin] =
  createA11yDevtoolsSolidPlugin()

export { a11yDevtoolsPlugin, a11yDevtoolsNoOpPlugin }
