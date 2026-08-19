import * as goober from 'goober'
import { resolveSemanticTheme } from '@tanstack/devtools-ui/internal'
import { createEffect, createSignal } from 'solid-js'
import { createTheme } from '../context/use-devtools-context'
import {
  PLUGINS_STRIP_HEIGHT,
  PLUGIN_GROUP_TAB_HEIGHT,
  WORKBENCH_GUTTER,
  WORKBENCH_GUTTER_NARROW,
  WORKBENCH_HEADER_HEIGHT,
} from '../utils/constants'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'
import type { Accessor } from 'solid-js'
import type { DevtoolsStore } from '../context/devtools-store'

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
  /* Core controls and surfaces animate on hover/active by default; drop all of
     it in one place. Both markers are stamped by core only, so this never
     reaches inside a plugin's own markup. */
  [data-tsd-control], [data-tsd-surface] { transition: none !important; }
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

const stylesFactory = (theme: DevtoolsStore['settings']['theme']) => {
  const semantic = resolveSemanticTheme(theme)
  const css = goober.css
  // Core scrollers only. Do not put this on a selector that reaches into a
  // plugin's own markup — plugins own the scrollbars inside their pane.
  const thinScrollbars = `
    scrollbar-width: thin;
    scrollbar-color: ${semantic.color.border.control} transparent;
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: ${semantic.color.border.control};
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: ${semantic.color.text.muted};
    }
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
  `

  return {
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
      overscroll-behavior: contain;
      ${thinScrollbars}
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
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: ${semantic.radius.overlay};
      padding: 12px;
      background: ${semantic.color.surface.elevated};
      margin-bottom: 0;
      box-shadow: ${semantic.shadow.xs};
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-width: 200px;
      max-width: 240px;
      font-size: ${semantic.type.bodySm.size};
      gap: ${semantic.gap.tight};
    `,
    seoPreviewHeader: css`
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: ${semantic.type.bodyXs.size};
      font-weight: 600;
      letter-spacing: ${semantic.type.labelSm.tracking};
      text-transform: uppercase;
      margin-bottom: 0;
      color: ${semantic.color.text.secondary};
    `,
    /**
     * The network's own brand colour survives as a small dot so the card can
     * still be identified at a glance, without giving every card a different
     * coloured outline.
     */
    seoPreviewNetworkDot: css`
      width: 8px;
      height: 8px;
      flex: 0 0 8px;
      border-radius: 50%;
      box-shadow: inset 0 0 0 1px ${semantic.color.state.hover};
      @media (forced-colors: active) {
        forced-color-adjust: none;
      }
    `,
    seoPreviewImage: css`
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      border-radius: ${semantic.radius.group};
      margin-bottom: 6px;
      background: ${semantic.color.surface.subtle};
      height: 120px;
      object-fit: cover;
    `,
    seoPreviewImagePlaceholder: css`
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${semantic.color.text.muted};
      font-size: ${semantic.type.bodyXs.size};
      border: 1px dashed ${semantic.color.border.decorative};
    `,
    seoPreviewTitle: css`
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.bodySm.size};
      line-height: ${semantic.type.bodySm.lineHeight};
      font-weight: 700;
      margin-bottom: 2px;
      color: ${semantic.color.text.primary};
    `,
    seoPreviewDesc: css`
      color: ${semantic.color.text.secondary};
      margin-bottom: 4px;
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodyXs.lineHeight};
    `,
    seoPreviewUrl: css`
      color: ${semantic.color.text.muted};
      font-family: ${semantic.font.mono};
      font-size: 11px;
      margin-bottom: 0;
      word-break: break-all;
    `,
    seoMissingTagsSection: css`
      margin-top: 6px;
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodyXs.lineHeight};
      color: ${semantic.color.status.error.text};
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
      background: ${semantic.color.status.error.subtleFill};
      color: ${semantic.color.status.error.text};
      border-radius: ${semantic.radius.control};
      padding: 2px 6px;
      font-family: ${semantic.font.mono};
      font-size: 11px;
      font-weight: 500;
    `,
    /* No box of its own: the section already provides one, and the snippet
       below provides another. A label plus spacing is enough. */
    serpPreviewBlock: css`
      margin-bottom: ${WORKBENCH_GUTTER}px;
      &:last-child {
        margin-bottom: 0;
      }
    `,
    serpPreviewLabel: css`
      font-size: ${semantic.type.bodyXs.size};
      font-weight: 600;
      letter-spacing: ${semantic.type.labelSm.tracking};
      text-transform: uppercase;
      margin-bottom: 6px;
      color: ${semantic.color.text.secondary};
    `,
    serpSnippet: css`
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: ${semantic.color.surface.elevated};
      max-width: 600px;
      font-family: ${semantic.font.body};
      box-shadow: ${semantic.shadow.xs};
    `,
    serpSnippetMobile: css`
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: ${semantic.color.surface.elevated};
      max-width: 380px;
      font-family: ${semantic.font.body};
      box-shadow: ${semantic.shadow.xs};
    `,
    serpSnippetDescMobile: css`
      font-size: 0.875rem;
      color: ${semantic.color.text.secondary};
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
      background-color: ${semantic.color.surface.subtle};
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
      color: ${semantic.color.text.muted};
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
      color: ${semantic.color.text.secondary};
      margin: 0;
      line-height: 1.5;
    `,
    serpErrorList: css`
      margin: 4px 0 0 0;
      padding-left: 1.25rem;
      list-style-type: disc;
    `,
    serpReportItem: css`
      margin-top: 0.25rem;
      color: ${semantic.color.status.error.text};
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
      font-size: ${semantic.type.bodySm.size};
      font-family: ${semantic.font.body};
      background-color: ${semantic.color.surface.workspace};
      color: ${semantic.color.text.primary};
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      grid-template-rows: ${WORKBENCH_HEADER_HEIGHT}px minmax(0, 1fr);
      /* The strip row is auto-sized so the strip's own animated height drives
         it — a fixed 44px row would snap instead of sliding. */
      &:has([data-testid='plugins-strip']) {
        grid-template-rows: ${WORKBENCH_HEADER_HEIGHT}px auto minmax(0, 1fr);
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
      /* No trailing gutter: the action icons run to the panel edge. */
      padding: 0 0 0 ${WORKBENCH_GUTTER}px;
      box-sizing: border-box;
      background: ${semantic.color.surface.brand};
      color: ${semantic.color.text.mutedOnBrand};
      /* A translucent ink rule, not border.decorative — decorative *is* the
         cream brand surface, so it disappears on the chrome band itself. */
      border-bottom: 1px solid ${semantic.color.state.pressed};
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
      & button {
        transition: all 0.3s ease;
      }
      & button:hover:not([data-tsd-selected='true']) {
        background: ${semantic.color.state.hover};
      }
      @media (prefers-reduced-motion: reduce) {
        & button {
          transition: none;
        }
      }
      & button:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
      @media (max-width: 430px) {
        gap: ${semantic.gap.tight};
        padding-inline-start: ${WORKBENCH_GUTTER_NARROW}px;
        & button {
          min-width: 24px;
        }
      }
      @media (max-width: 360px) {
        gap: 2px;
        padding-inline-start: 4px;
        & button {
          padding-inline: 3px;
          font-size: 11px;
        }
      }
    `,
    workbenchLogo: css`
      display: inline-flex;
      align-items: center;
      width: 16px;
      height: 21px;
      flex: 0 0 16px;
      color: ${semantic.color.text.primary};
      & > svg {
        width: 100%;
        height: 100%;
      }
      @media (max-width: 360px) {
        width: 14px;
        height: 18px;
        flex-basis: 14px;
      }
    `,
    workbenchDestinations: css`
      display: inline-flex;
      align-items: stretch;
      align-self: stretch;
      gap: 0;
      /* The destinations are the part that must survive a narrow panel: let
         them scroll rather than letting flex squeeze the labels together. */
      min-width: 0;
      flex: 0 1 auto;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
      margin: 0;
      padding: 0;
      & > button {
        flex: 0 0 auto;
      }
    `,
    workbenchNavButton: css`
      margin: 0;
      padding-inline: 10px;
      font-size: ${semantic.type.bodyXs.size};
      font-weight: ${semantic.type.labelSm.weight};
      letter-spacing: ${semantic.type.labelSm.tracking};
      color: ${semantic.color.text.mutedOnBrand};
      &[data-tsd-selected='true'] {
        background: ${semantic.color.state.pressed};
        color: ${semantic.color.text.primary};
        font-weight: 700;
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
      color: ${semantic.color.text.mutedOnBrand};
      & svg {
        width: 20px;
        height: 20px;
      }
      &[data-tsd-selected='true'] {
        background: ${semantic.color.state.pressed};
        color: ${semantic.color.text.primary};
      }
      @media (max-width: 360px) {
        width: 32px;
        min-width: 32px;
        flex-basis: 32px;
      }
    `,
    /**
     * A pull tab protruding from the bottom edge of the lowest chrome band —
     * below the secondary strip when one is on screen, below the header when
     * not. It is positioned against the panel rather than nested inside the
     * strip, because the strip scrolls horizontally and would clip it.
     *
     * Collapsed is the exception: the panel is then only as tall as the header
     * and sits flush against the viewport edge, so a downward tab would be off
     * screen. There it flips to the panel's outer edge instead.
     */
    /**
     * A pull tab protruding from the bottom edge of the subheader, dropping back
     * to the header's bottom edge once the subheader is folded away — so it
     * always hangs off whatever chrome band is lowest, always inside the panel.
     *
     * It is positioned against the panel rather than nested inside the strip,
     * because the strip scrolls horizontally and would clip it. Both bands are
     * border-box, so their hairlines already sit inside these heights.
     */
    workbenchCollapseToggle: (isCollapsed: boolean) => css`
      position: absolute;
      top: ${isCollapsed
        ? WORKBENCH_HEADER_HEIGHT
        : WORKBENCH_HEADER_HEIGHT + PLUGINS_STRIP_HEIGHT}px;
      inset-inline-end: 7%;
      z-index: 10;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 20px;
      box-sizing: border-box;
      padding: 0;
      /* Open at the top so it reads as attached to the band above it. */
      border: 1px solid ${semantic.color.state.pressed};
      border-top: 0;
      border-radius: 0 0 ${semantic.radius.group} ${semantic.radius.group};
      background: ${semantic.color.surface.brand};
      color: ${semantic.color.text.mutedOnBrand};
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover {
        height: 24px;
        color: ${semantic.color.text.primary};
        background: ${semantic.color.surface.subtle};
      }
      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
        &:hover {
          height: 20px;
        }
      }
    `,
    workbenchCollapseIcon: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      transition: transform 0.3s ease;
      & svg {
        width: 18px;
        height: 18px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition-duration: 0ms;
      }
    `,
    workbenchWordmark: css`
      white-space: nowrap;
      /* A wordmark is display type, not body copy. */
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.headingCompact.size};
      font-weight: ${semantic.type.headingCompact.weight};
      line-height: ${semantic.type.headingCompact.lineHeight};
      letter-spacing: -0.01em;
      color: ${semantic.color.text.primary};
      margin-inline-end: ${semantic.space[2]};
      /* Give up the wordmark before the destination labels start colliding —
         the emblem still carries the branding. */
      @media (max-width: 560px) {
        display: none;
      }
    `,
    /**
     * The subheader slides rather than disappearing: it stays mounted and
     * animates its own height to zero, and the panel's strip row is auto-sized
     * so the row follows it. Folded it is `inert` so nothing inside stays
     * focusable behind a zero-height band.
     */
    workbenchSecondaryTabs: (collapsed: boolean) => css`
      display: flex;
      align-items: center;
      gap: ${semantic.gap.control};
      min-width: 0;
      box-sizing: border-box;
      padding-block: ${collapsed ? '0px' : '6px'};
      padding-inline-start: ${WORKBENCH_GUTTER}px;
      padding-inline-end: ${WORKBENCH_GUTTER}px;
      scroll-padding-inline-start: ${WORKBENCH_GUTTER}px;
      scroll-padding-inline-end: ${WORKBENCH_GUTTER}px;
      height: ${collapsed ? 0 : PLUGINS_STRIP_HEIGHT}px;
      min-height: 0;
      flex: 0 0 auto;
      opacity: ${collapsed ? 0 : 1};
      /* Chrome band: the strip belongs to the header, not to the canvas. */
      background: ${semantic.color.surface.brand};
      border-bottom: ${collapsed ? '0' : '1px'} solid
        ${semantic.color.state.pressed};
      overflow-x: ${collapsed ? 'hidden' : 'auto'};
      overflow-y: hidden;
      white-space: nowrap;
      ${thinScrollbars}
      transition: opacity 0.3s ease, height 0.3s ease, padding 0.3s ease,
        border-color 0.3s ease;
      /* Tabs must not shift as the strip scrolls, but they still animate their
         own hover and selected states. */
      & > * {
        transform: none;
      }
      & > :last-child {
        scroll-margin-inline-end: ${WORKBENCH_GUTTER}px;
      }
      @media (max-width: 430px) {
        padding-inline: ${WORKBENCH_GUTTER_NARROW}px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    workbenchSecondaryTab: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      /* A plugin entry can be dragged down into the workspace to place its pane,
         so it advertises that rather than looking like a plain button. */
      &[data-plugin-title-control] {
        cursor: grab;
      }
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
      transition: all 0.3s ease;
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
    /**
     * A thin bar sitting on the panel's own edge. It must NOT be grown into a
     * fat hit area: at 24px tall it covered the top of the 36px header, so a
     * press aimed at a header button started a resize instead — which is what
     * made dragging feel like click, drag, click.
     */
    dragHandle: (panelLocation: TanStackDevtoolsConfig['panelLocation']) => css`
      position: absolute;
      left: 0;
      ${panelLocation === 'bottom' ? 'top' : 'bottom'}: 0;
      width: 100%;
      height: 5px;
      cursor: row-resize;
      user-select: none;
      touch-action: none;
      z-index: 100000;
      background-color: transparent;
      transition: all 0.3s ease;
      &:hover,
      &:focus-visible {
        background-color: ${semantic.color.border.control};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
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
      font-size: ${semantic.type.bodyXs.size};
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
      /* The rainbow mark paints its own circle. Keep the button transparent
         so a theme fill does not frame or wash over it. 56px matches the
         trigger size before the square chip. */
      background: transparent;
      width: 56px;
      height: 56px;
      justify-content: center;
      border-radius: 50%;
      box-shadow:
        inset 0 0 0 1px transparent,
        ${semantic.shadow.sm};
      /* Never transition left/top: floating mode writes those inline on every
         pointer move, and animating them makes the mark lag then overshoot. */
      transition:
        opacity 0.3s ease,
        box-shadow 0.3s ease,
        scale 0.3s ease;
      & > svg {
        display: block;
        width: 100%;
        height: 100%;
        outline: none;
      }
      /*
       * Hover keeps the rainbow fill: this chip floats over the user's page,
       * so a translucent overlay would muddy the gradient. Hover brings in
       * the edge ring and scales the chip up a touch.
       *
       * It animates the scale property rather than a transform: floating mode
       * sets transform inline to drive the drag, so a transform here would be
       * overridden and never apply.
       */
      &:hover {
        box-shadow:
          inset 0 0 0 1px ${semantic.color.border.control},
          ${semantic.shadow.overlay};
        scale: 1.06;
      }
      &:active {
        scale: 0.98;
      }
      @media (prefers-reduced-motion: reduce) {
        transition-property: opacity;
        &:hover,
        &:active {
          scale: 1;
        }
      }
      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
    `,
    mainCloseBtnFloating: css`
      /* Floating placement is driven by inline left/top, so don't animate
         position (would fight the drag/throw rAF loop). The hover treatment
         uses box-shadow and scale, both of which are safe to keep. */
      transition:
        opacity 0.3s ease,
        box-shadow 0.3s ease,
        scale 0.3s ease,
        background-color 0.3s ease,
        color 0.3s ease;
      /* Stays a pointer even though it is draggable: the trigger reads as a
         button first, and a grab cursor made it look like a handle. */
      cursor: pointer;
      touch-action: none;
      user-select: none;
    `,
    mainCloseBtnPosition: (position: TanStackDevtoolsConfig['position']) => {
      const base = css`
        ${position === 'top-left'
          ? `top: ${semantic.space[2]}; left: ${semantic.space[2]};`
          : ''}
        ${position === 'top-right'
          ? `top: ${semantic.space[2]}; right: ${semantic.space[2]};`
          : ''}
        ${position === 'middle-left'
          ? `top: 50%; left: ${semantic.space[2]}; transform: translateY(-50%);`
          : ''}
        ${position === 'middle-right'
          ? `top: 50%; right: ${semantic.space[2]}; transform: translateY(-50%);`
          : ''}
        ${position === 'bottom-left'
          ? `bottom: ${semantic.space[2]}; left: ${semantic.space[2]};`
          : ''}
        ${position === 'bottom-right'
          ? `bottom: ${semantic.space[2]}; right: ${semantic.space[2]};`
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
    tabContent: css`
      transition: all 0.2s ease-in-out;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    `,
    /**
     * A plugin's mount target, and the scroll boundary between that plugin and
     * the host page.
     *
     * `overscroll-behavior: contain` belongs HERE and on the other outermost
     * destination scrollers only — never on their descendants. Plugins nest
     * several `overflow: auto` wrappers that often have nothing to scroll; a
     * wheel over one of those is meant to chain up to this element. Containing
     * every descendant turns each empty wrapper into a dead end and the pane
     * stops scrolling altogether.
     */
    pluginsTabContent: css`
      /*
       * A positioning context per pane. Plugins position their own chrome
       * absolutely and assume their own root is the containing block, but a
       * plugin root is often statically positioned — without this, a top-zero
       * offset resolves against the whole Workbench and the plugin paints its
       * controls over our header. With three panes open they would all pile
       * into the same corner.
       */
      position: relative;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      ${thinScrollbars}
      background: ${semantic.color.surface.workspace};
      border-radius: 0 0 ${semantic.radius.overlay} ${semantic.radius.overlay};
    `,
    pluginsEmptyState: css`
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${semantic.gap.control};
      min-width: 0;
      padding: ${WORKBENCH_GUTTER}px;
      text-align: center;
      background: ${semantic.color.surface.workspace};
    `,
    pluginsEmptyStateIcon: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin-bottom: ${semantic.space[1]};
      border-radius: 50%;
      background: ${semantic.color.surface.subtle};
      color: ${semantic.color.text.muted};
      & svg {
        width: 22px;
        height: 22px;
      }
    `,
    pluginsEmptyStateTitle: css`
      margin: 0;
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.headingPane.size};
      font-weight: ${semantic.type.headingPane.weight};
      line-height: ${semantic.type.headingPane.lineHeight};
      color: ${semantic.color.text.primary};
    `,
    pluginsEmptyStateHint: css`
      margin: 0;
      max-width: 42ch;
      font-size: ${semantic.type.bodySm.size};
      font-weight: ${semantic.type.bodySm.weight};
      line-height: ${semantic.type.bodySm.lineHeight};
      color: ${semantic.color.text.secondary};
    `,
    /**
     * The panes' permanent home. Every pane is a direct child for its whole
     * life and is placed with inline offsets computed from the layout tree, so
     * a drag never re-parents it. That is what stops an iframe plugin reloading
     * and a canvas plugin losing its context every time the layout changes.
     */
    pluginWorkspace: css`
      position: relative;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      background: ${semantic.color.surface.brand};
    `,
    /**
     * Off-screen but still announced. Used for the live region that narrates
     * picking a pane up and putting it down, which is the only feedback a
     * screen-reader user gets from a move.
     */
    pluginSrOnly: css`
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    `,
    /** A group's tab bar, sitting along the top edge of the group's rect. */
    pluginGroupTabs: css`
      display: flex;
      align-items: stretch;
      gap: ${semantic.gap.tight};
      height: ${PLUGIN_GROUP_TAB_HEIGHT}px;
      min-width: 0;
      padding: ${semantic.space[1]};
      box-sizing: border-box;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      ${thinScrollbars}
      background: ${semantic.color.surface.workspace};
      border-radius: ${semantic.radius.overlay} ${semantic.radius.overlay} 0 0;
    `,
    /**
     * Presentational wrapper holding the two sibling controls of one tab. They
     * are siblings rather than nested because a button inside a button is
     * invalid, and the inner one would be unreachable by keyboard.
     */
    pluginGroupTabItem: css`
      position: relative;
      display: inline-flex;
      align-items: stretch;
      flex: 0 0 auto;
      max-width: 200px;
      background: transparent;
      border: 0;
      border-radius: ${semantic.radius.control};
      box-sizing: border-box;
      transition: background 0.2s ease;
      &[data-tsd-selected='true'] {
        background: ${semantic.color.surface.brand};
      }
      &:hover:not([data-tsd-selected='true']) {
        background: ${semantic.color.state.hover};
      }
      &[data-tsd-held='true'] {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: -2px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    /** The sortable item: exactly the draggable part of a tab, nothing else. */
    pluginGroupTabRow: css`
      display: inline-flex;
      align-items: stretch;
      min-width: 0;
    `,
    pluginGroupTab: css`
      display: inline-flex;
      align-items: center;
      min-width: 0;
      /* Room at the end for the close button, which sits over this one. */
      padding-inline: 8px 28px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: ${semantic.color.text.mutedOnBrand};
      font-family: ${semantic.font.body};
      font-size: ${semantic.type.bodyXs.size};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: grab;
      &[aria-pressed='true'] {
        color: ${semantic.color.text.primary};
        cursor: default;
      }
    `,
    /**
     * 24px square, the smallest target WCAG 2.5.8 accepts, laid over the right end
     * of the tab. Positioned rather than in flow so it is a sibling of the
     * sortable row: the drag engine finds its target by walking up the tree, so a
     * close button nested inside the row would always be a drag surface.
     */
    pluginGroupTabClose: css`
      position: absolute;
      inset-inline-end: 2px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 0;
      border-radius: 2px;
      background: transparent;
      color: ${semantic.color.text.mutedOnBrand};
      cursor: pointer;
      &:hover {
        background: ${semantic.color.state.pressed};
      }
      & svg {
        width: 10px;
        height: 10px;
      }
    `,
    /**
     * A gutter between two panes of one split. It is a real focusable separator
     * so it can be driven from the keyboard, matching the whole-panel resizer.
     */
    pluginSplitter: (dir: 'row' | 'col') => css`
      position: absolute;
      z-index: 20;
      box-sizing: border-box;
      background: transparent;
      cursor: ${dir === 'row' ? 'col-resize' : 'row-resize'};
      touch-action: none;
      user-select: none;
      pointer-events: auto;
      &::after {
        content: '';
        position: absolute;
        pointer-events: none;
        background: transparent;
        border-radius: 999px;
        transition: background-color 0.15s ease;
        ${dir === 'row'
          ? 'top: 8px; bottom: 8px; left: 50%; width: 4px; transform: translateX(-50%);'
          : 'left: 8px; right: 8px; top: 50%; height: 4px; transform: translateY(-50%);'}
      }
      &:hover::after,
      &:focus-visible::after {
        background: ${semantic.color.border.focus};
      }
      @media (prefers-reduced-motion: reduce) {
        &::after {
          transition: none;
        }
      }
      @media (forced-colors: active) {
        &:hover::after,
        &:focus-visible::after {
          background: Highlight;
        }
      }
    `,
    /**
     * The tab that follows the cursor while dragging, so it is obvious which pane
     * is being carried. Pointer-transparent, or it would sit between the pointer
     * and the drop zone being aimed at.
     */
    pluginDragPreview: css`
      position: fixed;
      z-index: 2147483646;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 220px;
      height: ${PLUGIN_GROUP_TAB_HEIGHT}px;
      padding-inline: 10px;
      box-sizing: border-box;
      pointer-events: none;
      border: 1px solid ${semantic.color.border.focus};
      border-radius: 3px;
      background: ${semantic.color.surface.brand};
      color: ${semantic.color.text.primary};
      font-family: ${semantic.font.body};
      font-size: ${semantic.type.bodyXs.size};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.95;
      /* Sits just off the cursor so it never covers the pointer itself. */
      transform: translate(12px, 12px);
      @media (forced-colors: active) {
        border-color: Highlight;
      }
    `,
    /**
     * While a pane is being carried, every surface *inside the panel* shows the
     * grabbing cursor — the pointer travels well outside the tab it started on.
     * Applied to the panel, never to `<html>`: the host page's cursor is not ours
     * to change.
     */
    pluginDraggingCursor: css`
      &,
      & * {
        cursor: grabbing !important;
      }
    `,
    /** The highlight that shows where a dragged tab would land. */
    pluginDropOverlay: css`
      position: absolute;
      z-index: 3;
      pointer-events: none;
      box-sizing: border-box;
      border: 2px solid ${semantic.color.border.focus};
      background: ${semantic.color.state.hover};
      @media (forced-colors: active) {
        border-color: Highlight;
      }
    `,
    pluginPaneSeparator: css`
      flex: 0 0 1px;
      align-self: stretch;
      /* Plugins paint their own surface, which may be lighter or darker than
         ours, so this rule needs a mid tone that shows against both. */
      background: ${semantic.color.border.control};
      @media (forced-colors: active) {
        background: CanvasText;
      }
    `,

    settingsGroup: css`
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    `,
    /* An indented, ruled block reads as "this belongs to the switch above". */
    conditionalSetting: css`
      margin-top: ${semantic.space[2]};
      margin-inline-start: ${WORKBENCH_GUTTER}px;
      padding: ${semantic.space[3]};
      border-inline-start: 2px solid ${semantic.color.border.decorative};
      background-color: ${semantic.color.surface.subtle};
      border-start-end-radius: ${semantic.radius.group};
      border-end-end-radius: ${semantic.radius.group};
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
      flex-wrap: wrap;
      gap: 6px;
    `,
    hotkeyTitle: css`
      margin: 0;
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.headingCompact.size};
      line-height: ${semantic.type.headingCompact.lineHeight};
      font-weight: ${semantic.type.headingCompact.weight};
      color: ${semantic.color.text.primary};
    `,
    hotkeyDescription: css`
      margin: 0;
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodyXs.lineHeight};
      color: ${semantic.color.text.secondary};
    `,
    hotkeyResult: css`
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: ${semantic.type.bodyXs.size};
      color: ${semantic.color.text.secondary};
    `,
    hotkeyResultKeys: css`
      padding: 1px 6px;
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: ${semantic.radius.control};
      background: ${semantic.color.surface.subtle};
      color: ${semantic.color.text.primary};
      font-family: ${semantic.font.mono};
      font-size: 11px;
    `,
    settingsStack: css`
      display: flex;
      flex-direction: column;
      gap: 1rem;
    `,

    // No Plugins Fallback Styles
    /* Shell: positions the settings drawer and clips it to the workbench. */
    pluginMarketplace: css`
      position: relative;
      display: flex;
      flex-direction: column;
      font-family: ${semantic.font.body};
      color: ${semantic.color.text.primary};
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      background: ${semantic.color.surface.workspace};
      animation: ${fadeIn} 0.3s ease;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `,
    pluginMarketplaceScroll: css`
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
      box-sizing: border-box;
      overflow-y: auto;
      overscroll-behavior: contain;
      ${thinScrollbars}
      padding: ${WORKBENCH_GUTTER}px;
      @media (max-width: 430px) {
        padding: ${WORKBENCH_GUTTER_NARROW}px;
      }
    `,
    pluginMarketplaceHeader: css`
      margin-bottom: ${WORKBENCH_GUTTER}px;
      padding-bottom: ${semantic.space[3]};
      border-bottom: 1px solid ${semantic.color.border.decorative};
    `,
    pluginMarketplaceTitleRow: css`
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: ${WORKBENCH_GUTTER}px;
      margin-bottom: 0;
      flex-wrap: wrap;
    `,
    /** Title + description stay together so the search box can't split them. */
    pluginMarketplaceTitleBlock: css`
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.tight};
      min-width: 0;
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
      font-size: 1.125rem;
      line-height: 1.3;
      font-weight: 700;
      color: ${semantic.color.text.primary};
      margin: 0;
      letter-spacing: -0.02em;
    `,
    pluginMarketplaceDescription: css`
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodyXs.lineHeight};
      color: ${semantic.color.text.secondary};
      margin: 0;
      max-width: 72ch;
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
        left: 8px;
        width: 14px;
        height: 14px;
        color: ${semantic.color.text.muted};
        pointer-events: none;
      }
    `,
    pluginMarketplaceSearch: css`
      width: 100%;
      box-sizing: border-box;
      padding: 5px 10px 5px 28px;
      background: ${semantic.color.surface.app};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: ${semantic.radius.control};
      color: ${semantic.color.text.primary};
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodyXs.lineHeight};
      font-family: ${semantic.font.body};
      transition: all 0.3s ease;

      &::placeholder {
        color: ${semantic.color.text.muted};
      }

      &:hover {
        border-color: ${semantic.color.border.control};
      }

      &:focus {
        outline: none;
        border-color: ${semantic.color.border.focus};
        background: ${semantic.color.surface.elevated};
        box-shadow: 0 0 0 2px ${semantic.color.state.pressed};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    pluginMarketplaceTagsContainer: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: ${semantic.space[3]};
      padding: 0;
      background: transparent;
      border: 0;
    `,
    pluginMarketplaceTagButton: css`
      padding: 3px 10px;
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodyXs.lineHeight};
      font-weight: 500;
      background: ${semantic.color.surface.subtle};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: 999px;
      color: ${semantic.color.text.secondary};
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: ${semantic.color.state.hover};
        border-color: ${semantic.color.border.control};
        color: ${semantic.color.text.primary};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
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
      flex: 0 0 auto;
      padding: 5px;
      background: ${semantic.color.surface.subtle};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: ${semantic.radius.control};
      color: ${semantic.color.text.secondary};
      cursor: pointer;
      transition: all 0.3s ease;
      margin-left: 6px;

      & svg {
        width: 14px;
        height: 14px;
      }

      &:hover {
        background: ${semantic.color.state.hover};
        border-color: ${semantic.color.border.control};
        color: ${semantic.color.text.primary};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    /* Absolute, not fixed: the drawer belongs to the marketplace pane, so it
       must not cover the host page outside the workbench. */
    pluginMarketplaceSettingsPanel: css`
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 320px;
      max-width: 100%;
      box-sizing: border-box;
      background: ${semantic.color.surface.elevated};
      border-inline-start: 1px solid ${semantic.color.border.decorative};
      box-shadow: ${semantic.shadow.overlay};
      z-index: 2;
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
      gap: ${semantic.gap.control};
      padding: ${semantic.space[3]} ${WORKBENCH_GUTTER}px;
      border-bottom: 1px solid ${semantic.color.border.decorative};
    `,
    pluginMarketplaceSettingsPanelTitle: css`
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.headingCompact.size};
      line-height: ${semantic.type.headingCompact.lineHeight};
      font-weight: 700;
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
      transition: all 0.3s ease;

      &:hover {
        background: ${semantic.color.state.hover};
        color: ${semantic.color.text.primary};
      }
    `,
    pluginMarketplaceSettingsPanelContent: css`
      flex: 1;
      min-height: 0;
      padding: ${WORKBENCH_GUTTER}px;
      overflow-y: auto;
      overscroll-behavior: contain;
      ${thinScrollbars}
    `,
    pluginMarketplaceGrid: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
      gap: ${semantic.gap.section};
      animation: ${slideUp} 0.4s ease;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `,
    pluginMarketplaceCard: css`
      background: ${semantic.color.surface.elevated};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: ${semantic.radius.overlay};
      padding: ${WORKBENCH_GUTTER}px;
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.section};
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      /* Cards stay grounded: hover raises the shadow a step instead of lifting
         the card off the page. */
      &:hover {
        border-color: ${semantic.color.border.control};
        box-shadow: ${semantic.shadow.sm};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    pluginMarketplaceCardIcon: css`
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${semantic.color.surface.subtle};
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: ${semantic.radius.group};
      color: ${semantic.color.text.secondary};

      svg {
        width: 16px;
        height: 16px;
      }
    `,
    pluginMarketplaceCardHeader: css`
      flex: 1;
    `,
    pluginMarketplaceCardTitle: css`
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.bodySm.size};
      line-height: ${semantic.type.bodySm.lineHeight};
      font-weight: 700;
      color: ${semantic.color.text.primary};
      /* Room on the trailing side so a long name never runs under the badge. */
      margin: 0 72px 4px 0;
    `,
    pluginMarketplaceCardPackageBadge: css`
      margin-top: 4px;
      margin-bottom: 8px;
      font-size: 0.6875rem;
      font-family: ${semantic.font.mono};
      color: ${semantic.color.text.muted};
      padding: 0;
      word-break: break-all;
      display: inline-block;
    `,
    pluginMarketplaceCardDescriptionText: css`
      margin-top: 0;
      font-size: ${semantic.type.bodyXs.size};
      line-height: ${semantic.type.bodySm.lineHeight};
      color: ${semantic.color.text.secondary};
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
      transition: all 0.3s ease;

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
      border: 1px solid ${semantic.color.border.decorative};
      border-radius: 999px;
      color: ${semantic.color.text.secondary};
    `,
    pluginMarketplaceCardImage: css`
      width: 28px;
      height: 28px;
      object-fit: contain;
    `,
    /* A flat inline pill, not a rotated corner ribbon: the badge already owns
       the top-right corner and the icon owns the top-left. */
    pluginMarketplaceNewBanner: css`
      display: inline-block;
      vertical-align: middle;
      margin-inline-start: 6px;
      background-color: ${semantic.color.status.success.subtleFill};
      color: ${semantic.color.status.success.text};
      padding: 1px 6px;
      font-family: ${semantic.font.body};
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 999px;
      letter-spacing: 0.05em;
    `,
    /* Featured and active cards keep the neutral outline — their section
       heading and their badge already say which they are, so a second and a
       third accent colour would only add noise. */
    pluginMarketplaceCardFeatured: css`
      border-color: ${semantic.color.border.control};
    `,
    pluginMarketplaceCardActive: css`
      border-inline-start: 3px solid ${semantic.color.status.success.border};
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
      margin-bottom: ${WORKBENCH_GUTTER * 1.5}px;

      &:last-child {
        margin-bottom: 0;
      }
    `,
    /* A section heading is a heading, not a card. It gets a rule underneath so
       the eye reads "group starts here" without another box in the stack. */
    pluginMarketplaceSectionHeader: css`
      margin-bottom: ${semantic.gap.section};
      padding: 0 0 6px;
      display: flex;
      align-items: center;
      gap: ${semantic.gap.tight};
      cursor: pointer;
      user-select: none;
      background: transparent;
      border: 0;
      border-bottom: 1px solid ${semantic.color.border.decorative};
      border-radius: 0;
      transition: all 0.3s ease;

      &:hover {
        border-bottom-color: ${semantic.color.border.control};
      }
      &:hover h3 {
        color: ${semantic.color.text.primary};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
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
      width: 18px;
      height: 18px;
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
      font-size: ${semantic.type.headingPane.size};
      line-height: ${semantic.type.headingPane.lineHeight};
      font-weight: 700;
      color: ${semantic.color.text.secondary};
      margin: 0;
      display: flex;
      align-items: center;
      gap: ${semantic.gap.control};
      transition: all 0.3s ease;
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    pluginMarketplaceFeatureBanner: css`
      margin-top: 0;
      padding: ${semantic.space[3]} ${WORKBENCH_GUTTER}px;
      background: ${semantic.color.surface.brand};
      border-radius: ${semantic.radius.overlay};
      border: 1px solid ${semantic.color.border.decorative};
      border-inline-start: 3px solid ${semantic.color.state.selectionFill};
      box-shadow: none;
    `,
    pluginMarketplaceFeatureBannerContent: css`
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.control};
      align-items: flex-start;
    `,
    pluginMarketplaceFeatureBannerTitle: css`
      font-family: ${semantic.font.display};
      font-size: ${semantic.type.headingCompact.size};
      line-height: ${semantic.type.headingCompact.lineHeight};
      font-weight: 700;
      color: ${semantic.color.text.primary};
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    `,
    pluginMarketplaceFeatureBannerIcon: css`
      width: 14px;
      height: 14px;
      display: inline-flex;
      color: ${semantic.color.text.secondary};
    `,
    pluginMarketplaceFeatureBannerText: css`
      font-size: ${semantic.type.bodyXs.size};
      color: ${semantic.color.text.mutedOnBrand};
      line-height: ${semantic.type.bodySm.lineHeight};
      max-width: 78ch;
      margin: 0;
    `,
    pluginMarketplaceFeatureBannerButton: css`
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: ${semantic.color.state.selectionFill};
      color: ${semantic.color.state.selectionText};
      font-weight: 600;
      font-size: ${semantic.type.bodyXs.size};
      border-radius: ${semantic.radius.control};
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      align-self: flex-start;
      box-shadow: none;

      &:hover {
        opacity: 0.85;
      }
      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    pluginMarketplaceFeatureBannerButtonIcon: css`
      width: 14px;
      height: 14px;
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
      top: ${WORKBENCH_GUTTER}px;
      right: ${WORKBENCH_GUTTER}px;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 999px;
      letter-spacing: 0.05em;
    `,
    pluginMarketplaceCardBadgeInstall: css`
      background: ${semantic.color.status.success.subtleFill};
      color: ${semantic.color.status.success.text};
    `,
    pluginMarketplaceCardBadgeActive: css`
      background: ${semantic.color.status.success.subtleFill};
      color: ${semantic.color.status.success.text};
    `,
    pluginMarketplaceCardBadgeAdd: css`
      background: ${semantic.color.status.info.subtleFill};
      color: ${semantic.color.status.info.text};
    `,
    pluginMarketplaceCardBadgeBlocked: css`
      background: ${semantic.color.status.warning.subtleFill};
      color: ${semantic.color.status.warning.text};
    `,
    pluginMarketplaceCardBadgeRequires: css`
      background: ${semantic.color.status.neutral.subtleFill};
      color: ${semantic.color.status.neutral.text};
    `,

    // Button style for already installed plugins
    pluginMarketplaceButtonInstalled: css`
      opacity: 0.5;
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
