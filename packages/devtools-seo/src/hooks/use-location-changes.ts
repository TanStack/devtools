import { onCleanup, onMount } from 'solid-js'

const LOCATION_CHANGE_EVENT = 'tanstack-devtools:locationchange'

type LocationChangeListener = () => void

const listeners = new Set<LocationChangeListener>()

let lastHref = ''
let teardownLocationObservation: (() => void) | undefined

function emitLocationChangeIfNeeded() {
  const nextHref = window.location.href
  if (nextHref === lastHref) return
  lastHref = nextHref
  listeners.forEach((listener) => listener())
}

function dispatchLocationChangeEvent() {
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
}

function observeLocationChanges() {
  if (teardownLocationObservation) return

  lastHref = window.location.href

  const originalPushState = window.history.pushState
  const originalReplaceState = window.history.replaceState

  const handleLocationSignal = () => {
    emitLocationChangeIfNeeded()
  }

  window.history.pushState = function (...args) {
    originalPushState.apply(this, args)
    dispatchLocationChangeEvent()
  }

  window.history.replaceState = function (...args) {
    originalReplaceState.apply(this, args)
    dispatchLocationChangeEvent()
  }

  window.addEventListener('popstate', handleLocationSignal)
  window.addEventListener('hashchange', handleLocationSignal)
  window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationSignal)

  teardownLocationObservation = () => {
    window.history.pushState = originalPushState
    window.history.replaceState = originalReplaceState
    window.removeEventListener('popstate', handleLocationSignal)
    window.removeEventListener('hashchange', handleLocationSignal)
    window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationSignal)
    teardownLocationObservation = undefined
  }
}

export function useLocationChanges(onChange: () => void) {
  onMount(() => {
    observeLocationChanges()
    listeners.add(onChange)

    onCleanup(() => {
      listeners.delete(onChange)
      if (listeners.size === 0) teardownLocationObservation?.()
    })
  })
}
