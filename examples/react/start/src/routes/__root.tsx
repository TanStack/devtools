import * as React from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import { RouteNavigationPanel } from '../devtools'

import appCss from '../styles.css?url'

const A11yDevtoolsPanel = React.lazy(async () => {
  const mod = await import('@tanstack/devtools-a11y/react')
  return { default: mod.A11yDevtoolsPanel }
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  console.log('Rendering Root Document')
  const isServer = typeof window === 'undefined'
  const plugins = [
    {
      name: 'Tanstack Router',
      render: <TanStackRouterDevtoolsPanel />,
    },
    {
      id: 'route-navigation',
      name: 'Route Navigation',
      render: <RouteNavigationPanel />,
    },
    ...(isServer
      ? []
      : [
          {
            id: 'a11y',
            name: 'Accessibility',
            render: (
              <React.Suspense fallback={null}>
                <A11yDevtoolsPanel />
              </React.Suspense>
            ),
          },
        ]),
  ]

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={plugins}
        />
        <Scripts />
      </body>
    </html>
  )
}
