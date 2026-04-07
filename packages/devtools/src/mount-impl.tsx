import { lazy } from 'solid-js'
import { Portal, render } from 'solid-js/web'
import { ClientEventBus } from '@tanstack/devtools-event-bus/client'
import { DevtoolsProvider } from './context/devtools-context'
import { PiPProvider } from './context/pip-context'
import type {
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from './context/devtools-context'
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

  const Devtools = lazy(() => import('./devtools'))

  const dispose = render(
    () => (
      <DevtoolsProvider
        plugins={plugins}
        config={config}
        onSetPlugins={onSetPlugins}
      >
        <PiPProvider>
          <Portal mount={el}>
            <Devtools />
          </Portal>
        </PiPProvider>
      </DevtoolsProvider>
    ),
    el,
  )

  return { dispose, eventBus }
}
