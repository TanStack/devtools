import * as goober from 'goober'
import { createEffect, createSignal } from 'solid-js'
import { createTheme } from '../components/theme'
import { resolveSemanticTheme } from './semantic-theme'
import type { tokens } from './tokens'

import type { TanStackDevtoolsTheme } from '../components/theme'
import type { ButtonVariant } from '../components/button'

export const css = goober.css
const stylesFactory = (theme: TanStackDevtoolsTheme) => {
  const semantic = resolveSemanticTheme(theme)

  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)
  const buildButtonVariant = (variant: ButtonVariant) => {
    const statusRole =
      variant === 'danger'
        ? 'error'
        : variant === 'primary' || variant === 'secondary'
          ? 'neutral'
          : variant
    const status = semantic.color.status[statusRole]
    const outlineColor = status.text
    const outlineHoverColor = status.text
    const solidBg = status.solidFill
    const solidHover = status.border
    const solidActive = status.solidFill
    const solidText = status.onFill
    const solidBorder = status.border

    return {
      ghost: css`
        background: transparent;
        color: ${outlineColor};
        border-color: transparent;
        &:hover {
          background: ${semantic.color.state.hover};
          color: ${outlineHoverColor};
        }
        &:active {
          background: ${semantic.color.state.pressed};
          color: ${outlineHoverColor};
        }
      `,
      outline: css`
        background: transparent;
        color: ${outlineColor};
        border-color: ${outlineColor};
        &:hover {
          background: ${semantic.color.state.hover};
          color: ${outlineHoverColor};
          border-color: ${outlineHoverColor};
        }
        &:active {
          background: ${semantic.color.state.pressed};
          color: ${outlineHoverColor};
          border-color: ${outlineHoverColor};
        }
      `,
      solid: css`
        background: ${solidBg};
        color: ${solidText};
        border-color: ${solidBorder};
        &:hover {
          background: ${solidHover};
          border-color: ${solidHover};
          box-shadow: ${semantic.shadow.xs};
        }
        &:active {
          background: ${solidActive};
          border-color: ${solidActive};
          box-shadow: ${semantic.shadow.sm};
        }
      `,
    }
  }
  const buttonVariants: Record<
    ButtonVariant,
    { ghost: string; outline: string; solid: string }
  > = {
    primary: buildButtonVariant('primary'),
    secondary: buildButtonVariant('secondary'),
    info: buildButtonVariant('info'),
    warning: buildButtonVariant('warning'),
    danger: buildButtonVariant('danger'),
    success: buildButtonVariant('success'),
  }

  const wrapperSize = 320
  const legacyTagColor = (color: keyof typeof tokens.colors) => {
    const semanticRole =
      color === 'red'
        ? 'error'
        : color === 'yellow'
          ? 'warning'
          : color === 'green'
            ? 'success'
            : color === 'blue' || color === 'cyan' || color === 'teal'
              ? 'info'
              : 'neutral'
    return semantic.color.status[semanticRole].solidFill
  }

  return {
    logo: css`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      width: 48px;
      height: 48px;
      font-family: ${semantic.font.body};
      gap: ${semantic.gap.tight};
      padding: 0;
      &:hover {
        opacity: 0.7;
      }
    `,

    selectWrapper: css`
      width: 100%;
      max-width: ${wrapperSize}px;
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.tight};
    `,
    selectContainer: css`
      width: 100%;
      &::selection,
      & *::selection {
        background: ${semantic.color.state.selectionFill};
        color: ${semantic.color.state.selectionText};
      }
    `,
    selectLabel: css`
      font: ${semantic.type.labelSm.weight} ${semantic.type.labelSm.size} /
        ${semantic.type.labelSm.lineHeight} ${semantic.font.body};
      letter-spacing: ${semantic.type.labelSm.tracking};
      color: ${semantic.color.text.primary};
      text-align: left;
    `,
    selectDescription: css`
      font: ${semantic.type.bodyXs.weight} ${semantic.type.bodyXs.size} /
        ${semantic.type.bodyXs.lineHeight} ${semantic.font.body};
      color: ${semantic.color.text.secondary};
      margin: 0;
      text-align: left;
    `,
    select: css`
      /* The platform chevron is drawn in the OS accent, which reads as foreign
         next to the rest of the panel — draw our own from currentColor instead
         so it follows the theme. */
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      box-sizing: border-box;
      padding: ${semantic.padding.controlBlock} 28px
        ${semantic.padding.controlBlock} ${semantic.padding.controlInline};
      border-radius: ${semantic.radius.control};
      background-color: ${semantic.color.surface.elevated};
      background-image:
        linear-gradient(45deg, transparent 50%, currentColor 50%),
        linear-gradient(135deg, currentColor 50%, transparent 50%);
      background-position:
        right 14px center,
        right 9px center;
      background-size:
        5px 5px,
        5px 5px;
      background-repeat: no-repeat;
      color: ${semantic.color.text.primary};
      border: 1px solid ${semantic.color.border.control};
      font: ${semantic.type.bodySm.weight} ${semantic.type.bodySm.size} /
        ${semantic.type.bodySm.lineHeight} ${semantic.font.body};
      transition:
        border-color 0.15s ease,
        background-color 0.15s ease;
      cursor: pointer;

      &:hover {
        border-color: ${semantic.color.border.focus};
      }

      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
      /* The custom chevron is decorative; let the platform draw its own when
         the user forces system colours. */
      @media (forced-colors: active) {
        appearance: auto;
        background-image: none;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `,
    inputWrapper: css`
      width: 100%;
      max-width: ${wrapperSize}px;
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.tight};
    `,
    inputContainer: css`
      width: 100%;
      &::selection,
      & *::selection {
        background: ${semantic.color.state.selectionFill};
        color: ${semantic.color.state.selectionText};
      }
    `,
    inputLabel: css`
      font: ${semantic.type.labelSm.weight} ${semantic.type.labelSm.size} /
        ${semantic.type.labelSm.lineHeight} ${semantic.font.body};
      letter-spacing: ${semantic.type.labelSm.tracking};
      color: ${semantic.color.text.primary};
      text-align: left;
    `,
    inputDescription: css`
      font: ${semantic.type.bodyXs.weight} ${semantic.type.bodyXs.size} /
        ${semantic.type.bodyXs.lineHeight} ${semantic.font.body};
      color: ${semantic.color.text.secondary};
      margin: 0;
      text-align: left;
    `,
    input: css`
      appearance: none;
      box-sizing: border-box;
      width: 100%;
      padding: ${semantic.padding.controlBlock}
        ${semantic.padding.controlInline};
      border-radius: ${semantic.radius.control};
      background-color: ${semantic.color.surface.elevated};
      color: ${semantic.color.text.primary};
      border: 1px solid ${semantic.color.border.control};
      font: ${semantic.type.bodySm.weight} ${semantic.type.bodySm.size} /
        ${semantic.type.bodySm.lineHeight} ${semantic.font.body};
      transition: all 0.15s ease;

      &::placeholder {
        color: ${semantic.color.text.secondary};
      }

      &:hover {
        border-color: ${semantic.color.border.focus};
      }

      &:focus {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }
    `,
    checkboxWrapper: css`
      display: flex;
      align-items: flex-start;
      gap: ${semantic.gap.control};
      cursor: pointer;
      user-select: none;
      padding: ${semantic.padding.controlBlock}
        ${semantic.padding.controlInline};
      border-radius: ${semantic.radius.control};
      transition: background-color 0.15s ease;

      &:hover {
        background-color: ${semantic.color.state.hover};
      }
    `,
    checkboxContainer: css`
      width: 100%;
      &::selection,
      & *::selection {
        background: ${semantic.color.state.selectionFill};
        color: ${semantic.color.state.selectionText};
      }
    `,
    checkboxLabelContainer: css`
      display: flex;
      flex-direction: column;
      gap: ${semantic.gap.tight};
      flex: 1;
    `,
    checkbox: css`
      appearance: none;
      width: ${semantic.space[4]};
      height: ${semantic.space[4]};
      border: 2px solid ${semantic.color.border.control};
      border-radius: ${semantic.radius.control};
      background-color: ${semantic.color.surface.elevated};
      display: grid;
      place-items: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
      margin-top: ${semantic.space[1]};

      &:hover {
        border-color: ${semantic.color.border.focus};
      }

      &:focus-visible {
        outline: 2px solid ${semantic.color.border.focus};
        outline-offset: 2px;
      }

      &:checked {
        background-color: ${semantic.color.state.selectionFill};
        border-color: ${semantic.color.state.selectionFill};
      }

      &:checked::after {
        content: '';
        width: ${semantic.space[1]};
        height: ${semantic.space[2]};
        border: solid ${semantic.color.state.selectionText};
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -3px;
      }
    `,
    checkboxLabel: css`
      color: ${semantic.color.text.primary};
      font: ${semantic.type.labelSm.weight} ${semantic.type.labelSm.size} /
        ${semantic.type.labelSm.lineHeight} ${semantic.font.body};
      letter-spacing: ${semantic.type.labelSm.tracking};
      text-align: left;
    `,
    checkboxDescription: css`
      color: ${semantic.color.text.secondary};
      font: ${semantic.type.bodyXs.weight} ${semantic.type.bodyXs.size} /
        ${semantic.type.bodyXs.lineHeight} ${semantic.font.body};
      text-align: left;
    `,
    button: {
      base: css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: ${semantic.font.body};
        font-size: ${semantic.type.bodyXs.size};
        line-height: ${semantic.type.bodyXs.lineHeight};
        font-weight: ${semantic.type.labelSm.weight};
        border-radius: ${semantic.radius.control};
        padding: ${semantic.padding.controlBlock}
          ${semantic.padding.controlInline};
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s,
          border 0.15s,
          box-shadow 0.15s;
        &:focus-visible {
          outline: 2px solid ${semantic.color.border.focus};
          outline-offset: 2px;
        }
        border-width: 1px;
        border-style: solid;
        &:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `,
      variant(variant: ButtonVariant, outline?: boolean, ghost?: boolean) {
        const v = buttonVariants[variant]
        if (ghost) {
          return v.ghost
        }
        if (outline) {
          return v.outline
        }
        return v.solid
      },
    },
    tag: {
      dot: (color: keyof typeof tokens.colors) => css`
        width: ${semantic.space[1]};
        height: ${semantic.space[1]};
        border-radius: 9999px;
        background-color: ${legacyTagColor(color)};
      `,
      base: css`
        display: flex;
        gap: ${semantic.gap.tight};
        box-sizing: border-box;
        background: ${semantic.color.surface.subtle};
        color: ${semantic.color.text.primary};
        border-radius: ${semantic.radius.control};
        font-size: ${semantic.type.bodyXs.size};
        line-height: ${semantic.type.bodyXs.lineHeight};
        font-family: ${semantic.font.body};
        padding: ${semantic.padding.controlBlock}
          ${semantic.padding.controlInline};
        align-items: center;
        font-weight: ${semantic.type.labelSm.weight};
        border: 1px solid ${semantic.color.border.control};
        user-select: none;
        position: relative;
        &::selection,
        & *::selection {
          background: ${semantic.color.state.selectionFill};
          color: ${semantic.color.state.selectionText};
        }
        &:focus-visible {
          outline-offset: 2px;
          outline: 2px solid ${semantic.color.border.focus};
        }
      `,
      label: css`
        font-size: ${semantic.type.bodyXs.size};
        line-height: ${semantic.type.bodyXs.lineHeight};
        font-family: ${semantic.font.body};
        letter-spacing: ${semantic.type.labelSm.tracking};
      `,
      count: css`
        font-size: ${semantic.type.bodyXs.size};
        padding: 0 ${semantic.space[1]};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${semantic.color.text.secondary};
        background-color: ${semantic.color.state.hover};
        border-radius: ${semantic.radius.control};
        line-height: ${semantic.type.bodyXs.lineHeight};
        font-family: ${semantic.font.body};
        font-variant-numeric: tabular-nums;
        min-height: ${semantic.space[4]};
      `,
    },
    tree: {
      info: css`
        color: ${semantic.color.text.secondary};
        font-size: ${semantic.type.bodyXs.size};
        margin-right: ${semantic.space[1]};
      `,
      actionButton: css`
        background-color: transparent;
        color: ${semantic.color.text.secondary};
        border: none;
        display: inline-flex;
        padding: 0;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        width: ${semantic.space[3]};
        height: ${semantic.space[3]};
        position: relative;
        z-index: 1;

        &:hover svg {
          color: ${semantic.color.text.primary};
        }

        &:focus-visible {
          border-radius: ${semantic.radius.control};
          outline: 2px solid ${semantic.color.border.focus};
          outline-offset: 2px;
        }
      `,
      actionSuccess: css`
        color: ${semantic.color.status.success.text};
      `,
      actionError: css`
        color: ${semantic.color.status.error.text};
      `,
      expanderContainer: css`
        position: relative;
      `,
      expander: css`
        position: absolute;
        cursor: pointer;
        left: -16px;
        top: 3px;
        & path {
          stroke: ${semantic.color.text.link};
        }
        & svg {
          width: ${semantic.space[3]};
          height: ${semantic.space[3]};
        }

        display: inline-flex;
        align-items: center;
        transition: all 0.1s ease;
        &:focus-visible {
          border-radius: ${semantic.radius.control};
          outline: 2px solid ${semantic.color.border.focus};
          outline-offset: 2px;
        }
      `,
      expandedLine: (hasBorder: boolean) => css`
        display: block;
        padding-left: ${semantic.space[3]};
        margin-left: -${semantic.space[3]};
        ${hasBorder
          ? `border-left: 1px solid ${semantic.color.border.decorative};`
          : ''}
      `,
      collapsible: css`
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background-color: ${semantic.color.state.hover};
          border-radius: ${semantic.radius.control};
          padding: 0 ${semantic.space[1]};
        }
      `,
      actions: css`
        display: inline-flex;
        margin-left: ${semantic.space[2]};
        gap: ${semantic.gap.control};
        align-items: center;
        & svg {
          height: 12px;
          width: 12px;
        }
      `,
      valueCollapsed: css`
        color: ${semantic.color.text.secondary};
      `,
      valueFunction: css`
        color: ${semantic.color.syntax.keyword};
      `,
      valueString: css`
        color: ${semantic.color.syntax.string};
      `,
      valueNumber: css`
        color: ${semantic.color.syntax.number};
      `,
      valueBoolean: css`
        color: ${semantic.color.syntax.keyword};
      `,
      valueNull: css`
        color: ${semantic.color.syntax.comment};
        font-style: italic;
      `,
      valueKey: css`
        color: ${semantic.color.syntax.property};
      `,
      valueBraces: css`
        color: ${semantic.color.syntax.punctuation};
      `,
      valueContainer: (isRoot: boolean) => css`
        display: block;
        font-family: ${semantic.font.mono};
        &::selection,
        & *::selection {
          background: ${semantic.color.state.selectionFill};
          color: ${semantic.color.state.selectionText};
        }
        & [data-tsd-syntax]::selection {
          background: ${semantic.color.syntax.selectionFill};
          color: ${semantic.color.syntax.selectionText};
        }
        margin-left: ${isRoot ? '0' : semantic.space[4]};

        &:not(:hover) .actions {
          display: none;
        }

        &:hover .actions {
          display: inline-flex;
        }
      `,
    },
    header: {
      row: css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        &::selection,
        & *::selection {
          background: ${semantic.color.state.selectionFill};
          color: ${semantic.color.state.selectionText};
        }
        padding: ${semantic.space[2]} ${semantic.space[3]};
        gap: ${semantic.gap.control};
        background: ${semantic.color.surface.elevated};
        color: ${semantic.color.text.primary};
        border-bottom: ${semantic.color.border.decorative} 1px solid;
        align-items: center;
      `,
      logoAndToggleContainer: css`
        display: flex;
        gap: ${semantic.gap.section};
        align-items: center;
        & > button {
          padding: 0;
          background: transparent;
          border: none;
          display: flex;
          gap: ${semantic.gap.tight};
          flex-direction: column;
        }
      `,
      logo: css`
        cursor: pointer;
        display: flex;
        flex-direction: column;
        background-color: transparent;
        border: none;
        gap: ${semantic.gap.tight};
        padding: 0;
        &:hover {
          opacity: 0.7;
        }
        &:focus-visible {
          outline-offset: 2px;
          border-radius: ${semantic.radius.control};
          outline: 2px solid ${semantic.color.border.focus};
        }
      `,
      tanstackLogo: css`
        font-size: ${semantic.type.headingPane.size};
        line-height: ${semantic.type.headingPane.lineHeight};
        font-family: ${semantic.font.display};
        font-weight: ${semantic.type.headingPane.weight};
        white-space: nowrap;
        color: ${semantic.color.text.primary};
      `,
      flavorLogo: (flavorLight: string, flavorDark: string) => css`
        font-weight: ${semantic.type.labelSm.weight};
        font-size: ${semantic.type.labelSm.size};
        line-height: ${semantic.type.labelSm.lineHeight};
        font-family: ${semantic.font.body};
        letter-spacing: ${semantic.type.labelSm.tracking};
        color: ${t(flavorLight, flavorDark)};
        white-space: nowrap;
      `,
    },
    section: {
      main: css`
        margin-bottom: ${semantic.space[4]};
        padding: ${semantic.space[4]};
        background-color: ${semantic.color.surface.subtle};
        border: 1px solid ${semantic.color.border.decorative};
        border-radius: ${semantic.radius.overlay};
        box-shadow: ${semantic.shadow.xs};
        &::selection,
        & *::selection {
          background: ${semantic.color.state.selectionFill};
          color: ${semantic.color.state.selectionText};
        }
      `,
      title: css`
        font-size: ${semantic.type.headingPane.size};
        line-height: ${semantic.type.headingPane.lineHeight};
        font-weight: ${semantic.type.headingPane.weight};
        color: ${semantic.color.text.primary};
        font-family: ${semantic.font.display};
        margin: 0 0 ${semantic.space[3]} 0;
        padding-bottom: ${semantic.space[2]};
        border-bottom: 1px solid ${semantic.color.border.decorative};
        display: flex;
        align-items: center;
        gap: ${semantic.gap.control};
        text-align: left;
      `,
      icon: css`
        height: 18px;
        width: 18px;
        & > svg {
          height: 100%;
          width: 100%;
        }
        color: ${semantic.color.text.secondary};
      `,
      description: css`
        color: ${semantic.color.text.secondary};
        font: ${semantic.type.bodyXs.weight} ${semantic.type.bodyXs.size} /
          ${semantic.type.bodyXs.lineHeight} ${semantic.font.body};
        margin: 0 0 ${semantic.space[4]} 0;
        text-align: left;
      `,
    },
    mainPanel: {
      panel: (withPadding: boolean) => css`
        /* space[4] keeps the panel's own gutter equal to the workbench gutter,
           so a destination's content lines up with the tab strip above it. */
        padding: ${withPadding ? semantic.space[4] : 0};
        background: ${semantic.color.surface.workspace};
        color: ${semantic.color.text.primary};
        overflow-y: auto;
        /* Keep a scroll gesture inside the devtools instead of chaining it on
           to the host page once this panel hits its end. */
        overscroll-behavior: contain;
        height: 100%;
        &::selection,
        & *::selection {
          background: ${semantic.color.state.selectionFill};
          color: ${semantic.color.state.selectionText};
        }
      `,
    },
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
