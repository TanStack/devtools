import clsx from 'clsx'
import { For } from 'solid-js'
import { useStyles } from '../styles/use-styles'
import { useDetachedWindowControls, useDevtoolsState } from '../context/use-devtools-context'
import { tabs } from '../tabs'
import { TANSTACK_DEVTOOLS_DETACHED_OWNER, TANSTACK_DEVTOOLS_IS_DETACHED, setSessionItem, setStorageItem, } from '../utils/storage'

interface TabsProps {
  toggleOpen: () => void
}

export const Tabs = (props: TabsProps) => {
  const styles = useStyles()
  const { state, setState } = useDevtoolsState()
  const { setDetachedWindowOwner, detachedWindowOwner, detachedWindow } = useDetachedWindowControls()
  const handleDetachment = () => {
    const rdtWindow = window.open(
      window.location.href,
      "",
      `popup,width=${window.innerWidth},height=${state().height},top=${window.screen.height},left=${window.screenLeft}}`
    )

    if (rdtWindow) {
      setDetachedWindowOwner(true)
      setStorageItem(TANSTACK_DEVTOOLS_IS_DETACHED, "true")
      setSessionItem(TANSTACK_DEVTOOLS_DETACHED_OWNER, "true")
      rdtWindow.TDT_MOUNTED = true
    }
  }
  return (
    <div class={styles().tabContainer}>
      <For each={tabs}>
        {(tab) => (
          <button
            type="button"
            onClick={() => setState({ activeTab: tab.id })}
            class={clsx(styles().tab, { active: state().activeTab === tab.id })}
          >
            {tab.icon}
          </button>
        )}
      </For>
      {!detachedWindow && <div style={{
        "margin-top": "auto"
      }}>
        {!detachedWindowOwner() && <button
          type="button"
          class={clsx(styles().tab, 'detach')}
          onClick={handleDetachment}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-picture-in-picture-icon lucide-picture-in-picture"><path d="M2 10h6V4" /><path d="m2 4 6 6" /><path d="M21 10V7a2 2 0 0 0-2-2h-7" /><path d="M3 14v2a2 2 0 0 0 2 2h3" /><rect x="12" y="14" width="10" height="7" rx="1" /></svg>
        </button>}
        <button
          type="button"
          class={clsx(styles().tab, 'close')}
          onClick={() => props.toggleOpen()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>}
    </div>
  )
}
