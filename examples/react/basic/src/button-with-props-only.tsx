import { Button } from './button'

export const ButtonWithProps = (props: { children: React.ReactNode }) => {
  return <Button {...props} />
}
