import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core'
import { DevtoolsEventClient } from './eventClient'
import { JsonPipe } from '@angular/common'

@Component({
  selector: `custom-devtool-panel`,
  template: `
    <div>
      <div>counter state: {{ state()?.count }}</div>
      <div>counter history: {{ state()?.history | json }}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
})
export class CustomDevtoolPanel {
  #destroyRef = inject(DestroyRef)

  // Automatically added
  readonly theme = input<string>()

  state = signal<{ count: number; history: Array<number> } | undefined>(undefined)

  constructor() {
    afterNextRender(() => {
      const unsubscribe = DevtoolsEventClient.on('counter-state', (e) => {
        this.state.set(e.payload)
      })
      this.#destroyRef.onDestroy(() => unsubscribe())
    })
  }
}
