import { getExistingStateFromStorage } from '../../context/devtools-context'
import {
  useDevtoolsContext,
  useDevtoolsSettings,
  useDevtoolsState,
} from '../../context/use-devtools-context'
import {
  TANSTACK_DEVTOOLS_SETTINGS,
  TANSTACK_DEVTOOLS_STATE,
} from '../../utils/storage'
import { useWindowListener } from '../use-event-listener'

const refreshRequiredKeys = [
  TANSTACK_DEVTOOLS_SETTINGS,
  TANSTACK_DEVTOOLS_STATE,
]

// Sync state with local storage when in detached mode
export const useSyncStateWhenDetached = () => {
  const { store } = useDevtoolsContext()
  const { state, setState } = useDevtoolsState()
  const { setSettings, settings } = useDevtoolsSettings()
  useWindowListener('storage', (e) => {
    // Not in detached mode
    if (!store.detachedWindow && !store.detachedWindowOwner) {
      return
    }
    // Not caused by the dev tools
    if (e.key && !refreshRequiredKeys.includes(e.key)) {
      return
    }
    // Check if the settings have not changed and early return
    if (e.key === TANSTACK_DEVTOOLS_SETTINGS) {
      const oldSettings = JSON.stringify(settings())
      if (oldSettings === e.newValue) {
        return
      }
    }
    // Check if the state has not changed and early return
    if (e.key === TANSTACK_DEVTOOLS_STATE) {
      const oldState = JSON.stringify(state())
      if (oldState === e.newValue) {
        return
      }
    }
    // store new state
    const newState = getExistingStateFromStorage()
    setState(newState.state)
    setSettings(newState.settings)
  })
}
