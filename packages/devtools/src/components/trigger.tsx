import { Show, createEffect, createMemo, createSignal } from 'solid-js'
import clsx from 'clsx'
import { useDevtoolsSettings } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import TanStackLogo from './tanstack-logo.png'
import type { Accessor } from 'solid-js'

export const Trigger = ({
  isOpen,
  setIsOpen,
  image = TanStackLogo,
}: {
  isOpen: Accessor<boolean>
  setIsOpen: (isOpen: boolean) => void
  image: string
}) => {
  const { settings } = useDevtoolsSettings()
  const [containerRef, setContainerRef] = createSignal<HTMLElement>()
  const styles = useStyles()
  const buttonStyle = createMemo(() => {
    return clsx(
      styles().mainCloseBtn,
      styles().mainCloseBtnPosition(settings().position),
      styles().mainCloseBtnAnimation(isOpen(), settings().hideUntilHover),
    )
  })

  createEffect(() => {
    const triggerComponent = settings().triggerComponent
    const el = containerRef()
    if (triggerComponent && el) {
      triggerComponent(el, {
        theme: settings().theme,
        image: image || TanStackLogo,
        isOpen,
        setIsOpen,
        hideUntilHover: settings().hideUntilHover,
        position: settings().position,
      })
    }
  })

  return (
    <Show when={!settings().triggerHidden}>
      <Show
        when={settings().triggerComponent}
        fallback={
          <button
            type="button"
            aria-label="Open TanStack Devtools"
            class={buttonStyle()}
            onClick={() => setIsOpen(!isOpen())}
          >
            <img src={image || TanStackLogo} alt="TanStack Devtools" />
          </button>
        }
      >
        <div ref={setContainerRef} />
      </Show>
    </Show>
  )
}
