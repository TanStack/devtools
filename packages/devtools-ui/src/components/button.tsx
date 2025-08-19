import { splitProps } from 'solid-js';
import * as goober from 'goober';
import { tokens } from '../styles/tokens';
import type { JSX } from 'solid-js';

type MainVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'warning';
type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: MainVariant;
  outline?: boolean;
  ghost?: boolean;
  children?: any;
  className?: string;
};

const variantColors: Record<MainVariant, { bg: string; hover: string; active: string; text: string; border: string }> = {
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
};

const buttonBase = goober.css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${tokens.font.fontFamily.sans};
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 0.2rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s;
  outline: none;
  border-width: 1px;
  border-style: solid;
`;

function getButtonStyle(variant: MainVariant, outline?: boolean, ghost?: boolean) {
  const v = variantColors[variant];
  if (ghost) {
    return goober.css`
      background: transparent;
      color: ${v.bg};
      border-color: transparent;
      &:hover {
        background: ${tokens.colors.purple[100]};
      }
      &:active {
        background: ${tokens.colors.purple[200]};
      }
    `;
  }
  if (outline) {
    return goober.css`
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
    `;
  }
  // Default solid button
  return goober.css`
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
  `;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'outline', 'ghost', 'children', 'className']);
  const variant = local.variant || 'primary';
  const style = getButtonStyle(variant, local.outline, local.ghost);
  const classes = [buttonBase, style, local.className].filter(Boolean).join(' ');

  return (
    <button
      {...rest}
      class={classes}
    >
      {local.children}
    </button>
  );
}
