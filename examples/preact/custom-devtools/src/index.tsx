import { render } from 'preact'
import { TanStackDevtools } from '@tanstack/preact-devtools'

import App from './App'
import CustomDevtoolPanel from './CustomDevtoolsPanel'

render(
  <>
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
  </>,
  document.getElementById('root')!,
)
