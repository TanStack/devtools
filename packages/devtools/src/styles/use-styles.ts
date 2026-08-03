import * as goober from 'goober'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'
import { createEffect, createSignal } from 'solid-js'
import { createTheme } from '../context/use-devtools-context'
import {
  PLUGINS_STRIP_HEIGHT,
  WORKBENCH_HEADER_HEIGHT,
} from '../utils/constants'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'
import type { Accessor } from 'solid-js'
import type { DevtoolsStore } from '../context/devtools-store'

type SemanticRamp = Record<
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
  string
>

const mSecondsToCssSeconds = (mSeconds: number) =>
  `${(mSeconds / 1000).toFixed(2)}s`

const WORKBENCH_GEOMETRY_STYLE_ID = 'tanstack-devtools-workbench-geometry'

export const ensureWorkbenchGeometryStyles = (targetDocument: Document) => {
  if (targetDocument.getElementById(WORKBENCH_GEOMETRY_STYLE_ID)) return
  const style = targetDocument.createElement('style')
  style.id = WORKBENCH_GEOMETRY_STYLE_ID
  style.textContent = `
@media (max-width: 360px) {
  .tsd-workbench-wordmark { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .tsd-workbench-secondary-tabs, .tsd-workbench-secondary-tabs > * { transition: none !important; }
  .tsd-motion-safe { animation: none !important; transition: none !important; transform: none !important; }
}`
  targetDocument.head.appendChild(style)
}

const fadeIn = goober.keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const slideInRight = goober.keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`

const slideUp = goober.keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const statusFadeIn = goober.keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const spin = goober.keyframes`
  to {
    transform: rotate(360deg);
  }
`

const sparkle = goober.keyframes`
  0%,
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1) rotate(10deg);
  }
`

const stylesFactory = (theme: DevtoolsStore['settings']['theme']) => {
  const semantic = resolveSemanticTheme(theme)
  const size = {
    2: semantic.space[2],
    3: semantic.space[3],
    10: '40px',
    48: '192px',
  } as const
  const colors = {
    black: semantic.color.text.primary,
    white: semantic.color.surface.elevated,
    darkGray: {
      600: semantic.color.surface.elevated,
      700: semantic.color.surface.workspace,
      800: semantic.color.surface.subtle,
      900: semantic.color.surface.app,
    } as SemanticRamp,
    gray: {
      50: semantic.color.surface.subtle,
      100: semantic.color.surface.subtle,
      200: semantic.color.border.decorative,
      300: semantic.color.border.control,
      400: semantic.color.text.muted,
      500: semantic.color.text.muted,
      600: semantic.color.text.secondary,
      700: semantic.color.text.secondary,
      800: semantic.color.text.primary,
      900: semantic.color.text.primary,
    } as SemanticRamp,
    blue: Object.fromEntries(
      [100, 300, 400, 500, 600, 700, 800, 900].map((step) => [
        step,
        step === 100
          ? semantic.color.status.info.subtleFill
          : step >= 700
            ? semantic.color.status.info.text
            : semantic.color.status.info.border,
      ]),
    ) as SemanticRamp,
    green: Object.fromEntries(
      [100, 300, 400, 500, 600, 700, 900].map((step) => [
        step,
        step === 100
          ? semantic.color.status.success.subtleFill
          : semantic.color.status.success.text,
      ]),
    ) as SemanticRamp,
    red: Object.fromEntries(
      [100, 400, 500, 600, 700].map((step) => [
        step,
        step === 100
          ? semantic.color.status.error.subtleFill
          : semantic.color.status.error.text,
      ]),
    ) as SemanticRamp,
    purple: {
      200: semantic.color.status.neutral.subtleFill,
      800: semantic.color.status.neutral.text,
    } as SemanticRamp,
  }
  const fontFamily = { sans: semantic.font.body, mono: semantic.font.mono }
  const fontSize = {
    xs: semantic.type.bodyXs.size,
    sm: semantic.type.bodySm.size,
  }
  const css = goober.css
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  return {
    seoTabContainer: css`
      font-family: ${semantic.font.body};
      font-weight: ${semantic.type.bodySm.weight};
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
      font-family: ${semantic.font.display};
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
    seoWorkspace: css`
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    `,
    seoContent: css`
      flex: 1 1 auto;
      height: auto;
      min-height: 0;
      overflow-y: auto;
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
      box-shadow: ${semantic.shadow.sm};
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
      color: ${semantic.color.text.primary};
    `,
    seoPreviewImage: css`
      max-width: 100%;
      border-radius: 6px;
      margin-bottom: 6px;
      box-shadow: ${semantic.shadow.xs};
      height: 160px;
      object-fit: cover;
    `,
    seoPreviewTitle: css`
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 4px;
      color: ${semantic.color.text.primary};
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
    serpPreviewBlock: css`
      margin-bottom: 1.5rem;
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 10px;
      padding: 1rem;
    `,
    serpPreviewLabel: css`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: ${semantic.color.text.primary};
    `,
    serpSnippet: css`
      border: 1px solid ${t(colors.gray[100], colors.gray[800])};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: ${t(colors.white, colors.darkGray[900])};
      max-width: 600px;
      font-family: ${fontFamily.sans};
      box-shadow: ${semantic.shadow.xs};
    `,
    serpSnippetMobile: css`
      border: 1px solid ${t(colors.gray[100], colors.gray[800])};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: ${t(colors.white, colors.darkGray[900])};
      max-width: 380px;
      font-family: ${fontFamily.sans};
      box-shadow: ${semantic.shadow.xs};
    `,
    serpSnippetDescMobile: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    `,
    serpSnippetTopRow: css`
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    `,
    serpSnippetFavicon: css`
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: contain;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    serpSnippetDefaultFavicon: css`
      width: 28px;
      height: 28px;
      background-color: ${t(colors.gray[200], colors.gray[800])};
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: contain;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    serpSnippetSiteColumn: css`
      display: flex;
      flex-direction: column;
      gap: 0;
      min-width: 0;
    `,
    serpSnippetSiteName: css`
      font-size: 0.875rem;
      color: ${semantic.color.text.primary};
      line-height: 1.4;
      margin: 0;
    `,
    serpSnippetSiteUrl: css`
      font-size: 0.75rem;
      color: ${t(colors.gray[500], colors.gray[500])};
      line-height: 1.4;
      margin: 0;
    `,
    serpSnippetTitle: css`
      font-size: 1.25rem;
      font-weight: 400;
      color: ${semantic.color.text.link};
      margin: 0 0 4px 0;
      line-height: 1.3;
    `,
    serpSnippetDesc: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      margin: 0;
      line-height: 1.5;
    `,
    serpMeasureHidden: css`
      position: absolute;
      left: -9999px;
      top: 0;
      visibility: hidden;
      pointer-events: none;
      box-sizing: border-box;
    `,
    serpMeasureHiddenMobile: css`
      position: absolute;
      left: -9999px;
      top: 0;
      width: 340px;
      visibility: hidden;
      pointer-events: none;
      font-size: 0.875rem;
      line-height: 1.5;
    `,
    serpReportSection: css`
      margin-top: 1rem;
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    serpErrorList: css`
      margin: 4px 0 0 0;
      padding-left: 1.25rem;
      list-style-type: disc;
    `,
    serpReportItem: css`
      margin-top: 0.25rem;
      color: ${t(colors.red[700], colors.red[400])};
      font-size: 0.875rem;
    `,
    devtoolsPanelContainer: (
      panelLocation: TanStackDevtoolsConfig['panelLocation'],
      isDetached: boolean,
    ) => css`
      direction: ltr;
      position: fixed;
      overflow: visible;
      ${panelLocation}: 0;
      inset-inline: 0;
      z-index: 99999;
      inline-size: 100%;
      max-inline-size: 100%;
      box-sizing: border-box;
      ${isDetached ? '' : 'max-height: 90%;'}
      border: 0;
      box-shadow: none;
      transition: transform 160ms ease-out;
      @media (prefers-reduced-motion: reduce) {
        transition-duration: 0ms;
      }
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
        transition: transform 160ms ease-out;
        @media (prefers-reduced-motion: reduce) {
          transition-duration: 0ms;
        }
      `
    },
    devtoolsDrawerContent: css`
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    `,
    devtoolsPanel: css`
      display: grid;
      font-size: ${fontSize.sm};
      font-family: ${fontFamily.sans};
      background-color: ${t(colors.white, colors.darkGray[700])};
      color: ${t(colors.gray[900], colors.gray[300])};
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      grid-template-rows: ${WORKBENCH_HEADER_HEIGHT}px minmax(0, 1fr);
      &:has([data-testid='plugins-strip']) {
        grid-template-rows:
          ${WORKBENCH_HEADER_HEIGHT}px ${PLUGINS_STRIP_HEIGHT}px
          minmax(0, 1fr);
      }
      overflow-x: hidden;
      overflow-y: hidden;
      height: 100%;
    `,
    workbenchHeader: css`
      display: flex;
      align-items: center;
      gap: ${semantic.gap.control};
      min-width: 0;
      height: ${WORKBENCH_HEADER_HEIGHT}px;
      padding: 0 ${semantic.space[2]};
      box-sizing: border-box;
      background: ${semantic.color.surface.brand};
      color: ${semantic.color.text.mutedOnBrand};
      & button {
        min-width: 28px;
        height: 100%;
        box-sizing: border-box;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
      }
      & button:hover:not([data-tsd-selected='true']) {
        background: ${semantic.color.state.hover};
      }
      & button:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
      @media (max-width: 430px) {
        gap: ${semantic.gap.tight};
        padding-inline: ${semantic.space[2]};
        & button {
          min-width: 24px;
        }
      }
      @media (max-width: 360px) {
        gap: 2px;
        padding-inline: 4px;
        & button {
          padding-inline: 3px;
          font-size: 11px;
        }
      }
    `,
    workbenchLogo: css`
      display: inline-flex;
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      & > img {
        width: 24px;
        height: 24px;
        object-fit: contain;
        filter: ${theme === 'dark' ? 'brightness(2.5) contrast(1.1)' : 'none'};
      }
      @media (max-width: 360px) {
        width: 20px;
        height: 20px;
        flex-basis: 20px;
        & > img {
          width: 20px;
          height: 20px;
        }
      }
    `,
    workbenchDestinations: css`
      display: inline-flex;
      align-items: stretch;
      align-self: stretch;
      gap: 0;
      min-width: 0;
      margin: 0;
      padding: 0;
    `,
    workbenchNavButton: css`
      margin: 0;
      padding-inline: 12px;
      &[data-tsd-selected='true'] {
        background: ${semantic.color.surface.workspace};
        color: ${semantic.color.text.primary};
      }
      @media (max-width: 361px) {
        padding-inline: 4px;
      }
    `,
    workbenchActions: css`
      display: inline-flex;
      align-items: center;
      gap: ${semantic.gap.tight};
      height: 100%;
      margin-left: auto;
      @media (max-width: 360px) {
        gap: 0;
      }
    `,
    workbenchActionButton: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${WORKBENCH_HEADER_HEIGHT}px;
      min-width: ${WORKBENCH_HEADER_HEIGHT}px;
      height: ${WORKBENCH_HEADER_HEIGHT}px;
      flex: 0 0 ${WORKBENCH_HEADER_HEIGHT}px;
      padding: 0;
      &[data-tsd-selected='true'] {
        background: ${semantic.color.surface.workspace};
        color: ${semantic.color.text.primary};
      }
      @media (max-width: 360px) {
        width: 32px;
        min-width: 32px;
        flex-basis: 32px;
      }
    `,
    workbenchWordmark: css`
      white-space: nowrap;
      @media (max-width: 430px) {
        display: none;
      }
    `,
    workbenchSecondaryTabs: css`
      display: flex;
      align-items: center;
      gap: 0;
      min-width: 0;
      box-sizing: border-box;
      padding-block: 6px;
      padding-inline-start: ${semantic.space[2]};
      padding-inline-end: ${semantic.space[2]};
      scroll-padding-inline-start: ${semantic.space[2]};
      scroll-padding-inline-end: ${semantic.space[2]};
      height: ${PLUGINS_STRIP_HEIGHT}px;
      min-height: ${PLUGINS_STRIP_HEIGHT}px;
      flex: 0 0 ${PLUGINS_STRIP_HEIGHT}px;
      background: ${semantic.color.surface.workspace};
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      & > * {
        transform: none;
        transition: none;
      }
      & > :last-child {
        scroll-margin-inline-end: ${semantic.space[2]};
      }
      @media (prefers-reduced-motion: reduce) {
        transition-duration: 0ms;
      }
    `,
    workbenchSecondaryTab: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: ${semantic.padding.controlBlock}
        ${semantic.padding.controlInline};
      border: 1px solid transparent;
      border-radius: ${semantic.radius.control};
      background: transparent;
      color: ${semantic.color.text.secondary};
      font-family: ${semantic.font.body};
      font-size: ${semantic.type.labelSm.size};
      font-weight: ${semantic.type.labelSm.weight};
      line-height: ${semantic.type.labelSm.lineHeight};
      letter-spacing: ${semantic.type.labelSm.tracking};
      cursor: pointer;
      flex: 0 0 auto;
      appearance: none;
      &:hover {
        background: ${semantic.color.state.hover};
        color: ${semantic.color.text.primary};
      }
      &[data-tsd-selected='true'] {
        background: ${semantic.color.state.selectionFill};
        border-color: ${semantic.color.state.selectionFill};
        color: ${semantic.color.state.selectionText};
      }
      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
    `,
    pluginTitleText: css`
      margin: 0;
      color: inherit;
      font-family: ${semantic.font.body};
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      letter-spacing: inherit;
    `,
    dragHandle: (panelLocation: TanStackDevtoolsConfig['panelLocation']) => css`
      position: absolute;
      left: 0;
      ${panelLocation === 'bottom' ? 'top' : 'bottom'}: -10px;
      width: 100%;
      height: 24px;
      cursor: row-resize;
      user-select: none;
      z-index: 100000;
      background-color: transparent;
      &::after {
        content: '';
        position: absolute;
        left: 0;
        width: 100%;
        top: 10px;
        height: 4px;
        background-color: transparent;
      }
      &:hover::after,
      &:focus-visible::after {
        background-color: ${semantic.color.border.control};
      }
    `,
    drawerToggle: (
      panelLocation: TanStackDevtoolsConfig['panelLocation'],
    ) => css`
      position: absolute;
      ${panelLocation === 'bottom' ? 'top' : 'bottom'}: -28px;
      inset-inline-end: 7%;
      z-index: 100001;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 28px;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: ${semantic.radius.control};
      background: ${semantic.color.surface.brand};
      box-shadow: none;
      color: ${semantic.color.text.mutedOnBrand};
      cursor: pointer;
      &:hover {
        background: ${semantic.color.state.hover};
      }
      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
    `,
    drawerToggleIcon: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      transition: transform 160ms ease-out;
      @media (prefers-reduced-motion: reduce) {
        transition-duration: 0ms;
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
      font-size: ${fontSize.xs};
      cursor: pointer;
      transition: opacity 0.25s ease-out;
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
    `,
    mainCloseBtnDefault: css`
      background: ${semantic.color.surface.brand};
      width: 56px;
      height: 56px;
      justify-content: center;
      border-radius: 12px;
      box-shadow: ${semantic.shadow.sm};
      transition:
        opacity 0.25s ease-out,
        background-color 0.2s ease-out,
        box-shadow 0.2s ease-out;
      & > img {
        width: 48px;
        height: 48px;
        object-fit: contain;
        transition: all 0.3s ease;
        border-radius: 8px;
        outline: none;
      }
      &:hover {
        background: ${semantic.color.state.hover};
        box-shadow: ${semantic.shadow.overlay};
      }
      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
    `,
    mainCloseBtnFloating: css`
      /* Floating placement is driven by inline left/top, so don't animate
         position (would fight the drag/throw rAF loop) — only opacity. */
      transition: opacity 0.25s ease-out;
      cursor: grab;
      touch-action: none;
      user-select: none;
      &:active {
        cursor: grabbing;
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
      & > svg {
        flex-shrink: 0;
      }
    `,
    tabContent: css`
      transition: all 0.2s ease-in-out;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
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
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
    `,
    pluginPaneSeparator: css`
      flex: 0 0 1px;
      align-self: stretch;
      background: ${semantic.color.border.decorative};
      @media (forced-colors: active) {
        background: CanvasText;
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
    settingsStack: css`
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
      font-family: ${semantic.font.display};
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
      font-family: ${semantic.font.display};
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
      font-family: ${semantic.font.mono};
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
      font-family: ${semantic.font.body};
      color: ${semantic.color.text.primary};
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      padding: 2rem;
      background: ${semantic.color.surface.workspace};
      animation: ${fadeIn} 0.3s ease;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
      @media (max-width: 430px) {
        padding: ${semantic.space[3]};
      }
    `,
    pluginMarketplaceHeader: css`
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${semantic.color.border.decorative};
    `,
    pluginMarketplaceTitleRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    `,
    pluginMarketplaceControls: css`
      display: flex;
      align-items: center;
      flex: 1 1 320px;
      width: 100%;
      max-width: 448px;
      min-width: 0;
      margin-left: auto;
    `,
    pluginMarketplaceTitle: css`
      font-family: ${semantic.font.display};
      font-size: 1.5rem;
      font-weight: 700;
      color: ${semantic.color.text.primary};
      margin: 0;
      letter-spacing: -0.02em;
    `,
    pluginMarketplaceDescription: css`
      font-size: 0.95rem;
      color: ${semantic.color.text.secondary};
      margin: 0 0 1rem 0;
      line-height: 1.5;
    `,
    pluginMarketplaceSearchWrapper: css`
      position: relative;
      display: flex;
      align-items: center;
      flex: 1 1 0%;
      width: auto;
      max-width: 400px;
      min-width: 0;
      @media (max-width: 430px) {
        width: 100%;
        max-width: none;
      }

      svg {
        position: absolute;
        left: 1rem;
        color: ${semantic.color.text.muted};
        pointer-events: none;
      }
    `,
    pluginMarketplaceSearch: css`
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      background: ${semantic.color.surface.app};
      border: 2px solid ${semantic.color.border.control};
      border-radius: 0.5rem;
      color: ${semantic.color.text.primary};
      font-size: 0.875rem;
      font-family: ${fontFamily.sans};
      transition: all 0.2s ease;

      &::placeholder {
        color: ${semantic.color.text.muted};
      }

      &:focus {
        outline: none;
        border-color: ${semantic.color.border.focus};
        background: ${semantic.color.surface.elevated};
        box-shadow: 0 0 0 3px ${semantic.color.state.pressed};
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
      background: ${semantic.color.surface.subtle};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: 0.5rem;
    `,
    pluginMarketplaceTagButton: css`
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: ${semantic.color.surface.elevated};
      border: 2px solid ${semantic.color.border.control};
      border-radius: 0.375rem;
      color: ${semantic.color.text.secondary};
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: ${semantic.color.state.hover};
        border-color: ${semantic.color.border.control};
        color: ${semantic.color.text.primary};
      }
    `,
    pluginMarketplaceTagButtonActive: css`
      background: ${semantic.color.state.selectionFill} !important;
      border-color: ${semantic.color.state.selectionFill} !important;
      color: ${semantic.color.state.selectionText} !important;

      &:hover {
        background: ${semantic.color.state.selectionFill} !important;
        border-color: ${semantic.color.border.focus} !important;
      }
    `,
    pluginMarketplaceSettingsButton: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background: ${semantic.color.surface.subtle};
      border: 2px solid ${semantic.color.border.control};
      border-radius: 0.5rem;
      color: ${semantic.color.text.secondary};
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 0.5rem;

      &:hover {
        background: ${semantic.color.state.hover};
        border-color: ${semantic.color.border.control};
        color: ${semantic.color.text.primary};
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
      max-width: 100%;
      box-sizing: border-box;
      background: ${semantic.color.surface.elevated};
      border-left: 1px solid ${semantic.color.border.decorative};
      box-shadow: ${semantic.shadow.overlay};
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: ${slideInRight} 0.3s ease;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `,
    pluginMarketplaceSettingsPanelHeader: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid ${semantic.color.border.decorative};
    `,
    pluginMarketplaceSettingsPanelTitle: css`
      font-family: ${semantic.font.display};
      font-size: 1.125rem;
      font-weight: 600;
      color: ${semantic.color.text.primary};
      margin: 0;
    `,
    pluginMarketplaceSettingsPanelClose: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      background: transparent;
      border: none;
      color: ${semantic.color.text.secondary};
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.15s ease;

      &:hover {
        background: ${semantic.color.state.hover};
        color: ${semantic.color.text.primary};
      }
    `,
    pluginMarketplaceSettingsPanelContent: css`
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    `,
    pluginMarketplaceGrid: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
      gap: 1.25rem;
      animation: ${slideUp} 0.4s ease;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `,
    pluginMarketplaceCard: css`
      background: ${semantic.color.surface.elevated};
      border: 2px solid ${semantic.color.border.decorative};
      border-radius: 0.75rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition:
        border-color 120ms ease-out,
        box-shadow 120ms ease-out,
        transform 120ms ease-out;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: ${semantic.color.state.selectionFill};
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.25s ease;
      }

      &:hover {
        border-color: ${semantic.color.border.control};
        box-shadow: ${semantic.shadow.overlay};
        transform: translateY(-2px);

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
      background: ${semantic.color.state.selectionFill};
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
      color: ${semantic.color.text.primary};
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    `,
    pluginMarketplaceCardDescription: css`
      font-size: 0.8rem;
      color: ${semantic.color.text.muted};
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
      font-family: ${semantic.font.mono};
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
      font-family: ${semantic.font.mono};
    `,
    pluginMarketplaceCardVersionSatisfied: css`
      color: ${semantic.color.status.success.text};
    `,
    pluginMarketplaceCardVersionUnsatisfied: css`
      color: ${semantic.color.status.error.text};
    `,
    pluginMarketplaceCardDocsLink: css`
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: ${semantic.color.text.link};
      text-decoration: none;
      margin-top: 0.5rem;
      transition: color 0.15s ease;

      &:hover {
        color: ${semantic.color.text.link};
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
      background: ${semantic.color.surface.subtle};
      border: 1px solid ${semantic.color.border.control};
      border-radius: 0.25rem;
      color: ${semantic.color.text.secondary};
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
      background-color: ${semantic.color.status.success.solidFill};
      color: white;
      padding: 4px 40px;
      font-size: 0.6875rem;
      font-weight: bold;
      text-transform: uppercase;
      transform: rotate(45deg);
      box-shadow: ${semantic.shadow.sm};
      z-index: 10;
      letter-spacing: 0.5px;
    `,
    pluginMarketplaceCardFeatured: css`
      border-color: ${semantic.color.status.info.border};
      border-width: 2px;
    `,
    pluginMarketplaceCardActive: css`
      border-color: ${semantic.color.status.success.border};
      border-width: 2px;

      &:hover {
        border-color: ${semantic.color.status.success.border};
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
      color: ${semantic.color.status.success.text};
      animation: ${statusFadeIn} 0.3s ease;

      svg {
        width: 18px;
        height: 18px;
        animation: ${statusFadeIn} 120ms ease-out;
      }
    `,
    pluginMarketplaceCardSpinner: css`
      width: 18px;
      height: 18px;
      border: 2px solid ${semantic.color.border.decorative};
      border-top-color: ${semantic.color.status.info.border};
      border-radius: 50%;
      animation: ${spin} 0.8s linear infinite;
    `,
    pluginMarketplaceCardStatusText: css`
      font-size: 0.875rem;
      font-weight: 600;
    `,
    pluginMarketplaceCardStatusTextError: css`
      font-size: 0.875rem;
      font-weight: 600;
      color: ${semantic.color.status.error.text};
    `,
    pluginMarketplaceEmpty: css`
      padding: 3rem 2rem;
      text-align: center;
      background: ${semantic.color.surface.elevated};
      border: 2px dashed ${semantic.color.border.control};
      border-radius: 0.75rem;
      animation: ${fadeIn} 0.3s ease;
    `,
    pluginMarketplaceEmptyText: css`
      font-size: 0.95rem;
      color: ${semantic.color.text.secondary};
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
      margin-bottom: ${semantic.gap.sectionLarge};
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      background: ${semantic.color.surface.subtle};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: 0.5rem;
      transition: all 0.15s ease;

      &:hover {
        background: ${semantic.color.state.hover};
        border-color: ${semantic.color.border.control};
      }
    `,
    pluginMarketplaceSectionContent: css`
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.sectionLarge};
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
      color: ${semantic.color.text.secondary};
      transition: transform 0.2s ease;
    `,
    pluginMarketplaceSectionChevronCollapsed: css`
      transform: rotate(-90deg);
    `,
    pluginMarketplaceSectionTitle: css`
      font-family: ${semantic.font.display};
      font-size: 1.25rem;
      font-weight: 700;
      color: ${semantic.color.text.primary};
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
    pluginMarketplaceSectionBadge: css`
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      background: ${semantic.color.state.selectionFill};
      color: white;
      border-radius: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `,
    pluginMarketplaceFeatureBanner: css`
      margin-top: 0;
      padding: 1.25rem 1.5rem;
      background: ${semantic.color.status.info.solidFill};
      border-radius: 0.75rem;
      border: 1px solid ${semantic.color.status.info.border};
      box-shadow: ${semantic.shadow.sm};
    `,
    pluginMarketplaceFeatureBannerContent: css`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    pluginMarketplaceFeatureBannerTitle: css`
      font-family: ${semantic.font.display};
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
      color: ${semantic.color.status.info.onFill};
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
      box-shadow: ${semantic.shadow.xs};

      &:hover {
        background: ${semantic.color.state.hover};
        transform: translateY(-1px);
        box-shadow: ${semantic.shadow.sm};
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
      background: ${semantic.color.status.success.subtleFill};
      color: ${semantic.color.status.success.text};
    `,
    pluginMarketplaceCardBadgeAdd: css`
      background: ${semantic.color.status.info.subtleFill};
      color: ${semantic.color.status.info.text};
    `,
    pluginMarketplaceCardBadgeRequires: css`
      background: ${semantic.color.status.neutral.subtleFill};
      color: ${semantic.color.status.neutral.text};
    `,

    // Button style for already installed plugins
    pluginMarketplaceButtonInstalled: css`
      opacity: 0.5;
    `,

    // Add More Tab Style (visually distinct from regular plugins)
    pluginNameAddMore: css`
      font-size: ${fontSize.xs};
      font-family: ${fontFamily.sans};
      color: ${semantic.color.text.secondary};
      padding: ${size[3]} ${size[2]};
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      border-left: 2px solid transparent;
      background: ${semantic.color.surface.subtle};
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
          animation: ${sparkle} 2s ease-in-out infinite;
        }
      }

      &:hover {
        background: ${semantic.color.state.hover};
        color: ${semantic.color.text.primary};
        border-left-color: ${semantic.color.border.focus};

        h3::before {
          animation: ${sparkle} 0.5s ease-in-out infinite;
        }
      }

      &.active {
        background: ${semantic.color.state.selectionFill};
        color: ${semantic.color.state.selectionText};
        border-left: 2px solid ${semantic.color.border.focus};
        box-shadow: ${semantic.shadow.sm};

        h3::before {
          filter: brightness(0) invert(1);
        }
      }

      &.active:hover {
        background: ${semantic.color.state.selectionFill};
      }
    `,
  }
}

export function createStyles() {
  const { theme } = createTheme()
  const [styles, setStyles] = createSignal(stylesFactory(theme()))
  createEffect(() => {
    setStyles(stylesFactory(theme()))
  })
  return styles
}
