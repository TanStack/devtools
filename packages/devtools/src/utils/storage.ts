export const getStorageItem = (key: string) => localStorage.getItem(key)
export const setStorageItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch (_e) {
    return
  }
}

const getSessionItem = (key: string) => sessionStorage.getItem(key)
export const getBooleanFromStorage = (key: string) => getStorageItem(key) === "true"
export const getBooleanFromSession = (key: string) => getSessionItem(key) === "true"
export const setSessionItem = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value)
  } catch (e) {
    return
  }
}

export const TANSTACK_DEVTOOLS = 'tanstack_devtools'
export const TANSTACK_DEVTOOLS_STATE = 'tanstack_devtools_state'
export const TANSTACK_DEVTOOLS_SETTINGS = 'tanstack_devtools_settings'

export const TANSTACK_DEVTOOLS_DETACHED = "tanstack_devtools_detached"
export const TANSTACK_DEVTOOLS_DETACHED_OWNER = "tanstack_devtools_detached_owner"
export const TANSTACK_DEVTOOLS_IS_DETACHED = "tanstack_devtools_is_detached"
export const TANSTACK_DEVTOOLS_CHECK_DETACHED = "tanstack_devtools_check_detached"