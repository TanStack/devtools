import { describe, expect, test } from 'vitest'
import { removeDevtools } from './remove-devtools'

const removeEmptySpace = (str: string) => {
  return str.replace(/\s/g, '').trim()
}

describe('remove-devtools', () => {
  test('it removes devtools if Imported directly', () => {
    const output = removeEmptySpace(
      removeDevtools(
        `
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
 

 
export default function DevtoolsExample() {
  return (
    <>
      <TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
          /* {
            name: "The actual app",
            render: <iframe style={{ width: '100%', height: '100%' }} src="http://localhost:3005" />,
          } */
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}

        `,
        'test.jsx',
      )!.code,
    )
    expect(output).toBe(
      removeEmptySpace(`
               import {
            Link,
            Outlet,
            RouterProvider,
            createRootRoute,
            createRoute,
            createRouter
          } from '@tanstack/react-router';    

          
          export default function DevtoolsExample() {
            return  (<> 
                <RouterProvider router={router} />
              </>);
            
          }

        `),
    )
  })

  test("it removes devtools if Imported and renamed with 'as' ", () => {
    const output = removeEmptySpace(
      removeDevtools(
        `
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackDevtools as Devtools } from '@tanstack/react-devtools'
 

 
export default function DevtoolsExample() {
  return (
    <>
      <Devtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
          /* {
            name: "The actual app",
            render: <iframe style={{ width: '100%', height: '100%' }} src="http://localhost:3005" />,
          } */
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}

        `,
        'test.jsx',
      )!.code,
    )
    expect(output).toBe(
      removeEmptySpace(`
              import {
            Link,
            Outlet,
            RouterProvider,
            createRootRoute,
            createRoute,
            createRouter
          } from '@tanstack/react-router';  

          
          export default function DevtoolsExample() {
            return ( <> 
                <RouterProvider router={router} />
              </>);
            
          }

        `),
    )
  })

  test('it removes devtools if Imported as * then used as a subcomponent ', () => {
    const output = removeEmptySpace(
      removeDevtools(
        `
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import * as Tools from '@tanstack/react-devtools'
 

 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
          /* {
            name: "The actual app",
            render: <iframe style={{ width: '100%', height: '100%' }} src="http://localhost:3005" />,
          } */
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}

        `,
        'test.jsx',
      )!.code,
    )
    expect(output).toBe(
      removeEmptySpace(`
            import {
            Link,
            Outlet,
            RouterProvider,
            createRootRoute,
            createRoute,
            createRouter
          } from '@tanstack/react-router';  

          
          export default function DevtoolsExample() {
            return  (<> 
                <RouterProvider router={router} />
              </>);
            
          }

        `),
    )
  })

  test('it removes devtools and all possible variations of the plugins', () => {
    const output = removeEmptySpace(
      removeDevtools(
        ` 
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import * as Tools from '@tanstack/react-devtools'
 

 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
                 {
            name: 'TanStack Query',
            render: () => <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: TanStackRouterDevtoolsPanel,
          },
          some()
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
        'test.jsx',
      )!.code,
    )

    expect(output).toBe(
      removeEmptySpace(` 
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter
} from '@tanstack/react-router' ;
 

 
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
    )
  })

  describe('removing plugin imports', () => {
    test('it removes the plugin import from the import array if multiple import identifiers exist', () => {
      const output = removeEmptySpace(
        removeDevtools(
          ` 
      import { ReactQueryDevtoolsPanel, test } from '@tanstack/react-query-devtools'
 
import * as Tools from '@tanstack/react-devtools'
 

 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          } 
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
          'test.jsx',
        )!.code,
      )

      expect(output).toBe(
        removeEmptySpace(`   
   import { test } from '@tanstack/react-query-devtools';
 
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
      )
    })

    test("it doesn't remove the whole import if imported with * as", () => {
      const output = removeEmptySpace(
        removeDevtools(
          ` 
      import * as Stuff from '@tanstack/react-query-devtools'
 
import * as Tools from '@tanstack/react-devtools'
 

 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <Stuff.ReactQueryDevtoolsPanel />,
          } 
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
          'test.jsx',
        )!.code,
      )

      expect(output).toBe(
        removeEmptySpace(`   
   import * as Stuff from '@tanstack/react-query-devtools';
 
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
      )
    })

    test('it removes the import completely if nothing is left', () => {
      const output = removeEmptySpace(
        removeDevtools(
          ` 
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools' 
import * as Tools from '@tanstack/react-devtools' 
 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          } 
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
          'test.jsx',
        )!.code,
      )

      expect(output).toBe(
        removeEmptySpace(`    
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
      )
    })

    test('it removes the import completely even if used as a function instead of jsx', () => {
      const output = removeEmptySpace(
        removeDevtools(
          ` 
      import { plugin } from '@tanstack/react-query-devtools' 
import * as Tools from '@tanstack/react-devtools' 
 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: plugin()
          } 
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
          'test.jsx',
        )!.code,
      )

      expect(output).toBe(
        removeEmptySpace(`    
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
      )
    })

    test('it removes the import completely even if used as a function inside of render', () => {
      const output = removeEmptySpace(
        removeDevtools(
          ` 
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools' 
import * as Tools from '@tanstack/react-devtools' 
 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: () => <ReactQueryDevtoolsPanel />
          } 
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
          'test.jsx',
        )!.code,
      )

      expect(output).toBe(
        removeEmptySpace(`    
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
      )
    })

    test('it removes the import completely even if used as a reference inside of render', () => {
      const output = removeEmptySpace(
        removeDevtools(
          ` 
      import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools' 
import * as Tools from '@tanstack/react-devtools' 
 
export default function DevtoolsExample() {
  return (
    <>
      <Tools.TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: ReactQueryDevtoolsPanel
          } 
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}`,
          'test.jsx',
        )!.code,
      )

      expect(output).toBe(
        removeEmptySpace(`    
export default function DevtoolsExample() {
  return (
    <> 
      <RouterProvider router={router} />
    </>
  );
}
          `),
      )
    })
  })
})
