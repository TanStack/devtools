/** @jsxImportSource solid-js */

import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { Button, Header, MainPanel } from '@tanstack/devtools-ui'
import {
  clearRenderStore,
  getRenderSnapshot,
  subscribeToRenderStore,
} from '../store'
import { createStyles } from '../styles/styles'
import { RenderList } from './RenderList'
import { SettingsOverlay } from './Settings'

export function Shell() {
  const styles = createStyles()
  const [rows, setRows] = createSignal(getRenderSnapshot())
  const [showSettings, setShowSettings] = createSignal(false)

  onMount(() => {
    const stop = subscribeToRenderStore(setRows)
    onCleanup(stop)
  })

  const summary = createMemo(() => {
    const current = rows()
    const renders = current.reduce((total, row) => total + row.renders, 0)
    const unnecessary = current.reduce(
      (total, row) => total + row.unnecessary,
      0,
    )
    return {
      components: current.length,
      renders,
      unnecessary,
    }
  })

  return (
    <MainPanel class={styles().root} withPadding={false} data-tsd-surface>
      <Header class={styles().header} data-tsd-surface>
        <div class={styles().headerTitleRow}>
          <h2 class={styles().headerTitle}>React Scan</h2>
          <span class={styles().headerSub}>
            {`${summary().components} components · ${summary().renders} renders · ${summary().unnecessary} unnecessary`}
          </span>
        </div>
        <div class={styles().headerActions}>
          <Button
            variant="secondary"
            outline
            onClick={() => clearRenderStore()}
          >
            Clear
          </Button>
          <Button
            variant="secondary"
            outline
            onClick={() => setShowSettings(true)}
          >
            Settings
          </Button>
        </div>
      </Header>
      <RenderList />
      <Show when={showSettings()}>
        <SettingsOverlay onClose={() => setShowSettings(false)} />
      </Show>
    </MainPanel>
  )
}
