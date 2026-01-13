import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { A11yDevtoolsPanel } from '@tanstack/devtools-a11y/react'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools
      plugins={[
        {
          id: 'devtools-a11y',
          name: 'Accessibility',
          // Use function form to receive theme from devtools
          render: (_el, theme) => (
            <A11yDevtoolsPanel theme={theme} options={{ runOnMount: false }} />
          ),
        },
      ]}
    />
  </StrictMode>,
)
