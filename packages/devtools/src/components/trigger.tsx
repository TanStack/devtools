import { Show, createEffect, createMemo, createSignal } from 'solid-js'
import clsx from 'clsx'
import { useDevtoolsSettings } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import TanStackLogo from './tanstack-logo.png'
import type { Accessor } from 'solid-js'

export const Trigger = (props: {
  isOpen: Accessor<boolean>
  setIsOpen: (isOpen: boolean) => void
}) => {
  const { settings } = useDevtoolsSettings()
  const [containerRef, setContainerRef] = createSignal<HTMLElement>()
  const styles = useStyles()
  const buttonStyle = createMemo(() => {
    return clsx(
      styles().mainCloseBtn,
      styles().mainCloseBtnPosition(settings().position),
      styles().mainCloseBtnAnimation(props.isOpen(), settings().hideUntilHover),
    )
  })

  createEffect(() => {
    const triggerComponent = settings().customTrigger
    const el = containerRef()
    if (triggerComponent && el) {
      triggerComponent(el, {
        theme: settings().theme,

      })
    }
  })

  return (
    <Show when={!settings().triggerHidden}>
      <button
        type="button"
        aria-label="Open TanStack Devtools"
        class={buttonStyle()}
        onClick={() => props.setIsOpen(!props.isOpen())}
      >
        <Show
          when={settings().customTrigger}
          fallback={
            <img src={TanStackLogo} alt="TanStack Devtools" />
          }
        >
          <div ref={setContainerRef} />
        </Show>

      </button>

    </Show>
  )
}
