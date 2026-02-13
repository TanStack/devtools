import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { a11yDevtoolsPlugin } from '@tanstack/devtools-a11y/react'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TanStackDevtools plugins={[a11yDevtoolsPlugin()]} />§
  </StrictMode>,
)
