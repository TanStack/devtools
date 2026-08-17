/** @jsxImportSource solid-js */

import { onCleanup, onMount } from 'solid-js'
import { dockReactScanToolbar } from '../host-toolbar'

export function Shell() {
  let host: HTMLDivElement | undefined

  onMount(() => {
    if (!host) {
      return
    }
    const stop = dockReactScanToolbar(host)
    onCleanup(stop)
  })

  return (
    <div
      ref={host}
      data-tsd-surface
      data-testid="react-scan-host"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        'min-height': '100%',
      }}
    />
  )
}
