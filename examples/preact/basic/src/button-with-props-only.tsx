import type { ComponentChildren } from 'preact'
import { Button } from './button'

export const ButtonWithProps = (props: { children: ComponentChildren }) => {
  return <Button {...props} />
}
