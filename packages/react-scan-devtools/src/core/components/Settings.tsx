/** @jsxImportSource solid-js */

import { createSignal } from 'solid-js'
import { Button, Checkbox, Select } from '@tanstack/devtools-ui'
import { getReactScanPluginOptions, updateReactScanOptions } from '../scan'
import { createStyles } from '../styles/styles'
import type { AnimationSpeed } from '../types'

interface SettingsProps {
  onClose: () => void
}

export function SettingsOverlay(props: SettingsProps) {
  const styles = createStyles()
  const initial = getReactScanPluginOptions()
  const [enabled, setEnabled] = createSignal(initial.enabled)
  const [log, setLog] = createSignal(initial.log)
  const [animationSpeed, setAnimationSpeed] = createSignal<AnimationSpeed>(
    initial.animationSpeed,
  )
  return (
    <div class={styles().settingsOverlay} data-tsd-surface>
      <div class={styles().settingsHeader} data-tsd-surface data-tsd-separator>
        <h3 class={styles().settingsTitle}>Settings</h3>
        <Button variant="secondary" outline onClick={props.onClose}>
          Done
        </Button>
      </div>
      <div class={styles().settingsContent} data-tsd-surface>
        <Checkbox
          label="Enabled"
          description="Highlight renders on the page"
          checked={enabled()}
          onChange={(checked: boolean) => {
            setEnabled(checked)
            updateReactScanOptions({ enabled: checked })
          }}
        />
        <Checkbox
          label="Log renders"
          description="Write renders to the console"
          checked={log()}
          onChange={(checked: boolean) => {
            setLog(checked)
            updateReactScanOptions({ log: checked })
          }}
        />
        <Select<AnimationSpeed>
          label="Animation speed"
          value={animationSpeed()}
          options={[
            { value: 'slow', label: 'Slow' },
            { value: 'fast', label: 'Fast' },
            { value: 'off', label: 'Off' },
          ]}
          onChange={(value: AnimationSpeed) => {
            setAnimationSpeed(value)
            updateReactScanOptions({ animationSpeed: value })
          }}
        />
      </div>
    </div>
  )
}
