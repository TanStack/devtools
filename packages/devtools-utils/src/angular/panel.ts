export type DevtoolsPanelProps = {
  theme?: 'dark' | 'light' | 'system'
}

interface BaseCorePanelClass {
  mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
  unmount: () => void
}

type CoreClassConstructor<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends BaseCorePanelClass,
> = new (props: TComponentProps) => TCoreDevtoolsClass

function isPanelClassConstructor<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends BaseCorePanelClass,
>(o: any): o is CoreClassConstructor<TComponentProps, TCoreDevtoolsClass> {
  return !!o.prototype
}

export function createAngularPanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends BaseCorePanelClass,
>(
  CoreClass:
    | CoreClassConstructor<TComponentProps, TCoreDevtoolsClass>
    | (() => Promise<
        CoreClassConstructor<TComponentProps, TCoreDevtoolsClass>
      >),
) {
  return [
    () =>
      (inputs: () => TComponentProps, host: HTMLElement): (() => void) => {
        const panel = host.ownerDocument.createElement('div')
        panel.style.height = '100%'
        let unmount: null | (() => void) = null

        function mount(instance: TCoreDevtoolsClass) {
          instance.mount(panel, inputs().theme)
          unmount = () => instance.unmount()
        }

        host.appendChild(panel)

        const isConstructor = isPanelClassConstructor<
          TComponentProps,
          TCoreDevtoolsClass
        >(CoreClass)

        if (isConstructor) {
          mount(new CoreClass(inputs()))
        } else {
          CoreClass()
            .then((ResolvedCoreClass) => new ResolvedCoreClass(inputs()))
            .then(mount)
        }

        return () => {
          unmount?.()
        }
      },
    () => null,
  ] as const
}
