/** @jsxImportSource solid-js */

import { Match, Show, Switch, createSignal } from 'solid-js'
import { Button, Header, MainPanel } from '@tanstack/devtools-ui'
import { useAllyContext } from '../contexts/allyContext'
import { RULE_SET_LABELS, SEVERITY_LABELS } from '../utils/ui.utils'
import { useStyles } from '../styles/styles'
import { A11yIssueList } from './IssueList'
import { A11ySettingsOverlay } from './Settings'

export function Shell() {
  const styles = useStyles()

  // ally context
  const { filteredIssues, audit, state, config, setConfig, triggerAllyScan } =
    useAllyContext()

  // ui state
  const selectedIssueSignal = createSignal<string>('')
  const [displaySettings, setDisplaySettings] = createSignal<boolean>(false)

  const handleExport = (format: 'json' | 'csv') => {
    // Keep export logic in runtime via event -> overlay? export is still a direct helper.
    // We keep this import local to avoid pulling export code into the runtime module.

    if (!audit) return
    void import('../utils/export-audit.uitls').then((m) =>
      m.exportAuditResults(audit, { format }),
    )
  }

  return (
    <MainPanel class={styles().root} withPadding={false}>
      <Header class={styles().header}>
        <div class={styles().headerTitleRow}>
          <h2 class={styles().headerTitle}>Accessibility Audit</h2>

          <Show when={filteredIssues()}>
            <span class={styles().headerSub}>
              {audit?.issues.length} issue
              {audit?.issues.length !== 1 ? 's' : ''}
            </span>
          </Show>
        </div>

        <div class={styles().headerActions}>
          <Button
            variant="primary"
            onClick={triggerAllyScan}
            disabled={state === 'scanning'}
          >
            {state === 'scanning' ? 'Scanning...' : 'Run Audit'}
          </Button>

          <Show when={state === 'done' && audit && audit.issues.length > 0}>
            <div class={styles().buttonRow}>
              <Button
                variant="secondary"
                outline
                onClick={() => handleExport('json')}
              >
                Export JSON
              </Button>

              <Button
                variant="secondary"
                outline
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </Button>
            </div>

            <Button
              variant={config.showOverlays ? 'success' : 'secondary'}
              outline={!config.showOverlays}
              onClick={() => setConfig('showOverlays', !config.showOverlays)}
            >
              {config.showOverlays ? 'Hide' : 'Show'} Overlays
            </Button>
          </Show>
        </div>
      </Header>

      <div class={styles().statusBar}>
        <span>
          <Show when={state === 'done'}>
            {`${SEVERITY_LABELS[config.threshold]}+ |${RULE_SET_LABELS[config.ruleSet]}`}

            <Show when={config.disabledRules.length > 0}>
              {` | ${config.disabledRules.length} rule(s) disabled`}
            </Show>
          </Show>
        </span>

        <div class={styles().statusSpacer} />

        <Button
          variant="secondary"
          outline
          onClick={() => setDisplaySettings(true)}
        >
          Settings
        </Button>
      </div>

      <div class={styles().content}>
        <Switch>
          <Match when={state !== 'init'}>
            <div class={styles().emptyState}>
              <p class={styles().emptyPrimary}>No audit results yet</p>

              <p class={styles().emptySecondary}>
                Click "Run Audit" to scan for accessibility issues
              </p>
            </div>
          </Match>

          <Match when={state === 'done' && audit && audit.issues.length === 0}>
            <div class={styles().successState}>
              <p class={styles().successTitle}>
                No accessibility issues found!
              </p>

              <p class={styles().successSub}>
                Scanned in {audit!.duration.toFixed(0)}ms
              </p>
            </div>
          </Match>

          <Match when={filteredIssues().length > 0}>
            <A11yIssueList selectedIssueSignal={selectedIssueSignal} />
          </Match>
        </Switch>
      </div>

      <Show when={displaySettings()}>
        <A11ySettingsOverlay onClose={() => setDisplaySettings(false)} />
      </Show>
    </MainPanel>
  )
}
