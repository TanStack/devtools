import { DevtoolsEventClient } from './eventClient'
import { createAngularPanel, createAngularPlugin } from '@tanstack/devtools-utils/angular'

class BasePanel {
  #unsubscribes = [] as Array<() => void>
  #dispose = () => void 0

  mount<T extends HTMLElement>(element: T) {
    const plugin = element.ownerDocument.createElement('div')
    element.appendChild(plugin)

    function render(count: number, history: string) {
      plugin.innerHTML = `
       <div>counter state: ${count}</div>
       <div>counter history: ${history}</div>
      `
    }

    render(0, '')

    this.#unsubscribes.push(
      DevtoolsEventClient.on('counter-state', (e) => {
        const count = e.payload.count ?? 0
        const history = JSON.stringify(e.payload.history ?? {})
        render(count, history)
      }),
    )

    this.#dispose = () => {
      plugin.remove()
    }
  }

  unmount() {
    this.#unsubscribes.forEach((unsubscribe) => unsubscribe())
    this.#dispose()
  }
}

export const [CustomDevtoolPanel, NoOpCustomDevtoolPanel] = createAngularPanel(BasePanel)

export const [customDevtoolPlugin, noOpCustomDevtoolPlugin] = createAngularPlugin({
  name: 'Custom Devtools (Plugin)',
  render: CustomDevtoolPanel,
})
