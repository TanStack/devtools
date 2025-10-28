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
      display: flex;
      flex-direction: column;
    `,

    pluginsTabSidebarTransition: (mSeconds: number) => {
      return css`
        transition: transform ${mSecondsToCssSeconds(mSeconds)} ease;
      `
    },

    pluginsList: css`
      flex: 1;
      overflow-y: auto;
    `,

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

    // No Plugins Fallback Styles
    noPluginsFallback: css`
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 2rem;
      background: ${t(colors.gray[50], colors.darkGray[700])};
      width: 100%;
      height: 100%;
    `,
    noPluginsFallbackContent: css`
      max-width: 600px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    `,
    noPluginsFallbackIcon: css`
      width: 64px;
      height: 64px;
      color: ${t(colors.gray[400], colors.gray[600])};
      margin-bottom: 0.5rem;

      svg {
        width: 100%;
        height: 100%;
      }
    `,
    noPluginsFallbackTitle: css`
      font-size: 1.5rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
    `,
    noPluginsFallbackDescription: css`
      font-size: 0.95rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      line-height: 1.5;
      margin: 0;
    `,
    noPluginsSuggestions: css`
      width: 100%;
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: ${t(colors.white, colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
    `,
    noPluginsSuggestionsTitle: css`
      font-size: 1.125rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0 0 0.5rem 0;
    `,
    noPluginsSuggestionsDesc: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0 0 1rem 0;
    `,
    noPluginsSuggestionsList: css`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    noPluginsSuggestionCard: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: ${t(colors.gray[50], colors.darkGray[900])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.375rem;
      transition: all 0.15s ease;

      &:hover {
        border-color: ${t(colors.gray[300], colors.gray[600])};
        background: ${t(colors.gray[100], colors.darkGray[800])};
      }
    `,
    noPluginsSuggestionInfo: css`
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      flex: 1;
    `,
    noPluginsSuggestionPackage: css`
      font-size: 0.95rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    `,
    noPluginsSuggestionSource: css`
      font-size: 0.8rem;
      color: ${t(colors.gray[500], colors.gray[500])};
      margin: 0;
    `,
    noPluginsSuggestionStatus: css`
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: ${t(colors.green[600], colors.green[400])};

      svg {
        width: 18px;
        height: 18px;
      }
    `,
    noPluginsSuggestionStatusText: css`
      font-size: 0.875rem;
      font-weight: 500;
    `,
    noPluginsSuggestionStatusTextError: css`
      font-size: 0.875rem;
      font-weight: 500;
      color: ${t(colors.red[600], colors.red[400])};
    `,
    noPluginsEmptyState: css`
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: ${t(colors.white, colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
    `,
    noPluginsEmptyStateText: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0;
      line-height: 1.5;
    `,
    noPluginsFallbackLinks: css`
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.5rem;
    `,
    noPluginsFallbackLink: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      text-decoration: none;
      transition: color 0.15s ease;

      &:hover {
        color: ${t(colors.gray[900], colors.gray[100])};
        text-decoration: underline;
      }
    `,
    noPluginsFallbackLinkSeparator: css`
      color: ${t(colors.gray[400], colors.gray[600])};
    `,

    // Plugin Marketplace Styles (for "Add More" tab)
    pluginMarketplace: css`
      width: 100%;
      overflow-y: auto;
      padding: 2rem;
      background: ${t(
        'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        'linear-gradient(135deg, #1a1d23 0%, #13161a 100%)',
      )};
      animation: fadeIn 0.3s ease;

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    pluginMarketplaceHeader: css`
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${t(colors.gray[200], colors.gray[700])};
    `,
    pluginMarketplaceTitleRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 0.5rem;
    `,
    pluginMarketplaceTitle: css`
      font-size: 1.5rem;
      font-weight: 700;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      letter-spacing: -0.02em;
    `,
    pluginMarketplaceDescription: css`
      font-size: 0.95rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0 0 1rem 0;
      line-height: 1.5;
    `,
    pluginMarketplaceSearchWrapper: css`
      position: relative;
      display: flex;
      align-items: center;
      max-width: 400px;
      flex-shrink: 0;

      svg {
        position: absolute;
        left: 1rem;
        color: ${t(colors.gray[400], colors.gray[500])};
        pointer-events: none;
      }
    `,
    pluginMarketplaceSearch: css`
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      background: ${t(colors.gray[50], colors.darkGray[900])};
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
      color: ${t(colors.gray[900], colors.gray[100])};
      font-size: 0.875rem;
      font-family: ${fontFamily.sans};
      transition: all 0.2s ease;

      &::placeholder {
        color: ${t(colors.gray[400], colors.gray[500])};
      }

      &:focus {
        outline: none;
        border-color: ${t(colors.blue[500], colors.blue[400])};
        background: ${t(colors.white, colors.darkGray[800])};
        box-shadow: 0 0 0 3px
          ${t('rgba(59, 130, 246, 0.1)', 'rgba(96, 165, 250, 0.1)')};
      }
    `,
    pluginMarketplaceFilters: css`
      margin-top: 1.5rem;
      padding-top: 1rem;
    `,
    pluginMarketplaceTagsContainer: css`
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding: 1rem;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
    `,
    pluginMarketplaceTagButton: css`
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: ${t(colors.white, colors.darkGray[700])};
      border: 2px solid ${t(colors.gray[300], colors.gray[600])};
      border-radius: 0.375rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[600])};
        border-color: ${t(colors.gray[400], colors.gray[500])};
        color: ${t(colors.gray[900], colors.gray[100])};
      }
    `,
    pluginMarketplaceTagButtonActive: css`
      background: ${t(
        'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      )} !important;
      border-color: ${t('#2563eb', '#3b82f6')} !important;
      color: white !important;

      &:hover {
        background: ${t(
          'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        )} !important;
        border-color: ${t('#1d4ed8', '#2563eb')} !important;
      }
    `,
    pluginMarketplaceSettingsButton: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: ${t(colors.gray[100], colors.darkGray[800])};
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 0.5rem;

      &:hover {
        background: ${t(colors.gray[200], colors.darkGray[700])};
        border-color: ${t(colors.gray[300], colors.gray[600])};
        color: ${t(colors.gray[900], colors.gray[100])};
      }

      &:active {
        transform: scale(0.95);
      }
    `,
    pluginMarketplaceSettingsPanel: css`
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 350px;
      background: ${t(colors.white, colors.darkGray[800])};
      border-left: 1px solid ${t(colors.gray[200], colors.gray[700])};
      box-shadow: -4px 0 12px ${t('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)')};
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease;

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }
    `,
    pluginMarketplaceSettingsPanelHeader: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[700])};
    `,
    pluginMarketplaceSettingsPanelTitle: css`
      font-size: 1.125rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
    `,
    pluginMarketplaceSettingsPanelClose: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: transparent;
      border: none;
      color: ${t(colors.gray[600], colors.gray[400])};
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.15s ease;

      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[700])};
        color: ${t(colors.gray[900], colors.gray[100])};
      }
    `,
    pluginMarketplaceSettingsPanelContent: css`
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    `,
    pluginMarketplaceGrid: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      animation: slideUp 0.4s ease;

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    pluginMarketplaceCard: css`
      background: ${t(colors.white, colors.darkGray[800])};
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: ${t(
          'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
          'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
        )};
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.25s ease;
      }

      &:hover {
        border-color: ${t(colors.gray[400], colors.gray[500])};
        box-shadow: 0 8px 24px ${t('rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)')};
        transform: translateY(-4px);

        &::before {
          transform: scaleX(1);
        }
      }
    `,
    pluginMarketplaceCardIcon: css`
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${t(
        'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
      )};
      border-radius: 0.5rem;
      color: white;
      transition: transform 0.25s ease;

      svg {
        width: 20px;
        height: 20px;
      }

      &.custom-logo {
      }
    `,
    pluginMarketplaceCardHeader: css`
      flex: 1;
    `,
    pluginMarketplaceCardTitle: css`
      font-size: 0.95rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    `,
    pluginMarketplaceCardDescription: css`
      font-size: 0.8rem;
      color: ${t(colors.gray[500], colors.gray[500])};
      margin: 0;
      padding: 0;
      background: transparent;
      border-radius: 0.375rem;
      display: block;
      font-weight: 500;
    `,
    pluginMarketplaceCardPackageBadge: css`
      margin-top: 4px;
      margin-bottom: 8px;
      font-size: 0.6875rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      opacity: 0.6;
      padding: 4px 8px;
      padding-left: 0;
      background-color: var(--bg-tertiary);
      border-radius: 4px;
      word-break: break-all;
      display: inline-block;
    `,
    pluginMarketplaceCardDescriptionText: css`
      line-height: 1.5;
      margin-top: 0;
    `,
    pluginMarketplaceCardVersionInfo: css`
      margin-top: 8px;
      font-size: 0.6875rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    `,
    pluginMarketplaceCardVersionSatisfied: css`
      color: ${t(colors.green[600], colors.green[400])};
    `,
    pluginMarketplaceCardVersionUnsatisfied: css`
      color: ${t(colors.red[600], colors.red[400])};
    `,
    pluginMarketplaceCardDocsLink: css`
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: ${t(colors.blue[600], colors.blue[400])};
      text-decoration: none;
      margin-top: 0.5rem;
      transition: color 0.15s ease;

      &:hover {
        color: ${t(colors.blue[700], colors.blue[300])};
        text-decoration: underline;
      }

      svg {
        width: 12px;
        height: 12px;
      }
    `,
    pluginMarketplaceCardTags: css`
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.75rem;
    `,
    pluginMarketplaceCardTag: css`
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      background: ${t(colors.gray[100], colors.darkGray[700])};
      border: 1px solid ${t(colors.gray[300], colors.gray[600])};
      border-radius: 0.25rem;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    pluginMarketplaceCardImage: css`
      width: 28px;
      height: 28px;
      object-fit: contain;
    `,
    pluginMarketplaceNewBanner: css`
      position: absolute;
      top: 12px;
      right: -35px;
      background-color: ${t(colors.green[500], colors.green[500])};
      color: white;
      padding: 4px 40px;
      font-size: 0.6875rem;
      font-weight: bold;
      text-transform: uppercase;
      transform: rotate(45deg);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
      z-index: 10;
      letter-spacing: 0.5px;
    `,
    pluginMarketplaceCardFeatured: css`
      border-color: ${t(colors.blue[500], colors.blue[400])};
      border-width: 2px;
    `,
    pluginMarketplaceCardActive: css`
      border-color: ${t(colors.green[500], colors.green[600])};
      border-width: 2px;

      &:hover {
        border-color: ${t(colors.green[500], colors.green[600])};
        box-shadow: none;
        transform: none;

        &::before {
          transform: scaleX(0);
        }
      }
    `,
    pluginMarketplaceCardStatus: css`
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: ${t(colors.green[600], colors.green[400])};
      animation: statusFadeIn 0.3s ease;

      @keyframes statusFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      svg {
        width: 18px;
        height: 18px;
        animation: iconPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes iconPop {
        0% {
          transform: scale(0);
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
        }
      }
    `,
    pluginMarketplaceCardSpinner: css`
      width: 18px;
      height: 18px;
      border: 2px solid ${t(colors.gray[200], colors.gray[700])};
      border-top-color: ${t(colors.blue[600], colors.blue[400])};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
    pluginMarketplaceCardStatusText: css`
      font-size: 0.875rem;
      font-weight: 600;
    `,
    pluginMarketplaceCardStatusTextError: css`
      font-size: 0.875rem;
      font-weight: 600;
      color: ${t(colors.red[600], colors.red[400])};
    `,
    pluginMarketplaceEmpty: css`
      padding: 3rem 2rem;
      text-align: center;
      background: ${t(colors.white, colors.darkGray[800])};
      border: 2px dashed ${t(colors.gray[300], colors.gray[700])};
      border-radius: 0.75rem;
      animation: fadeIn 0.3s ease;
    `,
    pluginMarketplaceEmptyText: css`
      font-size: 0.95rem;
      color: ${t(colors.gray[600], colors.gray[400])};
      margin: 0;
      line-height: 1.6;
    `,

    // Framework sections
    pluginMarketplaceSection: css`
      margin-bottom: 2.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    `,
    pluginMarketplaceSectionHeader: css`
      margin-bottom: 1rem;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 0.5rem;
      transition: all 0.15s ease;

      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[700])};
        border-color: ${t(colors.gray[300], colors.gray[600])};
      }
    `,
    pluginMarketplaceSectionHeaderLeft: css`
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceSectionChevron: css`
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${t(colors.gray[700], colors.gray[300])};
      transition: transform 0.2s ease;
    `,
    pluginMarketplaceSectionChevronCollapsed: css`
      transform: rotate(-90deg);
    `,
    pluginMarketplaceSectionTitle: css`
      font-size: 1.25rem;
      font-weight: 700;
      color: ${t(colors.gray[900], colors.gray[50])};
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceSectionBadge: css`
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      background: ${t(
        'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      )};
      color: white;
      border-radius: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `,
    pluginMarketplaceFeatureBanner: css`
      margin-top: 1rem;
      padding: 1.25rem 1.5rem;
      background: ${t(
        'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      )};
      border-radius: 0.75rem;
      border: 1px solid ${t(colors.blue[400], colors.blue[800])};
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `,
    pluginMarketplaceFeatureBannerContent: css`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    pluginMarketplaceFeatureBannerTitle: css`
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceFeatureBannerIcon: css`
      width: 24px;
      height: 24px;
      display: inline-flex;
    `,
    pluginMarketplaceFeatureBannerText: css`
      font-size: 0.95rem;
      color: ${t('rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)')};
      line-height: 1.5;
      margin: 0;
    `,
    pluginMarketplaceFeatureBannerButton: css`
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: white;
      color: ${colors.blue[600]};
      font-weight: 600;
      font-size: 0.95rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      align-self: flex-start;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      &:hover {
        background: ${t(colors.gray[50], colors.gray[100])};
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    `,
    pluginMarketplaceFeatureBannerButtonIcon: css`
      width: 18px;
      height: 18px;
    `,
    pluginMarketplaceCardDisabled: css`
      opacity: 0.6;
      filter: grayscale(0.3);
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    `,

    // Card state badges
    pluginMarketplaceCardBadge: css`
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 0.25rem;
      letter-spacing: 0.05em;
    `,
    pluginMarketplaceCardBadgeInstall: css`
      background: ${t(colors.green[100], colors.green[900])};
      color: ${t(colors.green[700], colors.green[300])};
    `,
    pluginMarketplaceCardBadgeAdd: css`
      background: ${t(colors.blue[100], colors.blue[900])};
      color: ${t(colors.blue[700], colors.blue[300])};
    `,
    pluginMarketplaceCardBadgeRequires: css`
      background: ${t(colors.gray[100], colors.gray[800])};
      color: ${t(colors.gray[600], colors.gray[400])};
    `,

    // Button style for already installed plugins
    pluginMarketplaceButtonInstalled: css`
      opacity: 0.5;
    `,

    // Add More Tab Style (visually distinct from regular plugins)
    pluginNameAddMore: css`
      font-size: ${fontSize.xs};
      font-family: ${fontFamily.sans};
      color: ${t(colors.gray[600], colors.gray[400])};
      padding: ${size[3]} ${size[2]};
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
      background: ${t(
        'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      )};
      font-weight: 600;
      position: relative;
      margin-top: auto;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;

        &::before {
          content: '✨';
          font-size: 0.875rem;
          animation: sparkle 2s ease-in-out infinite;
        }
      }

      @keyframes sparkle {
        0%,
        100% {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.1) rotate(10deg);
        }
      }

      &:hover {
        background: ${t(
          'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
          'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
        )};
        color: ${t(colors.gray[900], colors.gray[100])};
        border-left-color: ${t(colors.blue[500], colors.blue[400])};

        h3::before {
          animation: sparkle 0.5s ease-in-out infinite;
        }
      }

      &.active {
        background: ${t(
          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        )};
        color: ${t(colors.white, colors.white)};
        border-left: 2px solid ${t(colors.blue[600], colors.blue[300])};
        box-shadow: 0 4px 12px
          ${t('rgba(59, 130, 246, 0.3)', 'rgba(96, 165, 250, 0.3)')};

        h3::before {
          filter: brightness(0) invert(1);
        }
      }

      &.active:hover {
        background: ${t(
          'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        )};
      }
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
