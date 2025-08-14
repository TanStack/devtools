
import { createEffect, onCleanup, } from "solid-js"
import {
  TANSTACK_DEVTOOLS_CHECK_DETACHED,
  TANSTACK_DEVTOOLS_DETACHED,
  TANSTACK_DEVTOOLS_DETACHED_OWNER,
  TANSTACK_DEVTOOLS_IS_DETACHED,
  getBooleanFromStorage,
  setStorageItem,
} from "../../utils/storage"
import { getExistingStateFromStorage } from "../../context/devtools-context.jsx"
import { useDevtoolsContext } from "../../context/use-devtools-context"

export const useCheckIfStillDetached = () => {
  const context = useDevtoolsContext()

  const checkDetachment = (e: StorageEvent) => {
    // We only care about the should_check key
    if (e.key !== TANSTACK_DEVTOOLS_CHECK_DETACHED) {
      return
    }
    const isDetached = getBooleanFromStorage(TANSTACK_DEVTOOLS_IS_DETACHED);
    if (!isDetached) {
      return
    }
    const shouldCheckDetached = getBooleanFromStorage(TANSTACK_DEVTOOLS_CHECK_DETACHED)

    // If the detached window is unloaded we want to check if it is still there
    if (shouldCheckDetached) {
      setTimeout(() => {
        // On reload the detached window will set the flag back to false so we can check if it is still detached
        const isNotDetachedAnymore = getBooleanFromStorage(TANSTACK_DEVTOOLS_CHECK_DETACHED)
        // The window hasn't set it back to true so it is not detached anymore and we clean all the detached state
        if (isNotDetachedAnymore) {
          setStorageItem(TANSTACK_DEVTOOLS_IS_DETACHED, "false")
          setStorageItem(TANSTACK_DEVTOOLS_CHECK_DETACHED, "false")
          sessionStorage.removeItem(TANSTACK_DEVTOOLS_DETACHED_OWNER)
          sessionStorage.removeItem(TANSTACK_DEVTOOLS_DETACHED)
          const state = getExistingStateFromStorage()
          context.setStore(prev => ({
            ...prev,
            ...state,
            plugins: prev.plugins
          }))
        }
      }, 200)
    }
  }
  createEffect(() => {
    window.addEventListener("storage", checkDetachment)
    onCleanup(() => window.removeEventListener("storage", checkDetachment))
  },)
}
