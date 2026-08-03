export const getStorageItem = (key: string) => {
  return localStorage.getItem(key)
}
export const setStorageItem = (key: string, value: string) => {
  localStorage.setItem(key, value)
}

export const TANSTACK_DEVTOOLS = 'tanstack_devtools'
export const TANSTACK_DEVTOOLS_STATE = 'tanstack_devtools_state'
export const TANSTACK_DEVTOOLS_SETTINGS = 'tanstack_devtools_settings'
