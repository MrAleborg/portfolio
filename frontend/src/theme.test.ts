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

// color-mix(in srgb, first <share>%, second)
const mix = (first: Rgb, share: number, second: Rgb): Rgb => [
  first[0] * share + second[0] * (1 - share),
  first[1] * share + second[1] * (1 - share),
  first[2] * share + second[2] * (1 - share),
]

// index.css is the single source of truth, read without its comments.
const css = readFileSync(join(import.meta.dirname, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const HEX = '#[0-9a-fA-F]{6}'

// Reads `--name: light-dark(#light, #dark)`, or an alias `--name: var(--other)` of such a token.
const token = (name: string, theme: Theme): Rgb => {
  const definitions = [...css.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, 'g'))]
  if (definitions.length !== 1) {
    throw new Error(`--${name} is defined ${definitions.length} times in index.css, not once`)
  }
  const value = (definitions[0]?.[1] ?? '').trim()
  const alias = /^var\(--([\w-]+)\)$/.exec(value)
  if (alias) return token(alias[1] as string, theme)
  const match = new RegExp(`^light-dark\\(\\s*(${HEX})\\s*,\\s*(${HEX})\\s*\\)$`).exec(value)
  if (!match) throw new Error(`--${name} is not a light-dark(#hex, #hex) token in index.css`)
  return toRgb(match[theme === 'light' ? 1 : 2] as string)
}

// WCAG AA for normal text.
const MINIMUM = 4.5

const textTokens = ['text', 'text-strong', 'accent', 'subtitle', 'danger']
const tagTokens = ['tag-skill', 'tag-tool', 'tag-methodology']

// TagList.css: the tint of a tag is its colour at 12% over --surface.
const tagTint = (name: string, theme: Theme): Rgb =>
  mix(token(name, theme), 0.12, token('surface', theme))

// ContactForm.css and HomePage.css: a filled button darkens to 85% accent over --text-strong on hover.
const buttonHover = (theme: Theme): Rgb =>
  mix(token('accent', theme), 0.85, token('text-strong', theme))

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
  })

  it.each(tagTokens)(`--%s reaches ${MINIMUM}:1 on its 12% tint over --surface`, (name) => {
    expect(contrast(token(name, theme), tagTint(name, theme))).toBeGreaterThanOrEqual(MINIMUM)
  })

  it.each(tagTokens)(`a note in --text reaches ${MINIMUM}:1 on the --%s tint`, (name) => {
    expect(contrast(token('text', theme), tagTint(name, theme))).toBeGreaterThanOrEqual(MINIMUM)
  })

  it(`--bg as text on a filled --accent button reaches ${MINIMUM}:1`, () => {
    expect(contrast(token('bg', theme), token('accent', theme))).toBeGreaterThanOrEqual(MINIMUM)
  })

  it(`--bg as text on the hovered filled button reaches ${MINIMUM}:1`, () => {
    expect(contrast(token('bg', theme), buttonHover(theme))).toBeGreaterThanOrEqual(MINIMUM)
  })
})
