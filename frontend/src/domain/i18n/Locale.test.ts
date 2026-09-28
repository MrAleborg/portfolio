import { resolveLocale } from '@/domain/i18n/Locale'

describe('resolveLocale', () => {
  it('picks French when the browser prefers French', () => {
    expect(resolveLocale(['fr-FR', 'en-US'])).toBe('fr')
  })

  it('picks English when the browser prefers English', () => {
    expect(resolveLocale(['en-GB', 'fr'])).toBe('en')
  })

  it('skips unsupported languages until it finds a supported one', () => {
    expect(resolveLocale(['de-DE', 'fr-CH'])).toBe('fr')
  })

  it('falls back to English when no language is supported', () => {
    expect(resolveLocale(['de-DE', 'es'])).toBe('en')
  })

  it('falls back to English when the browser gives no language', () => {
    expect(resolveLocale([])).toBe('en')
  })
})
