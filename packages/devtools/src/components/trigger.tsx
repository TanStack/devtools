import { Show, createMemo } from 'solid-js'
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
  const styles = useStyles()
  const buttonStyle = createMemo(() => {
    return clsx(
      styles().mainCloseBtn,
      styles().mainCloseBtnPosition(settings().position),
      styles().mainCloseBtnAnimation(isOpen(), settings().hideUntilHover),
    )
  })
  return (
    <Show when={!settings().triggerHidden}>
      <button
        type="button"
        aria-label="Open TanStack Devtools"
        class={buttonStyle()}
        onClick={() => setIsOpen(!isOpen())}
      >
        <img src={image || TanStackLogo} alt="TanStack Devtools" />
      </button>
    </Show>
  )
}
