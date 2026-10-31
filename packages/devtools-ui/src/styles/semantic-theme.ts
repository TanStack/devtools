import bricolageGrotesqueUrl from '../assets/fonts/BricolageGrotesque-Bold.ttf?url&no-inline'
import interUrl from '../assets/fonts/Inter-latin.woff2?url&no-inline'
import type { TanStackDevtoolsTheme } from '../components/theme'

export const DEVTOOLS_FONT_STYLE_ID = 'tanstack-devtools-fonts'
export const DEVTOOLS_FORCED_COLORS_STYLE_ID = 'tanstack-devtools-forced-colors'

export const forcedColorsCss = `
@media (forced-colors: active) {
  [data-tsd-surface] { forced-color-adjust: auto; background: Canvas; color: CanvasText; }
  [data-tsd-control] { forced-color-adjust: auto; background: ButtonFace; color: ButtonText; border-color: ButtonText; }
  [data-tsd-selected="true"] { background: Highlight; color: HighlightText; border-color: HighlightText; }
  [data-tsd-separator] { border-color: CanvasText; }
  [data-tsd-separator="resize"] { border: 1px solid CanvasText; }
  [data-tsd-control]:focus-visible { outline: 2px solid ButtonText; outline-offset: 2px; }
}`

export const devtoolsFontCss = `
@font-face {
  font-family: 'Bricolage Grotesque';
  src: url('${bricolageGrotesqueUrl}') format('truetype');
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('${interUrl}') format('woff2');
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}`

export function ensureDevtoolsFonts(targetDocument: Document): void {
  if (targetDocument.getElementById(DEVTOOLS_FONT_STYLE_ID)) return

  const style = targetDocument.createElement('style')
  style.id = DEVTOOLS_FONT_STYLE_ID
  style.textContent = devtoolsFontCss
  targetDocument.head.append(style)
}

export function ensureDevtoolsStyles(targetDocument: Document): void {
  ensureDevtoolsFonts(targetDocument)
  if (targetDocument.getElementById(DEVTOOLS_FORCED_COLORS_STYLE_ID)) return
  const style = targetDocument.createElement('style')
  style.id = DEVTOOLS_FORCED_COLORS_STYLE_ID
  style.textContent = forcedColorsCss
  targetDocument.head.append(style)
}

export type StatusRole = 'success' | 'warning' | 'error' | 'info' | 'neutral'

type DeepReadonly<T> = T extends (...args: Array<never>) => unknown
  ? T
  : T extends object
    ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
    : T

export type SemanticTheme = DeepReadonly<{
  font: {
    display: string
    body: string
    mono: string
  }
  space: { 1: '4px'; 2: '8px'; 3: '12px'; 4: '16px' }
  gap: {
    tight: '4px'
    control: '8px'
    section: '12px'
    sectionLarge: '16px'
  }
  padding: { controlBlock: '6px'; controlInline: '8px' }
  type: {
    bodyXs: { size: '12px'; lineHeight: '17px'; weight: 400 }
    bodySm: { size: '14px'; lineHeight: '20px'; weight: 400 }
    bodyMd: { size: '16px'; lineHeight: '24px'; weight: 300 }
    labelSm: {
      size: '12px'
      lineHeight: '14px'
      weight: 500
      tracking: '0.5px'
    }
    headingCompact: { size: '14px'; lineHeight: '18px'; weight: 700 }
    headingPane: { size: '16px'; lineHeight: '21px'; weight: 700 }
  }
  radius: { control: '4px'; group: '6px'; overlay: '8px' }
  shadow: { xs: string; sm: string; overlay: string }
  motion: { strip: '120ms'; graceMs: 400 }
  color: {
    surface: {
      app: string
      workspace: string
      subtle: string
      elevated: string
      brand: string
    }
    text: {
      primary: string
      secondary: string
      muted: string
      mutedOnBrand: string
      inverse: string
      link: string
    }
    border: { decorative: string; control: string; focus: string }
    state: {
      hover: string
      pressed: string
      selectionFill: string
      selectionText: string
    }
    status: Record<
      StatusRole,
      {
        subtleFill: string
        border: string
        text: string
        solidFill: string
        onFill: string
      }
    >
    syntax: {
      keyword: string
      string: string
      number: string
      comment: string
      property: string
      punctuation: string
      selectionFill: string
      selectionText: string
    }
  }
}>

function deepFreeze<const TValue extends object>(value: TValue) {
  for (const nestedValue of Object.values(value)) {
    if (nestedValue !== null && typeof nestedValue === 'object') {
      deepFreeze(nestedValue)
    }
  }

  return Object.freeze(value)
}

const commonTheme = {
  font: {
    display: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  space: { 1: '4px', 2: '8px', 3: '12px', 4: '16px' },
  gap: {
    tight: '4px',
    control: '8px',
    section: '12px',
    sectionLarge: '16px',
  },
  padding: { controlBlock: '6px', controlInline: '8px' },
  type: {
    bodyXs: { size: '12px', lineHeight: '17px', weight: 400 },
    bodySm: { size: '14px', lineHeight: '20px', weight: 400 },
    bodyMd: { size: '16px', lineHeight: '24px', weight: 300 },
    labelSm: {
      size: '12px',
      lineHeight: '14px',
      weight: 500,
      tracking: '0.5px',
    },
    headingCompact: {
      size: '14px',
      lineHeight: '18px',
      weight: 700,
    },
    headingPane: { size: '16px', lineHeight: '21px', weight: 700 },
  },
  radius: { control: '4px', group: '6px', overlay: '8px' },
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.03)',
    sm: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    overlay: '0 25px 50px -12px rgba(0,0,0,0.20)',
  },
  motion: { strip: '120ms', graceMs: 400 },
} satisfies Omit<SemanticTheme, 'color'>

export const semanticThemes = deepFreeze({
  light: {
    ...commonTheme,
    color: {
      surface: {
        app: '#ffffff',
        workspace: '#ffffff',
        subtle: '#fafafa',
        elevated: '#ffffff',
        brand: '#eeebd4',
      },
      text: {
        primary: '#111111',
        secondary: '#3e3529',
        muted: '#756c5b',
        mutedOnBrand: '#3e3529',
        inverse: '#ffffff',
        link: '#003e53',
      },
      border: {
        decorative: '#eeebd4',
        control: '#756c5b',
        focus: '#003e53',
      },
      state: {
        hover: '#1111110f',
        pressed: '#1111111f',
        selectionFill: '#3e3529',
        selectionText: '#ffffff',
      },
      status: {
        success: {
          subtleFill: '#d8f0da',
          border: '#1d4226',
          text: '#1d4226',
          solidFill: '#1d4226',
          onFill: '#ffffff',
        },
        warning: {
          subtleFill: '#fef6cc',
          border: '#624a00',
          text: '#624a00',
          solidFill: '#624a00',
          onFill: '#ffffff',
        },
        error: {
          subtleFill: '#f9d8c4',
          border: '#5f1a06',
          text: '#5f1a06',
          solidFill: '#5f1a06',
          onFill: '#ffffff',
        },
        info: {
          subtleFill: '#d8f0f3',
          border: '#003e53',
          text: '#003e53',
          solidFill: '#003e53',
          onFill: '#ffffff',
        },
        neutral: {
          subtleFill: '#eeebd4',
          border: '#756c5b',
          text: '#3e3529',
          solidFill: '#3e3529',
          onFill: '#ffffff',
        },
      },
      syntax: {
        keyword: '#5f1a06',
        string: '#1d4226',
        number: '#541f5d',
        comment: '#756c5b',
        property: '#003e53',
        punctuation: '#3e3529',
        selectionFill: '#d8f0f3',
        selectionText: '#003e53',
      },
    },
  },
  dark: {
    ...commonTheme,
    color: {
      surface: {
        app: '#111111',
        workspace: '#1f1f1f',
        subtle: '#1b1b1b',
        elevated: '#2b2b2b',
        brand: '#111111',
      },
      text: {
        primary: '#ffffff',
        secondary: '#aea691',
        muted: '#aea691',
        mutedOnBrand: '#aea691',
        inverse: '#111111',
        link: '#9cd5e2',
      },
      border: { decorative: '#2d2d2d', control: '#aea691', focus: '#61adbf' },
      state: {
        hover: '#ffffff14',
        pressed: '#ffffff1f',
        selectionFill: '#c5c3bf',
        selectionText: '#111111',
      },
      status: {
        success: {
          subtleFill: '#1d4226',
          border: '#69bc75',
          text: '#a2e1a9',
          solidFill: '#69bc75',
          onFill: '#111111',
        },
        warning: {
          subtleFill: '#624a00',
          border: '#f4d648',
          text: '#fae884',
          solidFill: '#f4d648',
          onFill: '#111111',
        },
        error: {
          subtleFill: '#5f1a06',
          border: '#e06e49',
          text: '#edaa8d',
          solidFill: '#e06e49',
          onFill: '#111111',
        },
        info: {
          subtleFill: '#003e53',
          border: '#61adbf',
          text: '#9cd5e2',
          solidFill: '#61adbf',
          onFill: '#111111',
        },
        neutral: {
          subtleFill: '#2b2b2b',
          border: '#aea691',
          text: '#c5c3bf',
          solidFill: '#c5c3bf',
          onFill: '#111111',
        },
      },
      syntax: {
        keyword: '#e06e49',
        string: '#69bc75',
        number: '#c56dcf',
        comment: '#aea691',
        property: '#61adbf',
        punctuation: '#c5c3bf',
        selectionFill: '#003e53',
        selectionText: '#ffffff',
      },
    },
  },
} as const satisfies Record<TanStackDevtoolsTheme, SemanticTheme>)

export function resolveSemanticTheme(
  theme: TanStackDevtoolsTheme,
): SemanticTheme {
  return semanticThemes[theme]
}
