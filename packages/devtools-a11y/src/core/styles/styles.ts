import * as goober from 'goober'
import { useTheme } from '@tanstack/devtools-ui'
import { createMemo } from 'solid-js'

import type { RuleCategory, SeverityThreshold } from '../types/types'

const SEVERITY_COLORS: Record<SeverityThreshold, string> = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#2563eb',
}

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  all: 'All Categories',
  'cat.aria': 'ARIA',
  'cat.color': 'Color & Contrast',
  'cat.forms': 'Forms',
  'cat.keyboard': 'Keyboard',
  'cat.language': 'Language',
  'cat.name-role-value': 'Names & Roles',
  'cat.parsing': 'Parsing',
  'cat.semantics': 'Semantics',
  'cat.sensory-and-visual-cues': 'Sensory Cues',
  'cat.structure': 'Structure',
  'cat.tables': 'Tables',
  'cat.text-alternatives': 'Text Alternatives',
  'cat.time-and-media': 'Time & Media',
}

export const CATEGORIES: Array<RuleCategory> = [
  'all',
  'cat.aria',
  'cat.color',
  'cat.forms',
  'cat.keyboard',
  'cat.language',
  'cat.name-role-value',
  'cat.parsing',
  'cat.semantics',
  'cat.sensory-and-visual-cues',
  'cat.structure',
  'cat.tables',
  'cat.text-alternatives',
  'cat.time-and-media',
]

const css = goober.css
const FONT_SCALE = 1.1
const fontPx = (size: number) => `calc(${size}px * ${FONT_SCALE})`

function createA11yPanelStyles(theme: 'light' | 'dark') {
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  const bg = t('#f9fafb;', '#191c24')
  const fg = t('#1e293b', '#e2e8f0')
  const border = t('#e2e8f0', '#292e3d')
  const muted = t('#64748b', '#94a3b8')
  const muted2 = t('#727c8b', '#818386')

  return {
    colors: { bg, fg, border, muted, muted2, theme },

    root: css`
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    `,

    header: css`
      padding: 16px;
      border-bottom: 1px solid ${border};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      anchor-name: --a11y-toast-anchor;
    `,
    headerTitleRow: css`
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    `,
    headerTitle: css`
      margin: 0;
      font-size: ${fontPx(16)};
      font-weight: 600;
    `,
    headerSub: css`
      font-size: ${fontPx(12)};
      color: ${muted};
      white-space: nowrap;
    `,
    headerActions: css`
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    `,
    primaryButton: css`
      padding: 8px 16px;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: ${fontPx(13)};
      opacity: 1;
    `,
    primaryButtonDisabled: css`
      cursor: not-allowed;
      opacity: 0.7;
    `,
    button: css`
      padding: 8px 12px;
      color: ${fg};
      border: 1px solid ${border};
      border-radius: 6px;
      cursor: pointer;
      font-size: ${fontPx(11)};
    `,
    buttonRow: css`
      display: flex;
      gap: 6px;
      align-items: center;
    `,
    toggleOverlay: css`
      padding: 8px 12px;
      color: ${fg};
      border: 1px solid ${border};
      border-radius: 6px;
      cursor: pointer;
      font-size: ${fontPx(13)};
    `,
    toggleOverlayOn: css`
      background: #10b981;
      color: #fff;
      border-color: #10b981;
    `,

    statusBar: css`
      padding: 8px 16px;
      border-bottom: 1px solid ${border};
      display: flex;
      gap: 12px;
      align-items: center;
      flex-shrink: 0;
      font-size: ${fontPx(11)};
      color: ${muted};
    `,
    statusSpacer: css`
      flex: 1;
    `,
    smallLinkButton: css`
      padding: 4px 10px;
      background: transparent;
      color: #0ea5e9;
      border: 1px solid ${border};
      border-radius: 4px;
      cursor: pointer;
      font-size: ${fontPx(11)};
      font-weight: 500;
    `,

    content: css`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,
    emptyState: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: ${muted};
    `,
    emptyPrimary: css`
      font-size: ${fontPx(14)};
      margin: 0 0 8px 0;
    `,
    emptySecondary: css`
      font-size: ${fontPx(12)};
      margin: 0;
    `,
    successState: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
    `,
    successTitle: css`
      font-size: ${fontPx(16)};
      color: #10b981;
      font-weight: 600;
      margin: 0;
    `,
    successSub: css`
      font-size: ${fontPx(12)};
      color: ${muted};
      margin-top: 8px;
      margin-bottom: 0;
    `,

    summaryGrid: css`
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;

      @media (max-width: 520px) {
        grid-template-columns: repeat(2, 1fr);
      }
    `,
    summaryButton: css`
      padding: 12px;
      color: ${fg};
      background: ${bg};
      border-radius: 8px;
      border: 1px solid ${border};
      text-align: left;
      cursor: pointer;
      box-shadow: none;

      &:hover {
        background: ${t('#f0f2f5', '#111318')};
      }
    `,
    summaryButtonActive: (impact: SeverityThreshold) => css`
      box-shadow: 0 0 0 2px ${SEVERITY_COLORS[impact]};
    `,
    summaryCount: (impact: SeverityThreshold) => css`
      font-size: ${fontPx(24)};
      font-weight: 700;
      color: ${SEVERITY_COLORS[impact]};
    `,
    summaryLabel: css`
      font-size: ${fontPx(11)};
      color: ${muted};
      text-transform: uppercase;
    `,

    section: css`
      margin-bottom: 16px;
    `,
    sectionTitle: (impact: SeverityThreshold) => css`
      color: ${SEVERITY_COLORS[impact]};
      font-size: ${fontPx(13)};
      font-weight: 600;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `,

    issueCard: css`
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid ${border};
      border-radius: 6px;
      cursor: pointer;
    `,
    issueCardSelected: css`
      background: ${t('#e0f2fe', '#1e3a5f')};
      border-color: #0ea5e9;
    `,
    issueRow: css`
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    `,
    issueMain: css`
      flex: 1;
      min-width: 0;
    `,
    issueTitleRow: css`
      font-weight: 600;
      font-size: ${fontPx(13)};
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    `,
    dot: (impact: SeverityThreshold) => css`
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${SEVERITY_COLORS[impact]};
      flex-shrink: 0;
    `,
    issueMessage: css`
      font-size: ${fontPx(12)};
      color: ${t('#475569', '#cbd5e1')};
      margin: 0 0 8px 0;
      line-height: 1.4;
    `,
    selector: css`
      font-size: ${fontPx(10)};
      color: ${muted2};
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        'Liberation Mono', 'Courier New', monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    issueAside: css`
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    `,
    helpLink: css`
      font-size: ${fontPx(12)};
      color: #0ea5e9;
      padding: 0 12px;
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover {
        color: #0284c7;
      }

      &:focus-visible {
        outline: 2px solid #0ea5e9;
        outline-offset: 2px;
        border-radius: 4px;
      }
    `,
    disableRule: css`
      font-size: ${fontPx(10)};
      color: ${muted};
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-weight: 600;

      &:hover {
        color: #000000;
      }

      &:focus-visible {
        outline: 2px solid #0ea5e9;
        outline-offset: 2px;
        border-radius: 4px;
      }
    `,
    tags: css`
      display: flex;
      gap: 4px;
      margin-top: 8px;
      flex-wrap: wrap;
    `,
    tag: css`
      font-size: ${fontPx(10)};
      padding: 2px 6px;
      border: 1px solid ${border};
      border-radius: 4px;
      color: ${muted};
    `,

    settingsOverlay: css`
      position: absolute;
      inset: 0;
      background: ${bg};
      display: flex;
      flex-direction: column;
      z-index: 10;
    `,
    settingsHeader: css`
      padding: 12px 16px;
      border-bottom: 1px solid ${border};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `,
    settingsTitle: css`
      margin: 0;
      font-size: ${fontPx(14)};
      font-weight: 600;
    `,
    doneButton: css`
      padding: 6px 12px;
      background: ${bg};
      color: ${bg};
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: ${fontPx(12)};
      font-weight: 500;
    `,
    settingsContent: css`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,
    settingsSection: css`
      margin-bottom: 24px;
    `,
    settingsRowStack: css`
      display: grid;
      gap: 12px;
    `,
    settingsSectionLabel: css`
      margin: 0 0 12px 0;
      font-size: ${fontPx(12)};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${muted};
    `,
    settingsRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid ${border};
      gap: 12px;
    `,
    settingsRowTitle: css`
      font-size: ${fontPx(13)};
      font-weight: 500;
    `,
    settingsRowDesc: css`
      font-size: ${fontPx(11)};
      color: ${muted};
      margin-top: 2px;
    `,
    select: css`
      padding: 6px 10px;
      border: 1px solid ${border};
      border-radius: 4px;
      background: ${bg};
      color: ${fg};
      font-size: ${fontPx(12)};
    `,
    rulesHeaderRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 12px;
      flex-wrap: wrap;
    `,
    rulesHeaderActions: css`
      display: flex;
      gap: 6px;
    `,
    filtersRow: css`
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    `,
    search: css`
      flex: 1;
      min-width: 180px;
      padding: 8px 10px;
      border: 1px solid ${border};
      border-radius: 4px;
      background: ${bg};
      color: ${fg};
      font-size: ${fontPx(12)};
      box-sizing: border-box;
    `,
    rulesList: css`
      border: 1px solid ${border};
      border-radius: 6px;
      overflow-y: auto;
    `,
    ruleRow: css`
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      cursor: pointer;
      opacity: 1;
      background: transparent;

      &:hover {
        background: ${t('#f0f2f5', '#111318')};
      }
    `,
    ruleRowDisabled: css`
      opacity: 0.6;
    `,
    ruleRowBorder: css`
      border-bottom: 1px solid ${border};
    `,
    ruleCheckbox: css`
      margin-top: 2px;
      flex-shrink: 0;
    `,
    ruleInfo: css`
      flex: 1;
      min-width: 0;
    `,
    ruleTop: css`
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    `,
    ruleId: css`
      font-weight: 500;
      font-size: ${fontPx(12)};
      text-decoration: none;
    `,
    ruleIdDisabled: css`
      text-decoration: line-through;
    `,
    bpBadge: css`
      font-size: ${fontPx(9)};
      padding: 1px 4px;
      background: #f59e0b;
      color: #fff;
      border-radius: 3px;
      font-weight: 500;
    `,
    ruleDesc: css`
      font-size: ${fontPx(11)};
      color: ${muted};
      line-height: 2;
    `,
    catTagRow: css`
      display: flex;
      gap: 4px;
      margin-top: 4px;
    `,
    catTag: css`
      font-size: ${fontPx(9)};
      padding: 1px 4px;
      border: 1px solid ${muted};
      border-radius: 3px;
      color: ${muted};
    `,
  }
}

export function useStyles() {
  const { theme } = useTheme()
  const styles = createMemo(() => createA11yPanelStyles(theme()))

  return styles
}
