import {
  Component,
  DestroyRef,
  ElementRef,

  afterNextRender,
  inject,
  input
} from '@angular/core'
import type {Type} from '@angular/core';

export interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}

export function createAngularPanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(
  CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass,
): [Type<any>, Type<any>] {
  @Component({
    selector: 'devtools-panel',
    standalone: true,
    template: '<div #panelHost style="height: 100%"></div>',
  })
  class Panel {
    theme = input<DevtoolsPanelProps['theme']>()
    devtoolsProps = input<TComponentProps>()

    private hostRef = inject(ElementRef)
    private destroyRef = inject(DestroyRef)
    private devtools: TCoreDevtoolsClass | null = null

    constructor() {
      afterNextRender(() => {
        const el = this.hostRef.nativeElement.querySelector('div')
        if (!el) return

        const instance = new CoreClass(this.devtoolsProps() as TComponentProps)
        this.devtools = instance
        instance.mount(el, this.theme())
      })

      this.destroyRef.onDestroy(() => {
        this.devtools?.unmount()
        this.devtools = null
      })
    }
  }

  @Component({
    selector: 'devtools-noop-panel',
    standalone: true,
    template: '',
  })
  class NoOpPanel {
    theme = input<DevtoolsPanelProps['theme']>()
    devtoolsProps = input<TComponentProps>()
  }

  return [Panel, NoOpPanel]
}
