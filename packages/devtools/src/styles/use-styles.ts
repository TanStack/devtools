import * as goober from 'goober'
import { createSignal } from 'solid-js'
import { tokens } from './tokens'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'
import type { Accessor } from 'solid-js'

const stylesFactory = () => {
  const { colors, font, size, alpha, border } = tokens
  const { fontFamily, size: fontSize } = font
  const css = goober.css

  return {
    seoTabContainer: css`
      padding: 0;
      margin: 0 auto;
      background: ${colors.darkGray[700]};
      border-radius: 12px;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
      overflow-y: auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      overflow-y: auto;
    `,
    seoTabTitle: css`
      font-size: 1.25rem;
      font-weight: 600;
      color: ${colors.purple[400]};
      margin: 0;
      padding: 1rem 1.5rem 0.5rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid ${colors.gray[700]};
    `,
    seoTabSection: css`
      padding: 1.5rem;
      background: ${colors.darkGray[800]};
      border: 1px solid ${colors.gray[700]};
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1.5rem;
      margin-bottom: 2rem;
      border-radius: 0.75rem;
    `,
    seoPreviewSection: css`
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-bottom: 0;
      justify-content: flex-start;
      align-items: flex-start;
      overflow-x: auto;
      flex-wrap: wrap;
      padding-bottom: 0.5rem;
    `,
    seoPreviewCard: css`
      border: 1px solid ${colors.gray[700]};
      border-radius: 8px;
      padding: 12px 10px;
      background: ${colors.darkGray[900]};
      margin-bottom: 0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 200px;
      max-width: 240px;
      font-size: 0.95rem;
      gap: 4px;
    `,
    seoPreviewHeader: css`
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 6px;
      color: ${colors.purple[400]};
    `,
    seoPreviewImage: css`
      max-width: 100%;
      border-radius: 6px;
      margin-bottom: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      height: 160px;
    `,
    seoPreviewTitle: css`
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 2px;
      color: ${colors.gray[100]};
    `,
    seoPreviewDesc: css`
      color: ${colors.gray[300]};
      margin-bottom: 2px;
      font-size: 0.95rem;
    `,
    seoPreviewUrl: css`
      color: ${colors.gray[500]};
      font-size: 0.9rem;
      margin-bottom: 2px;
      word-break: break-all;
    `,
    seoMissingTagsSection: css`
      margin-top: 4px;
      font-size: 0.95rem;
      color: ${colors.red[400]};
    `,
    seoMissingTagsList: css`
      margin: 4px 0 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: 240px;
    `,
    seoMissingTag: css`
      background: ${colors.red[500]}22;
      color: ${colors.red[500]};
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 0.9rem;
      font-weight: 500;
    `,
    seoAllTagsFound: css`
      color: ${colors.green[500]};
      font-weight: 500;
      margin-left: 6px;
      font-size: 0.95rem;
    `,
    devtoolsPanelContainer: (
      panelLocation: TanStackDevtoolsConfig['panelLocation'],
      isDetached: boolean,
    ) => css`
      direction: ltr;
      position: fixed;
      overflow-y: hidden;
      overflow-x: hidden;
      ${panelLocation}: 0;
      right: 0;
      z-index: 99999;
      width: 100%;
      ${isDetached ? '' : 'max-height: 90%;'}
      border-top: 1px solid ${colors.gray[700]};
      transform-origin: top;
    `,
    devtoolsPanelContainerVisibility: (isOpen: boolean) => {
      return css`
        visibility: ${isOpen ? 'visible' : 'hidden'};
        height: ${isOpen ? 'auto' : '0'};
      `
    },
    devtoolsPanelContainerResizing: (isResizing: Accessor<boolean>) => {
      if (isResizing()) {
        return css`
          transition: none;
        `
      }

      return css`
        transition: all 0.4s ease;
      `
    },
    devtoolsPanelContainerAnimation: (isOpen: boolean, height: number) => {
      if (isOpen) {
        return css`
          pointer-events: auto;
          transform: translateY(0);
        `
      }
      return css`
        pointer-events: none;
        transform: translateY(${height}px);
      `
    },
    devtoolsPanel: css`
      display: flex;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      background-color: ${colors.darkGray[700]};
      color: ${colors.gray[300]};
      width: w-screen;
      flex-direction: row;
      overflow-x: hidden;
      overflow-y: hidden;
      height: 100%;
    `,
    dragHandle: (panelLocation: TanStackDevtoolsConfig['panelLocation']) => css`
      position: absolute;
      left: 0;
      ${panelLocation === 'bottom' ? 'top' : 'bottom'}: 0;
      width: 100%;
      height: 4px;
      cursor: row-resize;
      user-select: none;
      z-index: 100000;
      &:hover {
        background-color: ${colors.purple[400]}${alpha[90]};
      }
    `,

    mainCloseBtn: css`
      background: transparent;
      position: fixed;
      z-index: 99999;
      display: inline-flex;
      width: fit-content;
      cursor: pointer;
      appearance: none;
      border: 0;
      align-items: center;
      padding: 0;
      font-size: ${font.size.xs};
      cursor: pointer;
      transition: all 0.25s ease-out;
      &:hide-until-hover {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      }
      &:hide-until-hover:hover {
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
      }
      &:focus-visible {
        outline-offset: 2px;
        border-radius: ${border.radius.full};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
    mainCloseBtnPosition: (position: TanStackDevtoolsConfig['position']) => {
      const base = css`
        ${position === 'top-left' ? `top: ${size[2]}; left: ${size[2]};` : ''}
        ${position === 'top-right' ? `top: ${size[2]}; right: ${size[2]};` : ''}
        ${position === 'middle-left'
          ? `top: 50%; left: ${size[2]}; transform: translateY(-50%);`
          : ''}
        ${position === 'middle-right'
          ? `top: 50%; right: ${size[2]}; transform: translateY(-50%);`
          : ''}
        ${position === 'bottom-left'
          ? `bottom: ${size[2]}; left: ${size[2]};`
          : ''}
        ${position === 'bottom-right'
          ? `bottom: ${size[2]}; right: ${size[2]};`
          : ''}
      `
      return base
    },
    mainCloseBtnAnimation: (isOpen: boolean, hideUntilHover: boolean) => {
      if (!isOpen) {
        return hideUntilHover
          ? css`
              opacity: 0;

              &:hover {
                opacity: 1;
                pointer-events: auto;
                visibility: visible;
              }
            `
          : css`
              opacity: 1;
              pointer-events: auto;
              visibility: visible;
            `
      }
      return css`
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
      `
    },
    tabContainer: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      height: 100%;
      background-color: ${colors.darkGray[800]};
      border-right: 1px solid ${colors.gray[700]};
      box-shadow: 0 1px 0 ${colors.gray[700]};
      position: relative;
      width: ${size[10]};
    `,

    tab: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: ${size[10]};
      cursor: pointer;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      color: ${colors.gray[300]};
      background-color: transparent;
      border: none;
      transition: all 0.2s ease-in-out;
      border-left: 2px solid transparent;
      &:hover:not(.close):not(.active):not(.detach) {
        background-color: ${colors.gray[700]};
        color: ${colors.gray[100]};
        border-left: 2px solid ${colors.purple[500]};
      }
      &.active {
        background-color: ${colors.purple[500]};
        color: ${colors.gray[100]};
        border-left: 2px solid ${colors.purple[500]};
      }
      &.detach {
        &:hover {
          background-color: ${colors.gray[700]};
        }
        &:hover {
          color: ${colors.green[500]};
        }
      }
      &.close {
        margin-top: auto;
        &:hover {
          background-color: ${colors.gray[700]};
        }
        &:hover {
          color: ${colors.red[500]};
        }
      }

      &.disabled {
        cursor: not-allowed;
        opacity: 0.2;
        pointer-events: none;
      }
      &.disabled:hover {
        background-color: transparent;
        color: ${colors.gray[300]};
      }
    `,
    tabContent: css`
      transition: all 0.2s ease-in-out;
      width: 100%;
      height: 100%;
    `,
    pluginsTabPanel: css`
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `,
    pluginsTabDraw: css`
      width: 0px;
      height: 100%;
      background-color: ${colors.darkGray[800]};
      box-shadow: 0 1px 0 ${colors.gray[700]};
      transition: width 0.3s ease;
    `,
    pluginsTabDrawExpanded: css`
      width: ${size[48]};
      border-right: 1px solid ${colors.gray[700]};
    `,
    pluginsTabSidebar: css`
      width: ${size[48]};
      overflow-y: auto;
      transition: transform 0.3s ease;
      transform: translateX(-100%);
    `,
    pluginsTabSidebarExpanded: css`
      transform: translateX(0);
    `,
    pluginName: css`
      font-size: ${fontSize.xs};
      font-family: ${fontFamily.sans};
      color: ${colors.gray[300]};
      padding: ${size[2]};
      cursor: pointer;
      text-align: center;
      transition: all 0.2s ease-in-out;
      &:hover {
        background-color: ${colors.gray[700]};
        color: ${colors.gray[100]};
        padding: ${size[2]};
      }
      &.active {
        background-color: ${colors.purple[500]};
        color: ${colors.gray[100]};
      }
    `,
    pluginsTabContent: css`
      width: 100%;
      height: 100%;
      overflow-y: auto;
    `,

    settingsContainer: css`
      padding: 1.5rem;
      height: 100%;
      overflow-y: auto;
      background-color: ${colors.darkGray[700]};
    `,
    settingsSection: css`
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: ${colors.darkGray[800]};
      border: 1px solid ${colors.gray[700]};
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `,
    sectionTitle: css`
      font-size: 1.125rem;
      font-weight: 600;
      color: ${colors.gray[100]};
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid ${colors.gray[700]};
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-align: left;
    `,
    sectionIcon: css`
      color: ${colors.purple[400]};
    `,
    sectionDescription: css`
      color: ${colors.gray[400]};
      font-size: 0.875rem;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
      text-align: left;
    `,
    settingsGroup: css`
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `,
    conditionalSetting: css`
      margin-left: 1.5rem;
      padding-left: 1rem;
      border-left: 2px solid ${colors.purple[400]};
      background-color: ${colors.darkGray[800]};
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 0.5rem;
    `,
    settingRow: css`
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    `,
    settingsModifiers: css`
      display: flex;
      gap: 0.5rem;
    `,
  }
}

export function useStyles() {
  const [_styles] = createSignal(stylesFactory())
  return _styles
}
