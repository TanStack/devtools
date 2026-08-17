import { scan, setOptions } from 'react-scan'
import { expandReactScanToolbar, hideReactScanToolbar } from './host-toolbar'
import { DEFAULT_PLUGIN_SETTINGS } from './types'
import type { Options } from 'react-scan'
import type { ReactScanDevtoolsOptions, ReactScanPluginSettings } from './types'

const REACT_SCAN_OPTIONS_KEY = 'react-scan-options'

let started = false
let userOnRender: Options['onRender']
let currentSettings: ReactScanPluginSettings = { ...DEFAULT_PLUGIN_SETTINGS }

interface ReactScanRuntimeOptions {
  forceRunInProduction?: boolean
}

function composedOnRender(
  fiber: Parameters<NonNullable<Options['onRender']>>[0],
  renders: Parameters<NonNullable<Options['onRender']>>[1],
) {
  userOnRender?.(fiber, renders)
}

function persistReactScanOptions(settings: ReactScanPluginSettings) {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    let existing: Record<string, unknown> = {}
    const raw = localStorage.getItem(REACT_SCAN_OPTIONS_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        existing = parsed as Record<string, unknown>
      }
    }
    localStorage.setItem(
      REACT_SCAN_OPTIONS_KEY,
      JSON.stringify({
        ...existing,
        enabled: settings.enabled,
        log: settings.log,
        animationSpeed: settings.animationSpeed,
        showToolbar: true,
      }),
    )
  } catch {
    // Private mode and quota errors must not stop the plugin.
  }
}

export function getReactScanPluginOptions(): ReactScanPluginSettings {
  return { ...currentSettings }
}

export function startReactScan(
  options: ReactScanDevtoolsOptions = {},
  runtime: ReactScanRuntimeOptions = {},
) {
  if (started) {
    return
  }
  started = true
  userOnRender = options.onRender
  currentSettings = {
    enabled: options.enabled ?? DEFAULT_PLUGIN_SETTINGS.enabled,
    log: options.log ?? DEFAULT_PLUGIN_SETTINGS.log,
    animationSpeed:
      options.animationSpeed ?? DEFAULT_PLUGIN_SETTINGS.animationSpeed,
  }
  persistReactScanOptions(currentSettings)
  expandReactScanToolbar()
  hideReactScanToolbar()
  // react-scan skips start() when enabled is false and the toolbar is hidden.
  // Always start, then pause if the user asked for enabled: false.
  scan({
    enabled: true,
    log: currentSettings.log,
    animationSpeed: currentSettings.animationSpeed,
    showToolbar: true,
    onRender: composedOnRender,
    ...(runtime.forceRunInProduction
      ? { dangerouslyForceRunInProduction: true }
      : {}),
  })
  if (!currentSettings.enabled) {
    setOptions({ enabled: false, showToolbar: true })
  }
}

export function updateReactScanOptions(
  options: Omit<ReactScanDevtoolsOptions, 'onRender'>,
) {
  currentSettings = {
    ...currentSettings,
    ...options,
  }
  persistReactScanOptions(currentSettings)
  setOptions({
    ...options,
    showToolbar: true,
  })
}
