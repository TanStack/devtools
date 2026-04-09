'use client'

import { Fragment, createElement, useEffect, useRef } from 'react'
import { render } from 'solid-js/web'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { SeoTab } from '../seo-tab'

import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/react'

export interface SeoDevtoolsReactInit extends DevtoolsPanelProps {}

function SeoDevtoolsPanel(props: SeoDevtoolsReactInit) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    const dispose = render(
      () => (
        <ThemeContextProvider theme={props.theme}>
          <SeoTab />
        </ThemeContextProvider>
      ),
      rootRef.current,
    )

    return () => {
      dispose()
    }
  }, [props])

  return createElement('div', {
    ref: rootRef,
    style: { height: '100%' },
  })
}

function SeoDevtoolsPanelNoOp() {
  return createElement(Fragment)
}

export { SeoDevtoolsPanel, SeoDevtoolsPanelNoOp }
