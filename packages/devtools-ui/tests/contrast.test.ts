import { describe, expect, it } from 'vitest'
import { resolveSemanticTheme } from '../src/styles/semantic-theme'

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => {
      const channel = Number.parseInt(value, 16) / 255
      return channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4)
    })
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function ratio(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (values[0]! + 0.05) / (values[1]! + 0.05)
}

describe.each(['light', 'dark'] as const)('%s semantic contrast', (mode) => {
  const theme = resolveSemanticTheme(mode)
  const background = mode === 'light' ? '#ffffff' : '#1f1f1f'
  const syntaxBackground = mode === 'light' ? '#fafafa' : '#1f1f1f'

  it('keeps text, controls, statuses, syntax, and selections perceivable', () => {
    expect(theme.color.surface.app).toBe(
      mode === 'light' ? '#ffffff' : '#111111',
    )
    expect(theme.color.surface.workspace).toBe(background)
    expect(theme.color.surface.subtle).toBe(
      mode === 'light' ? '#fafafa' : '#1b1b1b',
    )
    for (const color of [
      theme.color.text.primary,
      theme.color.text.secondary,
      theme.color.text.link,
    ])
      expect(ratio(color, background)).toBeGreaterThanOrEqual(4.5)
    expect(
      ratio(theme.color.border.control, background),
    ).toBeGreaterThanOrEqual(3)
    expect(ratio(theme.color.border.focus, background)).toBeGreaterThanOrEqual(
      3,
    )
    for (const surface of [
      theme.color.surface.app,
      theme.color.surface.workspace,
      theme.color.surface.subtle,
    ]) {
      expect(ratio(theme.color.text.muted, surface)).toBeGreaterThanOrEqual(4.5)
    }
    expect(
      ratio(theme.color.text.mutedOnBrand, theme.color.surface.brand),
    ).toBeGreaterThanOrEqual(4.5)
    expect(
      ratio(theme.color.state.selectionText, theme.color.state.selectionFill),
    ).toBeGreaterThanOrEqual(4.5)

    for (const status of Object.values(theme.color.status)) {
      expect(ratio(status.text, status.subtleFill)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(status.border, status.subtleFill)).toBeGreaterThanOrEqual(3)
      expect(ratio(status.onFill, status.solidFill)).toBeGreaterThanOrEqual(4.5)
    }

    for (const color of Object.values(theme.color.syntax).slice(0, 6))
      expect(ratio(color, syntaxBackground)).toBeGreaterThanOrEqual(4.5)
    expect(
      ratio(theme.color.syntax.selectionText, theme.color.syntax.selectionFill),
    ).toBeGreaterThanOrEqual(4.5)
  })
})

it('locks the audited light text colors', () => {
  expect(ratio('#3e3529', '#ffffff')).toBeCloseTo(12.03, 2)
  expect(ratio('#3e3529', '#fafafa')).toBeCloseTo(11.52, 2)
  expect(ratio('#003e53', '#ffffff')).toBeCloseTo(11.58, 2)
  expect(ratio('#003e53', '#fafafa')).toBeCloseTo(11.09, 2)
})
