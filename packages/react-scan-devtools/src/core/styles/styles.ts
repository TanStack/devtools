import * as goober from 'goober'
import { createTheme } from '@tanstack/devtools-ui'
import { createMemo } from 'solid-js'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'

const css = goober.css

function createReactScanPanelStyles(themeName: 'light' | 'dark') {
  const theme = resolveSemanticTheme(themeName)
  const { color, font, gap, radius, shadow, space, type } = theme

  return {
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
      background: ${color.surface.brand};
    `,
    headerTitleRow: css`
      display: flex;
      align-items: center;
      gap: ${gap.control};
      min-width: 0;
      flex-wrap: wrap;
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
    toolbar: css`
      display: flex;
      gap: ${gap.control};
      align-items: flex-end;
      flex-wrap: wrap;
      padding: ${space[3]} ${space[4]} 0;
      flex-shrink: 0;
    `,
    toolbarField: css`
      flex: 1;
      min-width: 160px;
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
      margin: 0;
      color: ${color.text.primary};
    `,
    row: css`
      padding: ${space[3]};
      margin-bottom: ${space[2]};
      border: 1px solid ${color.border.decorative};
      border-radius: ${radius.group};
      cursor: pointer;
      background: ${color.surface.elevated};
      box-shadow: ${shadow.xs};
      width: 100%;
      text-align: left;
      color: inherit;
      font: inherit;
      &:hover {
        background: ${color.state.hover};
      }
      &:focus-visible {
        outline: 2px solid ${color.border.focus};
        outline-offset: 2px;
      }
    `,
    rowSelected: css`
      background: ${color.state.selectionFill};
      color: ${color.state.selectionText};
      border-color: ${color.border.focus};
    `,
    rowMain: css`
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: ${gap.section};
    `,
    rowName: css`
      font-weight: 600;
      font-size: ${type.bodySm.size};
      line-height: ${type.bodySm.lineHeight};
      word-break: break-word;
    `,
    rowMeta: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${gap.tight};
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
      color: ${color.text.muted};
      justify-content: flex-end;
    `,
    details: css`
      margin-top: ${space[3]};
      padding-top: ${space[3]};
      border-top: 1px solid ${color.border.decorative};
      display: grid;
      gap: ${space[1]};
      font-size: ${type.bodyXs.size};
      line-height: ${type.bodyXs.lineHeight};
    `,
    detailsEmpty: css`
      color: ${color.text.muted};
      margin: 0;
    `,
    changeRow: css`
      display: grid;
      gap: 2px;
    `,
    changeKind: css`
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: ${type.labelSm.size};
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
    settingsContent: css`
      flex: 1;
      overflow-y: auto;
      padding: ${space[4]};
      display: grid;
      gap: ${gap.section};
      align-content: start;
    `,
  }
}

export function createStyles() {
  const { theme } = createTheme()
  return createMemo(() => createReactScanPanelStyles(theme()))
}
