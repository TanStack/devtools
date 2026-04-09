import { createRoot } from 'react-dom/client'
import { seoDevtoolsPlugin } from '@tanstack/devtools-seo/react'
import { TanStackDevtools } from '@tanstack/react-devtools'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <TanStackDevtools plugins={[seoDevtoolsPlugin()]} />
  </>,
)
