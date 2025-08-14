import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'

import App from './App'
import CustomDevtoolPanel from './CustomDevtoolsPanel'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools
      eventBusConfig={{ debug: true }}
      plugins={[
        {
          name: 'Custom devtools',
          render: <CustomDevtoolPanel />,
        },
      ]}
    />
  </StrictMode>,
)
