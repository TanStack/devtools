import * as goober from 'goober'
import { createSignal } from 'solid-js'
import { tokens } from './tokens'
import type { ButtonVariant } from '../components/button'

const buttonVariantColors: Record<
  ButtonVariant,
  { bg: string; hover: string; active: string; text: string; border: string }
> = {
  primary: {
    bg: tokens.colors.purple[500],
    hover: tokens.colors.purple[600],
    active: tokens.colors.purple[700],
    text: '#fff',
    border: tokens.colors.purple[500],
  },
  secondary: {
    bg: tokens.colors.gray[800],
    hover: tokens.colors.gray[700],
    active: tokens.colors.gray[600],
    text: tokens.colors.gray[100],
    border: tokens.colors.gray[700],
  },
  info: {
    bg: tokens.colors.blue[500],
    hover: tokens.colors.blue[600],
    active: tokens.colors.blue[700],
    text: '#fff',
    border: tokens.colors.blue[500],
  },
  warning: {
    bg: tokens.colors.yellow[500],
    hover: tokens.colors.yellow[600],
    active: tokens.colors.yellow[700],
    text: '#fff',
    border: tokens.colors.yellow[500],
  },
  danger: {
    bg: tokens.colors.red[500],
    hover: tokens.colors.red[600],
    active: tokens.colors.red[700],
    text: '#fff',
    border: tokens.colors.red[500],
  },
  success: {
    bg: tokens.colors.green[500],
    hover: tokens.colors.green[600],
    active: tokens.colors.green[700],
    text: '#fff',
    border: tokens.colors.green[500],
  },
}
const stylesFactory = (theme: 'light' | 'dark' = 'dark') => {
  const { colors, font, size, alpha, border } = tokens
  const { fontFamily } = font
  const css = goober.css
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  return {
    logo: css`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      width: ${size[12]};
      height: ${size[12]};
      font-family: ${fontFamily.sans};
      gap: ${tokens.size[0.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
    `,

    selectWrapper: css`
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    `,
    selectContainer: css`
      width: 100%;
    `,
    selectLabel: css`
      font-size: 0.875rem;
      font-weight: 500;
      color: ${colors.gray[100]};
      text-align: left;
    `,
    selectDescription: css`
      font-size: 0.8rem;
      color: ${colors.gray[400]};
      margin: 0;
      line-height: 1.3;
      text-align: left;
    `,
    select: css`
      appearance: none;
      width: 100%;
      padding: 0.75rem 3rem 0.75rem 0.75rem;
      border-radius: 0.5rem;
      background-color: ${colors.darkGray[800]};
      color: ${colors.gray[100]};
      border: 1px solid ${colors.gray[700]};
      font-size: 0.875rem;
      transition: all 0.2s ease;
      cursor: pointer;

      /* Custom arrow */
      background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1.25rem;

      &:hover {
        border-color: ${colors.gray[600]};
      }

      &:focus {
        outline: none;
        border-color: ${colors.purple[400]};
        box-shadow: 0 0 0 3px ${colors.purple[400]}${alpha[20]};
      }
    `,
    inputWrapper: css`
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    `,
    inputContainer: css`
      width: 100%;
    `,
    inputLabel: css`
      font-size: 0.875rem;
      font-weight: 500;
      color: ${colors.gray[100]};
      text-align: left;
    `,
    inputDescription: css`
      font-size: 0.8rem;
      color: ${colors.gray[400]};
      margin: 0;
      line-height: 1.3;
      text-align: left;
    `,
    input: css`
      appearance: none;
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background-color: ${colors.darkGray[800]};
      color: ${colors.gray[100]};
      border: 1px solid ${colors.gray[700]};
      font-size: 0.875rem;
      font-family: ${fontFamily.mono};
      transition: all 0.2s ease;

      &::placeholder {
        color: ${colors.gray[500]};
      }

      &:hover {
        border-color: ${colors.gray[600]};
      }

      &:focus {
        outline: none;
        border-color: ${colors.purple[400]};
        box-shadow: 0 0 0 3px ${colors.purple[400]}${alpha[20]};
      }
    `,
    checkboxWrapper: css`
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: ${colors.darkGray[800]};
      }
    `,
    checkboxContainer: css`
      width: 100%;
    `,
    checkboxLabelContainer: css`
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    `,
    checkbox: css`
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid ${colors.gray[700]};
      border-radius: 0.375rem;
      background-color: ${colors.darkGray[800]};
      display: grid;
      place-items: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-top: 0.125rem;

      &:hover {
        border-color: ${colors.purple[400]};
      }

      &:checked {
        background-color: ${colors.purple[500]};
        border-color: ${colors.purple[500]};
      }

      &:checked::after {
        content: '';
        width: 0.4rem;
        height: 0.6rem;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -3px;
      }
    `,
    checkboxLabel: css`
      color: ${colors.gray[100]};
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.4;
      text-align: left;
    `,
    checkboxDescription: css`
      color: ${colors.gray[400]};
      font-size: 0.8rem;
      line-height: 1.3;
      text-align: left;
    `,
    button: {
      base: css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: ${tokens.font.fontFamily.sans};
        font-size: 0.8rem;
        font-weight: 500;
        border-radius: 0.2rem;
        padding: 0.2rem 0.6rem;
        cursor: pointer;
        transition:
          background 0.2s,
          color 0.2s,
          border 0.2s,
          box-shadow 0.2s;
        outline: none;
        border-width: 1px;
        border-style: solid;
      `,
      variant(variant: ButtonVariant, outline?: boolean, ghost?: boolean) {
        const v = buttonVariantColors[variant]
        if (ghost) {
          return css`
            background: transparent;
            color: ${v.bg};
            border-color: transparent;
            &:hover {
              background: ${tokens.colors.purple[100]};
            }
            &:active {
              background: ${tokens.colors.purple[200]};
            }
          `
        }
        if (outline) {
          return css`
            background: transparent;
            color: ${v.bg};
            border-color: ${v.bg};
            &:hover {
              background: ${tokens.colors.purple[100]};
              border-color: ${v.hover};
            }
            &:active {
              background: ${tokens.colors.purple[200]};
              border-color: ${v.active};
            }
          `
        }
        // Default solid button
        return css`
          background: ${v.bg};
          color: ${v.text};
          border-color: ${v.border};
          &:hover {
            background: ${v.hover};
            border-color: ${v.hover};
          }
          &:active {
            background: ${v.active};
            border-color: ${v.active};
          }
        `
      },
    },
    tag: {
      dot: (color: keyof typeof tokens.colors) => css`
        width: ${tokens.size[1.5]};
        height: ${tokens.size[1.5]};
        border-radius: ${tokens.border.radius.full};
        background-color: ${tokens.colors[color][500]};
      `,
      base: css`
        display: flex;
        gap: ${tokens.size[1.5]};
        box-sizing: border-box;
        height: ${tokens.size[6.5]};
        background: ${t(colors.gray[50], colors.darkGray[500])};
        color: ${t(colors.gray[700], colors.gray[300])};
        border-radius: ${tokens.border.radius.sm};
        font-size: ${font.size.sm};
        padding: ${tokens.size[1]};
        padding-left: ${tokens.size[1.5]};
        align-items: center;
        font-weight: ${font.weight.medium};
        border: ${t('1px solid ' + colors.gray[300], '1px solid transparent')};
        user-select: none;
        position: relative;
        &:focus-visible {
          outline-offset: 2px;
          outline: 2px solid ${colors.blue[800]};
        }
      `,
      label: css`
        font-size: ${font.size.xs};
      `,
      count: css`
        font-size: ${font.size.xs};
        padding: 0 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${t(colors.gray[500], colors.gray[400])};
        background-color: ${t(colors.gray[200], colors.darkGray[300])};
        border-radius: 2px;
        font-variant-numeric: tabular-nums;
        height: ${tokens.size[4.5]};
      `,
    },
    tree: {
      collapsible: css`
        cursor: pointer;
        transition: all 0.2s ease;
        &:hover {
          background-color: ${colors.darkGray[700]};
          border-radius: ${tokens.border.radius.sm};
          padding: 0 ${tokens.size[1]};
        }
      `,
      valueCollapsed: css`
        color: ${colors.gray[400]};
      `,
      valueFunction: css`
        color: ${colors.cyan[400]};
      `,
      valueString: css`
        color: ${colors.green[400]};
      `,
      valueNumber: css`
        color: ${colors.yellow[400]};
      `,
      valueBoolean: css`
        color: ${colors.pink[400]};
      `,
      valueNull: css`
        color: ${colors.gray[400]};
        font-style: italic;
      `,
      valueKey: css`
        color: ${colors.blue[300]};
      `,
      valueBraces: css`
        color: ${colors.gray[500]};
      `,
      valueContainer: (isRoot: boolean) => css`
        display: block;
        margin-left: ${isRoot ? '0' : '1rem'};
      `,
    },
    header: {
      row: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${tokens.size[2]} ${tokens.size[2.5]};
      gap: ${tokens.size[2.5]};
      border-bottom: ${t(colors.gray[300], colors.darkGray[500])} 1px solid;
      align-items: center;
     
    `,
      logoAndToggleContainer: css`
      display: flex;
      gap: ${tokens.size[3]};
      align-items: center;
       & > button {
        padding: 0;
        background: transparent;
        border: none;
        display: flex;
        gap: ${size[0.5]};
        flex-direction: column;
      }
    `,
      logo: css`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      gap: ${tokens.size[0.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
      &:focus-visible {
        outline-offset: 4px;
        border-radius: ${border.radius.xs};
        outline: 2px solid ${colors.blue[800]};
      }
    `,
      tanstackLogo: css`
      font-size: ${font.size.md};
      font-weight: ${font.weight.bold};
      line-height: ${font.lineHeight.xs};
      white-space: nowrap;
      color: ${t(colors.gray[600], colors.gray[300])};
    `,
      flavorLogo: (flavorLight: string, flavorDark: string) => css`
      font-weight: ${font.weight.semibold};
      font-size: ${font.size.xs};
      background: linear-gradient(
        to right,
        ${t(flavorLight, flavorDark)}
      );
      background-clip: text;
      -webkit-background-clip: text;
      line-height: 1;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
    `,
    },
    section: {
      main: css`
        margin-bottom: 2rem;
        padding: 1.5rem;
        background-color: ${colors.darkGray[800]};
        border: 1px solid ${colors.gray[700]};
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      `,
      title: css`
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
      icon: css`
        height: 20px;
        width: 20px;
        & > svg {
          height: 100%;
          width: 100%;
        }
        color: ${colors.purple[400]};
      `,
      description: css`
        color: ${colors.gray[400]};
        font-size: 0.875rem;
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
        text-align: left;
      `,
    },
    mainPanel: {
      panel: css`
        padding: 0;
        background: ${colors.darkGray[700]};
        overflow-y: auto;
        height: 100%;
      `,
      withPadding: css`
        padding: ${tokens.size[4]};
      `,
    },
  }
}

export function useStyles() {
  const [_styles] = createSignal(stylesFactory())
  return _styles
}
