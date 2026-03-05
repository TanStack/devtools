import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  Injector,
  afterNextRender,
  inject,
  input,
  viewChild,
  ElementRef,
} from '@angular/core'
import type { FlexRenderComponent } from './view'

export interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}

export const TANSTACK_DEVTOOLS_PANEL_CORE_CLASS = new InjectionToken<{
  mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
  unmount: () => void
}>('[@tanstack/devtools-utils/angular] Panel Core Class')

@Component({
  selector: 'devtools-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div #panelHost style="height: 100%"></div>`,
})
export class DevtoolsPanel<TComponentProps extends DevtoolsPanelProps> {
  readonly panelHost =
    viewChild.required<ElementRef<HTMLDivElement>>('panelHost')
  readonly instance = inject(TANSTACK_DEVTOOLS_PANEL_CORE_CLASS)
  readonly #destroyRef = inject(DestroyRef)
  theme = input<DevtoolsPanelProps['theme']>()
  devtoolsProps = input<TComponentProps>()

  constructor() {
    afterNextRender(() => {
      const ref = this.panelHost()
      this.instance.mount(ref.nativeElement, this.theme())
    })

    this.#destroyRef.onDestroy(() => {
      this.instance.unmount()
    })
  }
}

export function createAngularPanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(
  CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass,
): [() => FlexRenderComponent, () => null] {
  return [
    () => {
      return {
        component: DevtoolsPanel,
        injector: Injector.create({
          providers: [
            {
              provide: TANSTACK_DEVTOOLS_PANEL_CORE_CLASS,
              useClass: CoreClass,
            },
          ],
        }),
      }
    },
    () => null,
  ] as const
}
