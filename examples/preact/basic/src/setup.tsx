import { TanStackDevtools } from '@tanstack/preact-devtools'
import { PackageJsonPanel } from './package-json-panel'

export default function DevtoolsExample() {
  return (
    <>
      <TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'Package.json',
            render: () => <PackageJsonPanel />,
          },
        ]}
      />
    </>
  )
}
