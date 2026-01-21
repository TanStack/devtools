import * as goober from 'goober'
import type { RuleSetPreset, SeverityThreshold } from '../types'

const SEVERITY_COLORS: Record<SeverityThreshold, string> = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#2563eb',
}

export const SEVERITY_LABELS: Record<SeverityThreshold, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}

export const RULE_SET_LABELS: Record<RuleSetPreset, string> = {
  wcag2a: 'WCAG 2.0 A',
  wcag2aa: 'WCAG 2.0 AA',
  wcag21aa: 'WCAG 2.1 AA',
  wcag22aa: 'WCAG 2.2 AA',
  section508: 'Section 508',
  'best-practice': 'Best Practice',
  all: 'All Rules',
}

export type RuleCategory =
  | 'all'
  | 'cat.aria'
  | 'cat.color'
  | 'cat.forms'
  | 'cat.keyboard'
  | 'cat.language'
  | 'cat.name-role-value'
  | 'cat.parsing'
  | 'cat.semantics'
  | 'cat.sensory-and-visual-cues'
  | 'cat.structure'
  | 'cat.tables'
  | 'cat.text-alternatives'
  | 'cat.time-and-media'

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

export function createA11yPanelStyles(theme: 'light' | 'dark') {
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  const bg = t('#ffffff', '#1a1a2e')
  const fg = t('#1e293b', '#e2e8f0')
  const border = t('#e2e8f0', '#374151')
  const secondaryBg = t('#f8fafc', '#0f172a')
  const muted = t('#64748b', '#94a3b8')
  const muted2 = t('#94a3b8', '#64748b')

  return {
    colors: { bg, fg, border, secondaryBg, muted, muted2, theme },

    root: css`
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
      color: ${fg};
      background: ${bg};
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    `,

    toast: css`
      position: absolute;
      position-anchor: --a11y-toast-anchor;
      position-area: top center;
      padding: 8px 12px;
      border-radius: 999px;
      background: ${t('#ffffff', '#0b1220')};
      border: 1px solid ${border};
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
      color: ${fg};
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 20;
    `,
    toastDot: (color: string) => css`
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: ${color};
      flex-shrink: 0;
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
      font-size: 16px;
      font-weight: 600;
    `,
    headerSub: css`
      font-size: 12px;
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
      background: #0ea5e9;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      opacity: 1;
    `,
    primaryButtonDisabled: css`
      cursor: not-allowed;
      opacity: 0.7;
    `,
    button: css`
      padding: 8px 12px;
      background: ${secondaryBg};
      color: ${fg};
      border: 1px solid ${border};
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    `,
    buttonRow: css`
      display: flex;
      gap: 6px;
      align-items: center;
    `,
    toggleOverlay: css`
      padding: 8px 12px;
      background: ${secondaryBg};
      color: ${fg};
      border: 1px solid ${border};
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    `,
    toggleOverlayOn: css`
      background: #10b981;
      color: #fff;
      border-color: #10b981;
    `,

    statusBar: css`
      padding: 8px 16px;
      background: ${secondaryBg};
      border-bottom: 1px solid ${border};
      display: flex;
      gap: 12px;
      align-items: center;
      flex-shrink: 0;
      font-size: 11px;
      color: ${muted};
    `,
    statusSpacer: css`
      flex: 1;
    `,
    pill: (active: boolean) => css`
      padding: 4px 10px;
      background: ${active ? '#10b981' : 'transparent'};
      color: ${active ? '#fff' : '#0ea5e9'};
      border: 1px solid ${active ? '#10b981' : border};
      border-radius: 999px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
    `,
    smallLinkButton: css`
      padding: 4px 10px;
      background: transparent;
      color: #0ea5e9;
      border: 1px solid ${border};
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
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
      font-size: 14px;
      margin: 0 0 8px 0;
    `,
    emptySecondary: css`
      font-size: 12px;
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
      font-size: 16px;
      color: #10b981;
      font-weight: 600;
      margin: 0;
    `,
    successSub: css`
      font-size: 12px;
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
      background: ${secondaryBg};
      color: ${fg};
      border-radius: 8px;
      border: 1px solid ${border};
      text-align: left;
      cursor: pointer;
      box-shadow: none;
    `,
    summaryButtonActive: (impact: SeverityThreshold) => css`
      box-shadow: 0 0 0 2px ${SEVERITY_COLORS[impact]};
    `,
    summaryCount: (impact: SeverityThreshold) => css`
      font-size: 24px;
      font-weight: 700;
      color: ${SEVERITY_COLORS[impact]};
    `,
    summaryLabel: css`
      font-size: 11px;
      color: ${muted};
      text-transform: uppercase;
    `,

    section: css`
      margin-bottom: 16px;
    `,
    sectionTitle: (impact: SeverityThreshold) => css`
      color: ${SEVERITY_COLORS[impact]};
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `,

    issueCard: css`
      padding: 12px;
      margin-bottom: 8px;
      background: ${secondaryBg};
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
      font-size: 13px;
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
      font-size: 12px;
      color: ${t('#475569', '#cbd5e1')};
      margin: 0 0 8px 0;
      line-height: 1.4;
    `,
    selector: css`
      font-size: 10px;
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
      font-size: 11px;
      color: #0ea5e9;
      text-decoration: none;
    `,
    disableRule: css`
      font-size: 10px;
      color: ${muted};
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    `,
    tags: css`
      display: flex;
      gap: 4px;
      margin-top: 8px;
      flex-wrap: wrap;
    `,
    tag: css`
      font-size: 10px;
      padding: 2px 6px;
      background: ${t('#e2e8f0', '#374151')};
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
      font-size: 14px;
      font-weight: 600;
    `,
    doneButton: css`
      padding: 6px 12px;
      background: #0ea5e9;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
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
    settingsSectionLabel: css`
      margin: 0 0 12px 0;
      font-size: 12px;
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
      font-size: 13px;
      font-weight: 500;
    `,
    settingsRowDesc: css`
      font-size: 11px;
      color: ${muted};
      margin-top: 2px;
    `,
    select: css`
      padding: 6px 10px;
      border: 1px solid ${border};
      border-radius: 4px;
      background: ${bg};
      color: ${fg};
      font-size: 12px;
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
    smallAction: (variant: 'success' | 'danger') => css`
      padding: 4px 8px;
      background: ${variant === 'success' ? '#10b981' : '#ef4444'};
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 500;
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
      font-size: 12px;
      box-sizing: border-box;
    `,
    rulesList: css`
      border: 1px solid ${border};
      border-radius: 6px;
      max-height: 300px;
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
    `,
    ruleRowDisabled: css`
      opacity: 0.6;
      background: ${secondaryBg};
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
      font-size: 12px;
      text-decoration: none;
    `,
    ruleIdDisabled: css`
      text-decoration: line-through;
    `,
    bpBadge: css`
      font-size: 9px;
      padding: 1px 4px;
      background: #f59e0b;
      color: #fff;
      border-radius: 3px;
      font-weight: 500;
    `,
    ruleDesc: css`
      font-size: 11px;
      color: ${muted};
      line-height: 1.3;
    `,
    catTagRow: css`
      display: flex;
      gap: 4px;
      margin-top: 4px;
    `,
    catTag: css`
      font-size: 9px;
      padding: 1px 4px;
      background: ${t('#e2e8f0', '#374151')};
      border-radius: 3px;
      color: ${muted};
    `,
  }
}
