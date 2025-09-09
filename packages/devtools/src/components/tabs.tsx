import clsx from 'clsx'
import { For } from 'solid-js'
import { PiP, X } from '@tanstack/devtools-ui/icons'
import { useStyles } from '../styles/use-styles'
import { useDevtoolsState } from '../context/use-devtools-context'
import { useDrawContext } from '../context/draw-context'
import { tabs } from '../tabs'
import { usePiPWindow } from '../context/pip-context'

interface TabsProps {
  toggleOpen: () => void
}

export const Tabs = (props: TabsProps) => {
  const styles = useStyles()
  const { state, setState } = useDevtoolsState()
  const pipWindow = usePiPWindow()
  const handleDetachment = () => {
    pipWindow().requestPipWindow(
      `width=${window.innerWidth},height=${state().height},top=${window.screen.height},left=${window.screenLeft}}`,
    )
  }
  const { hoverUtils } = useDrawContext()

  return (
    <div class={styles().tabContainer}>
      <For each={tabs}>
        {(tab) => (
          <button
            type="button"
            onClick={() => setState({ activeTab: tab.id })}
            class={clsx(styles().tab, { active: state().activeTab === tab.id })}
            onMouseEnter={() => {
              if (tab.id === 'plugins') hoverUtils.enter()
            }}
            onMouseLeave={() => {
              if (tab.id === 'plugins') hoverUtils.leave()
            }}
          >
            {tab.icon()}
          </button>
        )}
      </For>
      {pipWindow().pipWindow !== null ? null : (
        <div
          style={{
            'margin-top': 'auto',
          }}
        >
          <button
            type="button"
            class={clsx(styles().tab, 'detach')}
            onClick={handleDetachment}
          >
            <PiP />
          </button>
          <button
            type="button"
            class={clsx(styles().tab, 'close')}
            onClick={() => props.toggleOpen()}
          >
            <X />
          </button>
        </div>
      )}
    </div>
  )
}
