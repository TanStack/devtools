import { Button } from './button'
import { ButtonWithProps } from './button-with-props-only'

export const Feature = () => {
  return (
    <div>
      <h2>Feature component</h2>
      <Button>Nested</Button>
      <ButtonWithProps>With props</ButtonWithProps>
    </div>
  )
}
