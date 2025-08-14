import { useDetachedWindowControls } from '../../context/use-devtools-context'
import {
  TANSTACK_DEVTOOLS_CHECK_DETACHED,
  setStorageItem,
} from '../../utils/storage'
import { useWindowListener } from '../use-event-listener'
// called on windows unmount
export const useResetDetachmentCheck = () => {
  const { isDetached } = useDetachedWindowControls()

  useWindowListener(
    'unload',
    () => setStorageItem(TANSTACK_DEVTOOLS_CHECK_DETACHED, 'true'),
    isDetached,
  )
}
