import { resolveSemanticTheme, semanticThemes } from '../src/internal'
import type { SemanticTheme } from '../src/internal'
import { tokens } from '../src/styles/tokens'
import { describe, expect, expectTypeOf, it } from 'vitest'

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
    headingCompact: { size: '14px', lineHeight: '18px', weight: 700 },
    headingPane: { size: '16px', lineHeight: '21px', weight: 700 },
  },
  radius: { control: '4px', group: '6px', overlay: '8px' },
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.03)',
    sm: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    overlay: '0 25px 50px -12px rgba(0,0,0,0.20)',
  },
  motion: { strip: '120ms', graceMs: 400 },
}

const expectedLight = {
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
    border: { decorative: '#eeebd4', control: '#756c5b', focus: '#003e53' },
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
}

const expectedDark = {
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
}

function expectDeeplyFrozen(value: unknown): void {
  if (value === null || typeof value !== 'object') return

  expect(Object.isFrozen(value)).toBe(true)
  for (const nestedValue of Object.values(value)) {
    expectDeeplyFrozen(nestedValue)
  }
}

describe('semantic themes', () => {
  it('defines the complete light and dark contracts', () => {
    expect(semanticThemes.light).toEqual(expectedLight)
    expect(semanticThemes.dark).toEqual(expectedDark)
    expect(Object.keys(semanticThemes)).toEqual(['light', 'dark'])
  })

  it('resolves each closed theme mode', () => {
    expect(resolveSemanticTheme('light')).toEqual(expectedLight)
    expect(resolveSemanticTheme('dark')).toEqual(expectedDark)
  })

  it('retains literal structural token types', () => {
    expectTypeOf(semanticThemes.light.space[1]).toEqualTypeOf<'4px'>()
    expectTypeOf(semanticThemes.light.gap.sectionLarge).toEqualTypeOf<'16px'>()
    expectTypeOf(
      semanticThemes.light.padding.controlBlock,
    ).toEqualTypeOf<'6px'>()
    expectTypeOf(
      semanticThemes.light.type.labelSm.tracking,
    ).toEqualTypeOf<'0.5px'>()
    expectTypeOf(semanticThemes.light.type.bodyMd.weight).toEqualTypeOf<300>()
    expectTypeOf(semanticThemes.light.radius.overlay).toEqualTypeOf<'8px'>()
    expectTypeOf(semanticThemes.light.motion.graceMs).toEqualTypeOf<400>()
    expectTypeOf<SemanticTheme['space']>().toEqualTypeOf<
      Readonly<{ 1: '4px'; 2: '8px'; 3: '12px'; 4: '16px' }>
    >()
    expectTypeOf<SemanticTheme['color']['surface']>().toEqualTypeOf<
      Readonly<{
        app: string
        workspace: string
        subtle: string
        elevated: string
        brand: string
      }>
    >()
  })

  it('freezes every object in both theme graphs', () => {
    expectDeeplyFrozen(semanticThemes)
  })

  it('rejects mutations and keeps modes isolated', () => {
    const originalLightApp = semanticThemes.light.color.surface.app
    const originalDarkApp = semanticThemes.dark.color.surface.app

    expect(
      Reflect.set(semanticThemes.light.color.surface, 'app', '#ff00ff'),
    ).toBe(false)
    expect(semanticThemes.light.color.surface.app).toBe(originalLightApp)
    expect(semanticThemes.dark.color.surface.app).toBe(originalDarkApp)
  })

  it('preserves the legacy color token contract', () => {
    expect(Object.keys(tokens.colors)).toEqual([
      'inherit',
      'current',
      'transparent',
      'black',
      'white',
      'neutral',
      'darkGray',
      'gray',
      'blue',
      'green',
      'red',
      'yellow',
      'purple',
      'teal',
      'pink',
      'cyan',
    ])
  })
})
