import {
  TANSTACK_DEVTOOLS_DETACHED,
  TANSTACK_DEVTOOLS_DETACHED_OWNER,
  TANSTACK_DEVTOOLS_IS_DETACHED,
  getBooleanFromSession,
  getBooleanFromStorage,
} from './storage.js'

export const checkIsDetachedWindow = () =>
  getBooleanFromSession(TANSTACK_DEVTOOLS_DETACHED)
export const checkIsDetached = () =>
  getBooleanFromStorage(TANSTACK_DEVTOOLS_IS_DETACHED)
export const checkIsDetachedOwner = () =>
  getBooleanFromSession(TANSTACK_DEVTOOLS_DETACHED_OWNER)
