import { Show, createComponent, createSignal, untrack } from 'solid-js'
import { Portal, render } from '@solidjs/web'
import { ClientEventBus } from '@tanstack/devtools-event-bus/client'
import { DevtoolsProvider } from './context/devtools-context'
import { PiPProvider } from './context/pip-context'
import type {
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from './context/devtools-context'
import type { Component } from 'solid-js'
import type { ClientEventBusConfig } from '@tanstack/devtools-event-bus/client'

interface MountOptions {
  el: HTMLElement
  plugins: Array<TanStackDevtoolsPlugin>
  config: TanStackDevtoolsConfig
  eventBusConfig?: ClientEventBusConfig
  onSetPlugins: (
    setPlugins: (plugins: Array<TanStackDevtoolsPlugin>) => void,
  ) => void
}

interface MountResult {
  dispose: () => void
  eventBus: { stop: () => void }
}

export function mountDevtools(options: MountOptions): MountResult {
  const { el, plugins, config, eventBusConfig, onSetPlugins } = options

  const eventBus = new ClientEventBus(eventBusConfig)
  eventBus.start()

  // Loaded by hand rather than with `lazy`, which would need a `Loading`
  // boundary to keep the root from waiting on the chunk.
  const [devtools, setDevtools] = createSignal<Component>()
  void import('./devtools').then((mod) => setDevtools(() => mod.default))

  const dispose = render(
    () => (
      <DevtoolsProvider
        plugins={plugins}
        config={config}
        onSetPlugins={onSetPlugins}
      >
        <PiPProvider>
          <Portal mount={el}>
            {/* Set once, when the chunk arrives. */}
            <Show when={devtools()}>
              {(Shell) => createComponent(untrack(Shell), {})}
            </Show>
          </Portal>
        </PiPProvider>
      </DevtoolsProvider>
    ),
    el,
  )

  return { dispose, eventBus }
}
