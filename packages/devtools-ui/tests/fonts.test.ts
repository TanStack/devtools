import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEVTOOLS_FONT_STYLE_ID,
  devtoolsFontCss,
  ensureDevtoolsFonts,
} from '../src/internal'

const fontDirectory = join(process.cwd(), 'src', 'assets', 'fonts')
const expectedFontNames = ['BricolageGrotesque-Bold.ttf', 'Inter-latin.woff2']

async function sha256(path: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex')
}

describe('devtools fonts', () => {
  it('ships only the approved font binaries within the size budget', async () => {
    const names = (await readdir(fontDirectory))
      .filter((name) => /\.(?:ttf|woff2)$/.test(name))
      .sort()
    const sizes = await Promise.all(
      names.map(async (name) => (await stat(join(fontDirectory, name))).size),
    )

    expect(names).toEqual([...expectedFontNames].sort())
    expect(sizes.reduce((total, size) => total + size, 0)).toBeLessThanOrEqual(
      160 * 1024,
    )
  })

  it('retains both approved font licenses with pinned provenance', async () => {
    const bricolageLicensePath = join(
      fontDirectory,
      'OFL-Bricolage-Grotesque.txt',
    )
    const interLicensePath = join(fontDirectory, 'OFL-Inter.txt')
    const [bricolageLicense, interLicense] = await Promise.all([
      readFile(bricolageLicensePath, 'utf8'),
      readFile(interLicensePath, 'utf8'),
    ])

    expect(await sha256(bricolageLicensePath)).toBe(
      '46ba5f18ee20ea529f21d96c0ef8637a8314c1a5cfb2aa84018bc8157cbeff41',
    )
    expect(await stat(bricolageLicensePath)).toMatchObject({ size: 4402 })
    expect(bricolageLicense).toContain(
      'Copyright 2022 The Bricolage Grotesque Project Authors',
    )
    expect(bricolageLicense).toContain('SIL OPEN FONT LICENSE Version 1.1')
    expect(await stat(interLicensePath)).toMatchObject({ size: 4380 })
    expect(await sha256(interLicensePath)).toBe(
      '262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a',
    )
    expect(interLicense).toContain(
      'Copyright (c) 2016 The Inter Project Authors',
    )
    expect(interLicense).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })

  it('installs exactly one font style in each document', () => {
    const firstDocument = document.implementation.createHTMLDocument()
    const secondDocument = document.implementation.createHTMLDocument()

    ensureDevtoolsFonts(firstDocument)
    ensureDevtoolsFonts(firstDocument)
    ensureDevtoolsFonts(secondDocument)

    expect(
      firstDocument.querySelectorAll(`#${DEVTOOLS_FONT_STYLE_ID}`),
    ).toHaveLength(1)
    expect(
      secondDocument.querySelectorAll(`#${DEVTOOLS_FONT_STYLE_ID}`),
    ).toHaveLength(1)
  })

  it('defines both external font faces with swap rendering', () => {
    expect(devtoolsFontCss).toContain("font-family: 'Bricolage Grotesque'")
    expect(devtoolsFontCss).toContain('BricolageGrotesque-Bold.ttf')
    expect(devtoolsFontCss).toContain("format('truetype')")
    expect(devtoolsFontCss).toMatch(
      /font-family: 'Bricolage Grotesque'[\s\S]*font-weight:\s*700/,
    )
    expect(devtoolsFontCss).toContain("font-family: 'Inter'")
    expect(devtoolsFontCss).toContain('Inter-latin.woff2')
    expect(devtoolsFontCss).toContain("format('woff2')")
    expect(devtoolsFontCss).toMatch(
      /font-family: 'Inter'[\s\S]*font-weight:\s*100 900/,
    )
    expect(devtoolsFontCss.match(/font-display:\s*swap/g)).toHaveLength(2)
    expect(devtoolsFontCss).not.toMatch(/data:/i)
  })
})
