import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createA11yDevtoolsReactPlugin } from '@tanstack/devtools-a11y/react'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools
      plugins={[createA11yDevtoolsReactPlugin({ runOnMount: false })[0]()]}
    />
  </StrictMode>,
)
