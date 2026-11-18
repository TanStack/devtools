import * as goober from 'goober'
import { createTheme } from '@tanstack/devtools-ui'
import { createMemo } from 'solid-js'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'

import { getSeverityStyle } from './severity-theme'

import type { RuleCategory, SeverityThreshold } from '../types/types'

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

function createA11yPanelStyles(themeName: 'light' | 'dark') {
  const theme = resolveSemanticTheme(themeName)
  const { color, font, gap, radius, shadow, space, type } = theme

  return {
    colors: { theme: themeName },
    root: css`
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      background: ${color.surface.workspace};
      color: ${color.text.primary};
      font-family: ${font.body};
      font-weight: 300;
    `,
    header: css`
      padding: ${space[3]} ${space[4]};
      border-bottom: 1px solid ${color.border.decorative};
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${gap.section};
      flex-shrink: 0;
      anchor-name: --a11y-toast-anchor;
      background: ${color.surface.brand};
    `,
    headerTitleRow: css`
      display: flex;
      align-items: center;
      gap: ${gap.control};
      min-width: 0;
    `,
    headerTitle: css`
      margin: 0;
      font-family: ${font.display};
      font-size: ${type.headingPane.size};
      line-height: ${type.headingPane.lineHeight};
      font-weight: ${type.headingPane.weight};
    `,
    headerSub: css`
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
      color: ${color.text.mutedOnBrand};
      white-space: nowrap;
    `,
    headerActions: css`
      display: flex;
      gap: ${gap.control};
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    `,
    primaryButton: css`
      padding: ${theme.padding.controlBlock} ${theme.padding.controlInline};
      border-radius: ${radius.control};
      cursor: pointer;
    `,
    primaryButtonDisabled: css`
      cursor: not-allowed;
      opacity: 0.7;
    `,
    button: css`
      padding: ${theme.padding.controlBlock} ${theme.padding.controlInline};
      border-radius: ${radius.control};
      cursor: pointer;
    `,
    buttonRow: css`
      display: flex;
      gap: ${gap.tight};
      align-items: center;
    `,
    toggleOverlay: css`
      padding: ${theme.padding.controlBlock} ${theme.padding.controlInline};
      border-radius: ${radius.control};
      cursor: pointer;
    `,
    toggleOverlayOn: css`
      background: ${color.status.success.subtleFill};
      color: ${color.status.success.text};
      border-color: ${color.status.success.border};
    `,
    statusBar: css`
      padding: ${space[2]} ${space[4]};
      border-bottom: 1px solid ${color.border.decorative};
      display: flex;
      gap: ${gap.section};
      align-items: center;
      flex-shrink: 0;
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
      color: ${color.text.muted};
      background: ${color.surface.subtle};
    `,
    statusSpacer: css`
      flex: 1;
    `,
    smallLinkButton: css`
      padding: ${space[1]} ${space[2]};
      background: transparent;
      color: ${color.text.link};
      border: 1px solid ${color.border.control};
      border-radius: ${radius.control};
      cursor: pointer;
    `,
    content: css`
      flex: 1;
      overflow-y: auto;
      padding: ${space[4]};
      background: ${color.surface.workspace};
    `,
    emptyState: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: ${color.text.muted};
    `,
    emptyPrimary: css`
      font-size: ${type.bodySm.size};
      line-height: ${type.bodySm.lineHeight};
      margin: 0 0 ${space[2]} 0;
      color: ${color.text.primary};
    `,
    emptySecondary: css`
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
      margin: 0;
    `,
    successState: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      background: ${color.status.success.subtleFill};
      border-radius: ${radius.group};
    `,
    successTitle: css`
      font-family: ${font.display};
      font-size: ${type.headingPane.size};
      line-height: ${type.headingPane.lineHeight};
      color: ${color.status.success.text};
      font-weight: 700;
      margin: 0;
    `,
    successSub: css`
      font-size: ${type.bodyXs.size};
      color: ${color.status.success.text};
      margin: ${space[2]} 0 0;
    `,
    summaryGrid: css`
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: ${gap.control};
      margin-bottom: ${space[4]};
      @media (max-width: 520px) {
        grid-template-columns: repeat(2, 1fr);
      }
    `,
    summaryButton: css`
      padding: ${space[3]};
      color: ${color.text.primary};
      background: ${color.surface.subtle};
      border-radius: ${radius.group};
      border: 1px solid ${color.border.decorative};
      text-align: left;
      cursor: pointer;
      box-shadow: ${shadow.xs};
      &:hover {
        background: ${color.state.hover};
      }
      &:focus-visible {
        outline: 2px solid ${color.border.focus};
        outline-offset: 2px;
      }
    `,
    summaryButtonActive: (impact: SeverityThreshold) => css`
      background: ${getSeverityStyle(impact, themeName).colors.subtleFill};
      border-color: ${getSeverityStyle(impact, themeName).colors.border};
    `,
    summaryCount: (impact: SeverityThreshold) => css`
      font-family: ${font.display};
      font-size: 24px;
      line-height: 28px;
      font-weight: 700;
      color: ${getSeverityStyle(impact, themeName).colors.text};
    `,
    summaryLabel: css`
      font-size: ${type.labelSm.size};
      line-height: ${type.labelSm.lineHeight};
      font-weight: ${type.labelSm.weight};
      letter-spacing: ${type.labelSm.tracking};
      color: ${color.text.muted};
      text-transform: uppercase;
    `,
    section: css`
      margin-bottom: ${space[4]};
    `,
    sectionTitle: (impact: SeverityThreshold) => css`
      color: ${getSeverityStyle(impact, themeName).colors.text};
      font-family: ${font.display};
      font-size: ${type.headingCompact.size};
      line-height: ${type.headingCompact.lineHeight};
      font-weight: 700;
      margin: 0 0 ${space[2]};
    `,
    issueCard: css`
      padding: ${space[3]};
      margin-bottom: ${space[2]};
      border: 1px solid ${color.border.decorative};
      border-radius: ${radius.group};
      cursor: pointer;
      background: ${color.surface.elevated};
      box-shadow: ${shadow.xs};
    `,
    issueCardSelected: css`
      background: ${color.state.selectionFill};
      color: ${color.state.selectionText};
      border-color: ${color.border.focus};
    `,
    issueRow: css`
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: ${gap.section};
    `,
    issueMain: css`
      flex: 1;
      min-width: 0;
    `,
    issueSelectButton: css`
      flex: 1;
      min-width: 0;
      padding: 0;
      color: inherit;
      background: transparent;
      border: 0;
      font: inherit;
      text-align: left;
      cursor: pointer;
      &:focus-visible {
        outline: 2px solid ${color.border.focus};
        outline-offset: 2px;
        border-radius: ${radius.control};
      }
    `,
    issueSelectButtonSelected: css`
      &:focus-visible {
        outline-color: ${color.state.selectionText};
      }
    `,
    issueTitleRow: css`
      font-weight: 600;
      font-size: ${type.bodySm.size};
      line-height: ${type.bodySm.lineHeight};
      margin-bottom: ${space[1]};
      display: flex;
      align-items: center;
      gap: ${gap.control};
    `,
    dot: (impact: SeverityThreshold) => css`
      width: ${space[2]};
      height: ${space[2]};
      border-radius: 50%;
      background: ${getSeverityStyle(impact, themeName).colors.solidFill};
      flex-shrink: 0;
    `,
    severityLabel: (impact: SeverityThreshold) => css`
      font-size: ${type.labelSm.size};
      line-height: ${type.labelSm.lineHeight};
      color: ${getSeverityStyle(impact, themeName).colors.text};
      background: ${getSeverityStyle(impact, themeName).colors.subtleFill};
      border: 1px solid ${getSeverityStyle(impact, themeName).colors.border};
      padding: 2px ${space[1]};
      border-radius: ${radius.control};
    `,
    issueMessage: css`
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
      color: inherit;
      margin: 0 0 ${space[2]};
    `,
    selector: css`
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
      color: inherit;
      font-family: ${font.mono};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 0.8;
    `,
    issueAside: css`
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: ${gap.tight};
      flex-shrink: 0;
    `,
    helpLink: css`
      font-size: ${type.bodyXs.size};
      color: ${color.text.link};
      padding: 0 ${space[3]};
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
      &:focus-visible {
        outline: 2px solid ${color.border.focus};
        outline-offset: 2px;
        border-radius: ${radius.control};
      }
    `,
    helpLinkSelected: css`
      color: ${color.state.selectionText};
    `,
    issueGhostControlSelected: css`
      && {
        color: ${color.state.selectionText};
        border-color: ${color.state.selectionText};
      }
    `,
    disableRule: css`
      font-size: ${type.bodyXs.size};
      color: ${color.text.muted};
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-weight: 600;
    `,
    tags: css`
      display: flex;
      gap: ${gap.tight};
      margin-top: ${space[2]};
      flex-wrap: wrap;
    `,
    tag: css`
      font-size: ${type.bodyXs.size};
      padding: 2px ${space[1]};
      border: 1px solid currentColor;
      border-radius: ${radius.control};
      color: inherit;
      opacity: 0.8;
    `,
    settingsOverlay: css`
      position: absolute;
      inset: 0;
      background: ${color.surface.workspace};
      display: flex;
      flex-direction: column;
      z-index: 10;
    `,
    settingsHeader: css`
      padding: ${space[3]} ${space[4]};
      border-bottom: 1px solid ${color.border.decorative};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: ${color.surface.brand};
    `,
    settingsTitle: css`
      margin: 0;
      font-family: ${font.display};
      font-size: ${type.headingPane.size};
      line-height: ${type.headingPane.lineHeight};
      font-weight: 700;
    `,
    doneButton: css`
      padding: ${theme.padding.controlBlock} ${theme.padding.controlInline};
      border-radius: ${radius.control};
      cursor: pointer;
    `,
    settingsContent: css`
      flex: 1;
      overflow-y: auto;
      padding: ${space[4]};
    `,
    settingsSection: css`
      margin-bottom: 24px;
    `,
    settingsRowStack: css`
      display: grid;
      gap: ${gap.section};
    `,
    settingsSectionLabel: css`
      margin: 0 0 ${space[3]};
      font-size: ${type.labelSm.size};
      line-height: ${type.labelSm.lineHeight};
      font-weight: ${type.labelSm.weight};
      letter-spacing: ${type.labelSm.tracking};
      text-transform: uppercase;
      color: ${color.text.muted};
    `,
    settingsRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${space[2]} 0;
      border-bottom: 1px solid ${color.border.decorative};
      gap: ${gap.section};
    `,
    settingsRowTitle: css`
      font-size: ${type.bodySm.size};
      font-weight: 500;
    `,
    settingsRowDesc: css`
      font-size: ${type.bodyXs.size};
      color: ${color.text.muted};
      margin-top: 2px;
    `,
    select: css`
      padding: ${theme.padding.controlBlock} ${theme.padding.controlInline};
      border: 1px solid ${color.border.control};
      border-radius: ${radius.control};
      background: ${color.surface.elevated};
      color: ${color.text.primary};
      font-size: ${type.bodyXs.size};
    `,
    rulesHeaderRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: ${space[3]};
      gap: ${gap.section};
      flex-wrap: wrap;
    `,
    rulesHeaderActions: css`
      display: flex;
      gap: ${gap.tight};
    `,
    filtersRow: css`
      display: flex;
      gap: ${gap.control};
      margin-bottom: ${space[3]};
      flex-wrap: wrap;
    `,
    search: css`
      flex: 1;
      min-width: 180px;
    `,
    rulesList: css`
      border: 1px solid ${color.border.decorative};
      border-radius: ${radius.group};
      overflow-y: auto;
      background: ${color.surface.elevated};
    `,
    ruleRow: css`
      display: flex;
      align-items: flex-start;
      gap: ${gap.control};
      padding: ${space[2]} ${space[3]};
      cursor: pointer;
      background: transparent;
      &:hover {
        background: ${color.state.hover};
      }
    `,
    ruleRowDisabled: css`
      opacity: 0.6;
    `,
    ruleRowBorder: css`
      border-bottom: 1px solid ${color.border.decorative};
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
      gap: ${gap.tight};
      margin-bottom: 2px;
    `,
    ruleId: css`
      font-weight: 500;
      font-size: ${type.bodyXs.size};
    `,
    ruleIdDisabled: css`
      text-decoration: line-through;
    `,
    bpBadge: css`
      font-size: ${type.bodyXs.size};
      padding: 1px ${space[1]};
      background: ${color.status.warning.subtleFill};
      color: ${color.status.warning.text};
      border: 1px solid ${color.status.warning.border};
      border-radius: ${radius.control};
      font-weight: 500;
    `,
    ruleDesc: css`
      font-size: ${type.bodyXs.size};
      color: ${color.text.muted};
      line-height: ${type.bodyXs.lineHeight};
    `,
    catTagRow: css`
      display: flex;
      gap: ${gap.tight};
      margin-top: ${space[1]};
    `,
    catTag: css`
      font-size: ${type.bodyXs.size};
      padding: 1px ${space[1]};
      border: 1px solid ${color.border.control};
      border-radius: ${radius.control};
      color: ${color.text.muted};
    `,
  }
}

export function createStyles() {
  const { theme } = createTheme()
  const styles = createMemo(() => createA11yPanelStyles(theme()))

  return styles
}
