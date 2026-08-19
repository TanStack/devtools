import { useEffect, useRef } from 'react'
import { dockReactScanToolbar } from '../host-toolbar'

export function ReactScanDevtoolsPanel() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }
    return dockReactScanToolbar(host)
  }, [])

  return (
    <div
      ref={hostRef}
      data-tsd-surface
      data-testid="react-scan-host"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        minHeight: '100%',
      }}
    />
  )
}

export function ReactScanDevtoolsPanelNoOp() {
  return null
}
