import { render } from '@solidjs/web'

// devtool imports
import { TanStackDevtools } from '@tanstack/solid-devtools'
import { a11yDevtoolsPlugin } from '@tanstack/devtools-a11y/solid'

import App from './app'

function Root() {
  return (
    <>
      <App />

      <TanStackDevtools plugins={[a11yDevtoolsPlugin()]} />
    </>
  )
}

render(() => <Root />, document.getElementById('root')!)
