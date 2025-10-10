import * as goober from 'goober'
import { createEffect, createSignal } from 'solid-js'
import { useTheme } from '../context/use-devtools-context'
import { tokens } from './tokens'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'
import type { Accessor } from 'solid-js'
import type { DevtoolsStore } from '../context/devtools-store'

const mSecondsToCssSeconds = (mSeconds: number) =>
  `${(mSeconds / 1000).toFixed(2)}s`

const stylesFactory = (theme: DevtoolsStore['settings']['theme']) => {
  const { colors, font, size, border } = tokens
  const { fontFamily, size: fontSize } = font
  const css = goober.css
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  return {
    seoTabContainer: css`
      padding: 0;
      margin: 0 auto;
      background: ${t(colors.white, colors.darkGray[700])};
      border-radius: 8px;
      box-shadow: none;
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
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      padding: 1rem 1.5rem 0.5rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[800])};
    `,
    seoTabSection: css`
      padding: 1.5rem;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      border-radius: 8px;
      padding: 12px 10px;
      background: ${t(colors.white, colors.darkGray[900])};
      margin-bottom: 0;
      box-shadow: 0 1px 3px ${t('rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)')};
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 200px;
      max-width: 240px;
      font-size: 0.95rem;
      gap: 4px;
    `,
    seoPreviewHeader: css`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    seoPreviewImage: css`
      max-width: 100%;
      border-radius: 6px;
      margin-bottom: 6px;
      box-shadow: 0 1px 2px ${t('rgba(0,0,0,0.03)', 'rgba(0,0,0,0.06)')};
      height: 160px;
      object-fit: cover;
    `,
    seoPreviewTitle: css`
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 4px;
      color: ${t(colors.gray[900], colors.gray[100])};
    `,
    seoPreviewDesc: css`
      color: ${t(colors.gray[600], colors.gray[400])};
      margin-bottom: 4px;
      font-size: 0.8rem;
    `,
    seoPreviewUrl: css`
      color: ${t(colors.gray[500], colors.gray[500])};
      font-size: 0.75rem;
      margin-bottom: 0;
      word-break: break-all;
    `,
    seoMissingTagsSection: css`
      margin-top: 4px;
      font-size: 0.875rem;
      color: ${t(colors.red[500], colors.red[400])};
    `,
    seoMissingTagsList: css`
      margin: 4px 0 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 240px;
    `,
    seoMissingTag: css`
      background: ${t(colors.red[100], colors.red[500] + '22')};
      color: ${t(colors.red[700], colors.red[500])};
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.75rem;
      font-weight: 500;
    `,
    seoAllTagsFound: css`
      color: ${t(colors.green[700], colors.green[500])};
      font-weight: 500;
      margin-left: 0;
      padding: 0 10px 8px 10px;
      font-size: 0.875rem;
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
      border-top: 1px solid ${t(colors.gray[200], colors.gray[800])};
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
    devtoolsPanelContainerAnimation: (
      isOpen: boolean,
      height: number,
      panelLocation: TanStackDevtoolsConfig['panelLocation'],
    ) => {
      if (isOpen) {
        return css`
          pointer-events: auto;
          transform: translateY(0);
        `
      }
      return css`
        pointer-events: none;
        transform: translateY(${panelLocation === 'top' ? -height : height}px);
      `
    },
    devtoolsPanel: css`
      display: flex;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      background-color: ${t(colors.white, colors.darkGray[700])};
      color: ${t(colors.gray[900], colors.gray[300])};
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
        background-color: ${t(colors.gray[400], colors.gray[500])};
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
      & > img {
        width: 56px;
        height: 56px;
        transition: all 0.3s ease;
        outline-offset: 2px;
        border-radius: ${border.radius.full};
        outline: 2px solid transparent;
      }
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
      & > img:focus-visible,
      img:hover {
        outline: 2px solid ${t(colors.black, colors.black)};
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
      background-color: ${t(colors.gray[50], colors.darkGray[900])};
      border-right: 1px solid ${t(colors.gray[200], colors.gray[800])};
      box-shadow: none;
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
      color: ${t(colors.gray[600], colors.gray[400])};
      background-color: transparent;
      border: none;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
      &:hover:not(.close):not(.active):not(.detach) {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left: 2px solid ${t(colors.gray[900], colors.gray[100])};
      }
      &.active {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left: 2px solid ${t(colors.gray[900], colors.gray[100])};
      }
      &.detach {
        &:hover {
          background-color: ${t(colors.gray[100], colors.gray[800])};
        }
        &:hover {
          color: ${t(colors.green[700], colors.green[500])};
        }
      }
      &.close {
        margin-top: auto;
        &:hover {
          background-color: ${t(colors.gray[100], colors.gray[800])};
        }
        &:hover {
          color: ${t(colors.red[700], colors.red[500])};
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

    pluginsTabDraw: (isExpanded: boolean) => css`
      width: ${isExpanded ? size[48] : 0};
      height: 100%;
      background-color: ${t(colors.white, colors.darkGray[900])};
      box-shadow: none;
      ${isExpanded
        ? `border-right: 1px solid ${t(colors.gray[200], colors.gray[800])};`
        : ''}
    `,
    pluginsTabDrawExpanded: css`
      width: ${size[48]};
      border-right: 1px solid ${t(colors.gray[200], colors.gray[800])};
    `,
    pluginsTabDrawTransition: (mSeconds: number) => {
      return css`
        transition: width ${mSecondsToCssSeconds(mSeconds)} ease;
      `
    },

    pluginsTabSidebar: (isExpanded: boolean) => css`
      width: ${size[48]};
      overflow-y: auto;
      transform: ${isExpanded ? 'translateX(0)' : 'translateX(-100%)'};
    `,

    pluginsTabSidebarTransition: (mSeconds: number) => {
      return css`
        transition: transform ${mSecondsToCssSeconds(mSeconds)} ease;
      `
    },

    pluginName: css`
      font-size: ${fontSize.xs};
      font-family: ${fontFamily.sans};
      color: ${t(colors.gray[600], colors.gray[400])};
      padding: ${size[2]};
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;

      &:hover {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        padding: ${size[2]};
      }
      &.active {
        background-color: ${t(colors.gray[100], colors.gray[800])};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left: 2px solid ${t(colors.gray[900], colors.gray[100])};
      }
      &.active:hover {
        background-color: ${t(colors.gray[200], colors.gray[700])};
      }
    `,
    pluginsTabContent: css`
      width: 100%;
      height: 100%;
      overflow-y: auto;

      &:not(:last-child) {
        border-right: 5px solid ${t(colors.purple[200], colors.purple[800])};
      }
    `,

    settingsGroup: css`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    conditionalSetting: css`
      margin-left: 1.5rem;
      padding-left: 1rem;
      border-left: 2px solid ${t(colors.gray[300], colors.gray[600])};
      background-color: ${t(colors.gray[50], colors.darkGray[900])};
      padding: 0.75rem;
      border-radius: 0.375rem;
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
  const { theme } = useTheme()
  const [styles, setStyles] = createSignal(stylesFactory(theme()))
  createEffect(() => {
    setStyles(stylesFactory(theme()))
  })
  return styles
}
