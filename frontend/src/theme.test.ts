/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type Rgb = readonly [number, number, number]
type Theme = 'light' | 'dark'

const toRgb = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const linear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = ([r, g, b]: Rgb): number =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

const contrast = (a: Rgb, b: Rgb): number => {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// color-mix(in srgb, foreground 12%, background)
const tint = (foreground: Rgb, background: Rgb): Rgb => [
  foreground[0] * 0.12 + background[0] * 0.88,
  foreground[1] * 0.12 + background[1] * 0.88,
  foreground[2] * 0.12 + background[2] * 0.88,
]

const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8')

// Reads `--name: light-dark(#light, #dark)` from index.css, the single source of truth.
const token = (name: string, theme: Theme): Rgb => {
  const pattern = new RegExp(
    `--${name}:\\s*light-dark\\(\\s*(#[0-9a-fA-F]{6})\\s*,\\s*(#[0-9a-fA-F]{6})\\s*\\)`,
  )
  const match = pattern.exec(css)
  if (!match) throw new Error(`--${name} is not a light-dark(#hex, #hex) token in index.css`)
  return toRgb(match[theme === 'light' ? 1 : 2] as string)
}

// WCAG AA for normal text.
const MINIMUM = 4.5

const textTokens = ['text', 'text-strong', 'accent', 'subtitle', 'danger']
const tagTokens = ['tag-skill', 'tag-tool', 'tag-methodology']

describe('contrast function', () => {
  it('measures black on white at 21:1', () => {
    expect(contrast(toRgb('#000000'), toRgb('#ffffff'))).toBeCloseTo(21, 5)
  })
})

describe.each<Theme>(['light', 'dark'])('%s theme contrast', (theme) => {
  describe.each(['bg', 'surface'])('on --%s', (ground) => {
    it.each(textTokens)(`--%s reaches ${MINIMUM}:1`, (name) => {
      expect(contrast(token(name, theme), token(ground, theme))).toBeGreaterThanOrEqual(MINIMUM)
    })

    it.each(tagTokens)(`--%s reaches ${MINIMUM}:1 on its 12% tint`, (name) => {
      const colour = token(name, theme)
      const background = tint(colour, token(ground, theme))
      expect(contrast(colour, background)).toBeGreaterThanOrEqual(MINIMUM)
    })
  })
})
