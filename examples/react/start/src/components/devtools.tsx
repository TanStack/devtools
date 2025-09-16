import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { StudioPlugin } from './prisma-plugin'
import ClientPlugin from './client-plugin'

import { DevtoolsPanel, useAIDevtools, } from "@ai-sdk-tools/devtools";

const queryClient = new QueryClient()

export default function DevtoolsExample() {
  const { events, isCapturing, clearEvents, toggleCapturing } = useAIDevtools();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TanStackDevtools
          eventBusConfig={{
            debug: false,
            connectToServerBus: true,
          }}
          plugins={[
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'AI SDK',
              render: <DevtoolsPanel onClose={() => { }} onTogglePosition={() => { }} config={{ enabled: true, maxEvents: 1000, position: "bottom" }} events={events} isCapturing={isCapturing} onClearEvents={clearEvents} onToggleCapturing={toggleCapturing} />,
            },
            {
              name: 'Prisma Studio',
              render: <StudioPlugin />,
            },
            {
              name: 'Client Plugin',
              render: <ClientPlugin />,
            },
          ]}
        />
      </QueryClientProvider>
    </>
  )
}
